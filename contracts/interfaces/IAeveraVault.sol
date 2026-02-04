// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IAeveraVault {

    // Der "Koffer" für die Daten
    struct EngraveData {
        string uuid;
        string shortId;
        string author;
        bytes content;
        uint40 unlockTime;
        bool isPrivate;
    }

    struct CapsuleMetadata {
        address creator;
        string author;
        string shortId;
        string uuid;
        uint40 sealTime;
        uint40 unlockTime;
        bool isPrivate;
        address contentPointer;
    }

    // Errors
    error Vault_AlreadyEngraved();
    error Vault_PrivateContentRestricted();
    error Vault_MaxSupplyReached();
    error Vault_OnlyGateway();
    error Vault_Locked();
    error Vault_UUIDExists();     // Neu
    error Vault_ShortIDExists();  // Neu
    error Vault_NotEngraved();    // Neu

    // Funktionen
    // UPDATE: Keine ID mehr im Input! Der Vault generiert sie.
    function engrave(address to, EngraveData calldata data) external returns (uint256);

    function mint(address to, uint256 id, uint256 amount) external;
    function getMetadata(uint256 id) external view returns (CapsuleMetadata memory);
    function getContent(uint256 id) external view returns (string memory);
}