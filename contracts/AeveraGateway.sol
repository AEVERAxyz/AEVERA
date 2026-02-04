// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// WICHTIG: Neue Imports für Sicherheit und Strings
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./interfaces/IAeveraVault.sol";

interface IAeveraVisuals {
    function render(IAeveraVault.CapsuleMetadata memory meta) external view returns (string memory);
}

contract AeveraGateway is Initializable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {

    IAeveraVault public vault;
    IERC20 public usdc;
    IAeveraVisuals public visuals;

    uint256 public mintPriceETH;
    uint256 public mintPriceUSDC;
    uint256 public maxChars;

    uint256 public constant MAX_BATCH_PUBLIC = 5;
    uint256 public constant MAX_BATCH_PRIVATE = 50;

    string public frontendHash;

    // --- NEUE VARIABLE (Am Ende angefügt für Storage Safety) ---
    address public appSigner; 

    event PricesUpdated(uint256 ethPrice, uint256 usdcPrice);
    event FrontendUpdated(string newHash);
    event FundsWithdrawn(address to, uint256 amountETH, uint256 amountUSDC);
    event VisualsUpdated(address newVisuals);
    event AppSignerUpdated(address newSigner); // Neu

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _vault, address _usdc, address _visuals) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        vault = IAeveraVault(_vault);
        usdc = IERC20(_usdc);
        visuals = IAeveraVisuals(_visuals);

        mintPriceETH = 0.000777 ether;
        mintPriceUSDC = 3330000;
        maxChars = 7777;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setVisuals(address _visuals) external onlyOwner {
        visuals = IAeveraVisuals(_visuals);
        emit VisualsUpdated(_visuals);
    }

    function setPrices(uint256 _ethPrice, uint256 _usdcPrice) external onlyOwner {
        mintPriceETH = _ethPrice;
        mintPriceUSDC = _usdcPrice;
        emit PricesUpdated(_ethPrice, _usdcPrice);
    }

    function updateFrontendHash(string memory _newHash) external onlyOwner {
        frontendHash = _newHash;
        emit FrontendUpdated(_newHash);
    }

    // --- NEU: Setzen des Backend-Signers ---
    function setAppSigner(address _signer) external onlyOwner {
        appSigner = _signer;
        emit AppSignerUpdated(_signer);
    }

    // --- LOGIK UPDATE: ENGRAVE MIT SIGNATUR & ID CHECK ---
    function engrave(
        address to,
        IAeveraVault.EngraveData calldata data,
        bool payWithUSDC,
        bytes calldata signature // NEU: Signatur Parameter
    ) external payable nonReentrant {

        // 1. SECURITY: Check ID Format (A-Z, 0-9, exakt 6 Zeichen)
        _validateShortId(data.shortId);

        require(data.content.length <= maxChars, "Too long");
        require(data.unlockTime > block.timestamp, "Future only");

        // 2. SECURITY: Anti-Spoofing Logik
        // Wir erstellen eine kopierbare Version der Daten (memory), da calldata read-only ist.
        IAeveraVault.EngraveData memory finalData = data;

        // Wir prüfen: Passt die Signatur zu (Sender + Name)?
        // Wenn NICHT: Überschreiben wir den Namen mit der Wallet-Adresse.
        if (!_verifySigner(msg.sender, data.author, signature)) {
             finalData.author = Strings.toHexString(msg.sender);
        }

        // 3. PAYMENT
        if (payWithUSDC) {
            require(msg.value == 0, "No ETH needed with USDC");
            require(usdc.transferFrom(msg.sender, address(this), mintPriceUSDC), "USDC failed");
        } else {
            require(msg.value >= mintPriceETH, "ETH low");
        }

        // 4. EXECUTE
        // Wir senden die BEREINIGTEN Daten (finalData) an den Vault
        vault.engrave(to, finalData);
    }

    function mintCopy(address to, uint256 id, uint256 amount, bool payWithUSDC) external payable nonReentrant {
        require(amount > 0, "Zero amount");
        IAeveraVault.CapsuleMetadata memory meta = vault.getMetadata(id);

        if (meta.isPrivate) {
            require(msg.sender == meta.creator, "Private: Author only");
        }

        uint256 maxBatch = meta.isPrivate ? MAX_BATCH_PRIVATE : MAX_BATCH_PUBLIC;
        require(amount <= maxBatch, "Batch limit");

        if (payWithUSDC) {
            require(msg.value == 0, "No ETH needed with USDC");
            require(usdc.transferFrom(msg.sender, address(this), mintPriceUSDC * amount), "USDC failed");
        } else {
            require(msg.value >= mintPriceETH * amount, "ETH low");
        }

        vault.mint(to, id, amount);
    }

    function withdraw() external onlyOwner {
        uint256 ethBal = address(this).balance;
        uint256 usdcBal = usdc.balanceOf(address(this));
        if (ethBal > 0) payable(msg.sender).transfer(ethBal);
        if (usdcBal > 0) usdc.transfer(msg.sender, usdcBal);
        emit FundsWithdrawn(msg.sender, ethBal, usdcBal);
    }

    function constructTokenURI(uint256, IAeveraVault.CapsuleMetadata memory meta) external view returns (string memory) {
        return visuals.render(meta);
    }

    // --- INTERNE HILFSFUNKTIONEN (SECURITY) ---

    function _verifySigner(address sender, string memory name, bytes calldata signature) internal view returns (bool) {
        // Wenn kein Signer gesetzt ist (z.B. Testphase), ist alles "unsicher" -> false (Fallback auf Wallet)
        if (appSigner == address(0)) return false;
        if (signature.length == 0) return false;

        // Hash erstellen: Wir binden die Wallet-Adresse an den Namen.
        bytes32 messageHash = keccak256(abi.encodePacked(sender, name));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);

        // Signer wiederherstellen
        (address recovered, ECDSA.RecoverError error, ) = ECDSA.tryRecover(ethSignedMessageHash, signature);

        if (error != ECDSA.RecoverError.NoError) {
            return false;
        }

        return recovered == appSigner;
    }

    function _validateShortId(string memory shortId) internal pure {
        bytes memory b = bytes(shortId);
        require(b.length == 6, "ID must be 6 chars");

        for(uint i; i < b.length; i++) {
            bytes1 char = b[i];
            // Erlaubt: 0-9 (0x30-0x39) UND A-Z (0x41-0x5A)
            if (
                !((char >= 0x30 && char <= 0x39) || (char >= 0x41 && char <= 0x5A))
            ) {
                revert("ID invalid chars");
            }
        }
    }
}