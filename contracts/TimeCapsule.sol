// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract TimeCapsule is ERC1155, Ownable, ERC2981 {
    using Strings for uint256;

    string public name = "TimeCapsule Editions";
    string public symbol = "TCE";
    uint256 public constant MAX_SUPPLY = 100;
    uint256 public constant MINT_PRICE = 0.000777 ether;

    // Deine gelassen.eth Adresse als Empfänger für Einnahmen und Royaltys
    address payable public treasury = payable(0xAda0fE15a97da69C1B0Dd5Aab21EfD20840f5c72);

    mapping(uint256 => uint256) public totalSupply;

    constructor() ERC1155("https://api.timecapsule.com/metadata/{id}") Ownable(msg.sender) {
        // Setzt die Lizenzgebühr (Royalty) auf 5% (500 Basis-Punkte)
        _setDefaultRoyalty(treasury, 500);
    }

    /**
     * @dev Erlaubt Nutzern, NFTs für eine bestimmte Kapsel zu prägen.
     */
    function mint(uint256 id, uint256 amount) external payable {
        require(msg.value >= MINT_PRICE * amount, "Insufficient payment");
        require(totalSupply[id] + amount <= MAX_SUPPLY, "Exceeds max supply");

        totalSupply[id] += amount;
        _mint(msg.sender, id, amount, "");
    }

    /**
     * @dev Überweist das angesammelte ETH vom Contract auf deine gelassen.eth Wallet.
     * Nur du (der Owner) kannst diese Funktion aufrufen.
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = treasury.call{value: balance}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Ermöglicht die Aktualisierung der Metadaten-URL (z.B. für den Reveal).
     */
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    /**
     * @dev Erforderliche Hilfsfunktion für die Schnittstellen von ERC1155 und ERC2981.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}