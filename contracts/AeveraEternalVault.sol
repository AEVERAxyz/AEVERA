// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import {SSTORE2} from "solady/src/utils/SSTORE2.sol";
import "./interfaces/IAeveraVault.sol";

interface IGatewayURI {
    function constructTokenURI(uint256 id, IAeveraVault.CapsuleMetadata memory meta) external view returns (string memory);
}

contract AeveraEternalVault is ERC1155, Ownable, ERC2981, IAeveraVault {

    // --- STATE VARIABLES ---
    address public gateway;
    uint256 public nextTokenId = 1;

    // Speicher
    mapping(uint256 => CapsuleMetadata) public capsules;
    mapping(uint256 => uint256) public totalSupplyPerId;

    // UNIQUNESS & LOOKUP (Wiederhergestellt für volle Transparenz)
    mapping(string => uint256) public idByUuid;
    mapping(string => uint256) public idByShortId; // <--- NEU: Ermöglicht direkten Lookup im Frontend
    mapping(string => bool) public shortIdUsed; // Gibt ID zurück, 0 wenn frei

    // --- IRON LAWS ---
    string public constant name = "AEVERA";
    string public constant symbol = "AEVERA";
    uint256 public constant MAX_SUPPLY_PUBLIC = 100;
    uint256 public constant MAX_SUPPLY_PRIVATE = 1000;
    uint96 public constant ROYALTY_FEE = 777;

    // --- EVENTS ---
    event GatewayUpdated(address indexed oldGateway, address indexed newGateway);
    event CapsuleEngraved(uint256 indexed id, address indexed creator, bool isPrivate);

    modifier onlyGateway() {
        if (msg.sender != gateway) revert Vault_OnlyGateway();
        _;
    }

    constructor() ERC1155("") Ownable(msg.sender) {
        _setDefaultRoyalty(msg.sender, ROYALTY_FEE);
    }

    // --- ADMIN ---
    function setGateway(address _gateway) external onlyOwner {
        emit GatewayUpdated(gateway, _gateway);
        gateway = _gateway;
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(msg.sender).transfer(balance);
        }
    }

    // --- CORE LOGIC: ENGRAVING ---

    function engrave(
        address to, 
        EngraveData calldata data
    ) external override onlyGateway returns (uint256) {
        // 1. Check Uniqueness (Lookup)
        if (idByUuid[data.uuid] != 0) revert Vault_UUIDExists();
        if (shortIdUsed[data.shortId]) revert Vault_ShortIDExists();

        // 2. ID Generierung
        uint256 id = nextTokenId++;

        // 3. Speichern
        idByUuid[data.uuid] = id;
        idByShortId[data.shortId] = id; // <--- NEU: Speichert Verknüpfung ShortID -> ID
        shortIdUsed[data.shortId] = true;

        address pointer = SSTORE2.write(data.content);
        capsules[id] = CapsuleMetadata({
            creator: to,
            author: data.author,
            shortId: data.shortId,
            uuid: data.uuid,
            sealTime: uint40(block.timestamp),
            unlockTime: data.unlockTime,
            isPrivate: data.isPrivate,
            contentPointer: pointer
        });

        // 4. Minting (Erster Token)
        // Logik-Check: Supply-Limits sind Konstanten, 1 ist immer <= Limit.
        totalSupplyPerId[id] = 1;
        _mint(to, id, 1, "");

        emit CapsuleEngraved(id, to, data.isPrivate);
        return id;
    }

    // --- CORE LOGIC: MINTING COPIES ---

    function mint(address to, uint256 id, uint256 amount) external override onlyGateway {
        CapsuleMetadata memory meta = capsules[id];

        // 1. Existenz Check
        if (meta.creator == address(0)) revert Vault_NotEngraved();

        // 2. Privacy Check (Enforcement)
        if (meta.isPrivate) {
            if (to != meta.creator) revert Vault_PrivateContentRestricted();
        }

        // 3. Supply Check
        uint256 maxSupply = meta.isPrivate ? MAX_SUPPLY_PRIVATE : MAX_SUPPLY_PUBLIC;
        if (totalSupplyPerId[id] + amount > maxSupply) revert Vault_MaxSupplyReached();

        totalSupplyPerId[id] += amount;
        _mint(to, id, amount, "");
    }

    // --- VIEW FUNCTIONS ---

    function getMetadata(uint256 id) external view override returns (CapsuleMetadata memory) {
        return capsules[id];
    }

    // V1 PARITY: Time-Lock Enforcement
    function getContent(uint256 id) external view override returns (string memory) {
        CapsuleMetadata memory meta = capsules[id];

        // Wenn Private: Immer erlaubt (da verschlüsselt oder Owner liest)
        // Wenn Public & Zeit noch nicht reif: Blockieren!
        if (!meta.isPrivate && block.timestamp < meta.unlockTime) {
            revert Vault_Locked();
        }

        return string(SSTORE2.read(meta.contentPointer));
    }

    function uri(uint256 id) public view override returns (string memory) {
        if (capsules[id].creator == address(0)) return "";
        return IGatewayURI(gateway).constructTokenURI(id, capsules[id]);
    }

    // Metadata für OpenSea Collection
    function contractURI() public pure returns (string memory) {
        string memory description = string(abi.encodePacked(
            "AEVERA\\nBEYOND TIME\\nTHE EVERLASTING TRUTH\\n\\n",
            "In a world of vanishing moments, AEVERA is your anchor in time.\\n\\n",
            "aevera.xyz"
        ));
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(abi.encodePacked(
                '{"name": "AEVERA",',
                '"description": "', description, '",',
                '"external_link": "https://aevera.xyz"}'
            )))
        ));
    }

    // HYGIENE FIX: Interface Support korrekt melden
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, ERC2981) returns (bool) {
        return interfaceId == type(IAeveraVault).interfaceId || super.supportsInterface(interfaceId);
    }
}