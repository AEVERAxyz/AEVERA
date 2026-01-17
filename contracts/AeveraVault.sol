// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract AeveraVault is ERC1155, Ownable, ERC2981 {
    using Strings for uint256;

    // --- COLLECTION METADATA ---
    string public name = "AEVERA";
    string public symbol = "AEVERA";

    // --- CONFIG ---
    uint256 public constant MINT_PRICE = 0.000777 ether;
    uint256 public constant MAX_CHARS = 7777;

    // SUPPLY LIMITS (Gesamtanzahl)
    uint256 public constant MAX_SUPPLY_PUBLIC = 100;
    uint256 public constant MAX_SUPPLY_PRIVATE = 1000;

    // NEU: TRANSACTION LIMITS (Max pro Klick)
    uint256 public constant MAX_BATCH_PUBLIC = 5;
    uint256 public constant MAX_BATCH_PRIVATE = 50;

    uint256 private _guardStatus;
    modifier nonReentrant() {
        require(_guardStatus == 0, "Reentrancy");
        _guardStatus = 1;
        _;
        _guardStatus = 0;
    }

    struct Capsule {
        uint256 id;
        string uuid;
        string shortId;
        string author; // Der Anzeigename (String)
        address creator; // NEU: Die Wallet-Adresse des Erstellers (für Security Check)
        string content;
        uint256 mintTimestamp;
        uint256 unlockTimestamp;
        bool isPrivate;
        uint256 currentSupply;
    }

    mapping(uint256 => Capsule) public capsules;
    mapping(string => uint256) public idByUuid;
    mapping(string => uint256) public idByShortId;

    uint256 public nextTokenId = 1;

    event CapsuleCreated(uint256 indexed id, string uuid, string shortId, address indexed author);
    event CapsuleMinted(uint256 indexed id, address indexed minter, uint256 amount);

    constructor() Ownable(msg.sender) ERC1155("") {
        // SET ROYALTIES: 7.77% (777 Basis Points)
        _setDefaultRoyalty(msg.sender, 777);
    }

    // --- OVERRIDES FÜR ROYALTIES ---
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // --- ACTIONS ---

    function createCapsule(
        string memory _uuid,
        string memory _shortId,
        string memory _author,
        uint256 _unlockTimestamp,
        bool _isPrivate,
        string memory _content
    ) public payable nonReentrant {
        require(msg.value >= MINT_PRICE, "ETH low");
        require(bytes(_content).length <= MAX_CHARS, "Too long");
        require(_unlockTimestamp > block.timestamp, "Future");
        require(idByUuid[_uuid] == 0, "UUID exists");
        require(idByShortId[_shortId] == 0, "ShortID exists");

        uint256 newTokenId = nextTokenId;
        capsules[newTokenId] = Capsule({
            id: newTokenId,
            uuid: _uuid,
            shortId: _shortId,
            author: _author,       // Visueller Name
            creator: msg.sender,   // NEU: Wallet Adresse speichern
            content: _content,
            mintTimestamp: block.timestamp,
            unlockTimestamp: _unlockTimestamp,
            isPrivate: _isPrivate,
            currentSupply: 1
        });

        idByUuid[_uuid] = newTokenId;
        idByShortId[_shortId] = newTokenId;

        _mint(msg.sender, newTokenId, 1, "");
        emit CapsuleCreated(newTokenId, _uuid, _shortId, msg.sender);
        nextTokenId++;
    }

    // UPDATE: Supports batch minting with LIMITS & AUTHOR CHECK for Private
    function mintCopy(uint256 _tokenId, uint256 _amount) public payable nonReentrant {
        require(_amount > 0, "Amount > 0");
        require(msg.value >= MINT_PRICE * _amount, "ETH low");
        require(_tokenId < nextTokenId && _tokenId > 0, "No ID");

        Capsule storage cap = capsules[_tokenId];

        // 1. Author Check for Private Vaults (FIXED: Nutzt jetzt creator Adresse)
        if (cap.isPrivate) {
            require(msg.sender == cap.creator, "Private: Author only");
        }

        // 2. Check Total Supply Limit
        uint256 maxSupply = cap.isPrivate ? MAX_SUPPLY_PRIVATE : MAX_SUPPLY_PUBLIC;
        require(cap.currentSupply + _amount <= maxSupply, "Max supply reached");

        // 3. Check Batch Transaction Limit
        uint256 maxBatch = cap.isPrivate ? MAX_BATCH_PRIVATE : MAX_BATCH_PUBLIC;
        require(_amount <= maxBatch, "Batch limit exceeded");

        cap.currentSupply += _amount;
        _mint(msg.sender, _tokenId, _amount, "");
        emit CapsuleMinted(_tokenId, msg.sender, _amount);
    }

    // --- METADATA ---

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

    function uri(uint256 _tokenId) public view override returns (string memory) {
        Capsule memory c = capsules[_tokenId];
        require(c.mintTimestamp != 0, "No ID");

        string memory svg = _generateSVG(c);
        string memory imageURI = string(abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svg))));

        string memory description = string(abi.encodePacked(
            "AEVERA\\n\\n",
            "A singular point in the infinite chain of time. This artifact stands as the immutable custodian of Capsule #", c.shortId, 
            ". Verified on the blockchain, it preserves your personal legacy secured on-chain, forever and beyond time.\\n\\n",
            "aevera.xyz"
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(abi.encodePacked(
                '{"name": "AEVERA #', c.shortId, '",',
                '"description": "', description, '",',
                '"image": "', imageURI, '",',
                '"attributes": [',
                    '{"trait_type": "Type", "value": "', (c.isPrivate ? "Private" : "Public"), '"},',
                    '{"trait_type": "Unlock Year", "value": "', _getYearString(c.unlockTimestamp), '"}',
                ' ]}'
            )))
        ));
    }

    // --- INTERNAL RENDERER ---

    function _generateSVG(Capsule memory c) internal pure returns (string memory) {
        string memory c1 = c.isPrivate ? "#c084fc" : "#22d3ee";
        string memory c2 = c.isPrivate ? "#db2777" : "#2563eb";

        string memory auth = bytes(c.author).length > 22 ? string(abi.encodePacked(_substring(c.author, 0, 20), "...")) : c.author;
        string memory narrative = _getNarrative(auth, c.mintTimestamp, c.unlockTimestamp);

        return string(abi.encodePacked(
            _renderHeader(c1, c2),
            _renderMetadata(c.shortId, auth, c.mintTimestamp, c.unlockTimestamp),
            _renderCenter(narrative, c.shortId, c1),
            _renderFooter(c.isPrivate, c1)
        ));
    }

    function _renderHeader(string memory c1, string memory c2) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" style="background:#020617">',
            '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="', c1, '"/><stop offset="100%" stop-color="', c2, '"/></linearGradient>',
            '<filter id="f"><feGaussianBlur stdDeviation="2" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>',
            '<rect width="600" height="600" fill="#020617"/>', 
            '<rect width="600" height="6" fill="url(#g)"/>', 
            '<g transform="translate(32,35)"><text x="100" y="30" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="48" fill="white" filter="url(#f)" letter-spacing="1">AEVERA</text>',
            '<text x="100" y="52" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#CBD5E1" letter-spacing="8" font-weight="bold">BEYOND TIME</text>',
            '<text x="100" y="68" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#60A5FA" letter-spacing="3" font-weight="bold">THE EVERLASTING TRUTH</text></g>',
            '<line x1="0" y1="120" x2="600" y2="120" stroke="white" stroke-opacity="0.15"/>'
        ));
    }

    function _renderMetadata(string memory shortId, string memory auth, uint256 tMint, uint256 tUnlock) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<g transform="translate(32,140)"><text x="12" y="18" font-family="monospace" font-size="8" fill="#94a3b8">ORIGIN IDENTITY</text><text x="12" y="35" font-family="sans-serif" font-size="12" font-weight="bold" fill="white">', auth, '</text></g>',
            '<g transform="translate(308,140)"><text x="12" y="18" font-family="monospace" font-size="8" fill="#94a3b8">CAPSULE ID</text><text x="12" y="35" font-family="monospace" font-size="14" font-weight="bold" fill="#94a3b8">#', shortId, '</text></g>',
            '<g transform="translate(32,200)"><text x="12" y="18" font-family="monospace" font-size="8" fill="#94a3b8">MOMENT OF ORIGIN</text><text x="12" y="35" font-family="sans-serif" font-size="12" font-weight="bold" fill="#3B82F6">', _formatFull(tMint), '</text></g>',
            '<g transform="translate(308,200)"><text x="12" y="18" font-family="monospace" font-size="8" fill="#94a3b8">THE ERA OF REVEAL</text><text x="12" y="35" font-family="sans-serif" font-size="12" font-weight="bold" fill="#34d399">', _formatFull(tUnlock), '</text></g>',
            '<line x1="0" y1="270" x2="600" y2="270" stroke="white" stroke-opacity="0.15"/>'
        ));
    }

    function _renderCenter(string memory narrative, string memory shortId, string memory c1) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<g transform="translate(300, 310)" text-anchor="middle">',
            '<text y="0" font-family="serif" font-size="13" font-style="italic" fill="white" letter-spacing="0.5">', narrative, '</text></g>',
            '<g transform="translate(300,410)" text-anchor="middle"><rect x="-215" y="-65" width="430" height="130" fill="none" stroke="', c1, '" stroke-opacity="0.2"/><text y="-40" font-family="monospace" font-size="10" letter-spacing="3" fill="white" filter="url(#f)">THE ETERNAL GATEWAY</text>',
            '<text y="10" font-family="sans-serif" font-size="48" font-weight="bold" fill="white" letter-spacing="-1">aevera.xyz</text><text y="47" font-family="monospace" font-size="16" fill="', c1, '" letter-spacing="2" font-weight="bold">/', shortId, '</text></g>'
        ));
    }

    function _renderFooter(bool isPrivate, string memory c1) internal pure returns (string memory) {
        // FIX: Replaced "&" with "&amp;" to prevent SVG breakage
        string memory footerText = isPrivate ? "Restricted to NFT holder &amp; Key." : "Open to the world after Reveal Era.";

        return string(abi.encodePacked(
            '<line x1="0" y1="510" x2="600" y2="510" stroke="white" stroke-opacity="0.15"/>',
            '<g transform="translate(32,540)"><text x="0" y="0" font-family="monospace" font-size="10" fill="#94a3b8" letter-spacing="2">.VERIFIED</text><text x="0" y="16" font-family="monospace" font-size="10" fill="#94a3b8" letter-spacing="2">.ETERNAL</text><text x="0" y="32" font-family="monospace" font-size="10" fill="#94a3b8" letter-spacing="2">.AEVERA</text></g>',
            '<g transform="translate(568,555)" text-anchor="end"><text x="0" y="-5" font-family="monospace" font-size="10" fill="', c1, '" font-weight="bold">TYPE: ', (isPrivate ? "PRIVATE VAULT" : "PUBLIC BROADCAST"), '</text><text x="0" y="12" font-family="sans-serif" font-size="9" fill="#94a3b8">', footerText, '</text></g></svg>'
        ));
    }

    function _getNarrative(string memory auth, uint256 sealTs, uint256 revealTs) internal pure returns (string memory) {
        string memory sealDate = _extractDate(sealTs);
        string memory revealDate = _extractDate(revealTs);

        bool sameDay = keccak256(bytes(sealDate)) == keccak256(bytes(revealDate));

        string memory tail = sameDay 
            ? string(abi.encodePacked("arriving later at ", _extractTime(revealTs), "."))
            : string(abi.encodePacked("arriving on ", revealDate, "."));

        return string(abi.encodePacked("Sent beyond time by ", auth, " on ", sealDate, ", ", tail));
    }

    // --- HELPER FUNCTIONS ---

    function _getMsgDate(uint256 ts) internal pure returns (uint year, uint month, uint day) {
        unchecked {
            int _days = int(ts / 86400) + 719468;
            int era = (_days >= 0 ? _days : _days - 146096) / 146097;
            int doe = _days - era * 146097;
            int yoe = (doe - doe/1460 + doe/36524 - doe/146096) / 365;
            int y = yoe + era * 400;
            int doy = doe - (365*yoe + yoe/4 - yoe/100);
            int mp = (5*doy + 2)/153;
            day = uint(doy - (153*mp + 2)/5 + 1);
            month = uint(mp < 10 ? mp + 3 : mp - 9);
            year = uint(y + (month <= 2 ? int(1) : int(0)));
        }
    }

    function _extractDate(uint256 ts) internal pure returns (string memory) {
        (uint year, uint month, uint day) = _getMsgDate(ts);
        string memory mStr;
        if (month == 1) mStr = "Jan"; else if (month == 2) mStr = "Feb"; else if (month == 3) mStr = "Mar";
        else if (month == 4) mStr = "Apr"; else if (month == 5) mStr = "May"; else if (month == 6) mStr = "Jun";
        else if (month == 7) mStr = "Jul"; else if (month == 8) mStr = "Aug"; else if (month == 9) mStr = "Sep";
        else if (month == 10) mStr = "Oct"; else if (month == 11) mStr = "Nov"; else mStr = "Dec";
        return string(abi.encodePacked(mStr, " ", day.toString(), ", ", year.toString()));
    }

    function _extractTime(uint256 ts) internal pure returns (string memory) {
        uint256 sec = ts % 86400;
        uint256 hour = sec / 3600;
        uint256 minute = (sec % 3600) / 60;
        return string(abi.encodePacked(_pad(hour), ":", _pad(minute), " UTC"));
    }

    function _formatFull(uint256 ts) internal pure returns (string memory) {
        return string(abi.encodePacked(_extractDate(ts), " . ", _extractTime(ts)));
    }

    function _pad(uint256 value) internal pure returns (string memory) {
        return value < 10 ? string(abi.encodePacked("0", value.toString())) : value.toString();
    }

    function _getYearString(uint256 ts) internal pure returns (string memory) {
        return (1970 + (ts / 31536000)).toString();
    }

    function _substring(string memory str, uint startIndex, uint endIndex) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        if (endIndex > strBytes.length) endIndex = strBytes.length;
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    function getCapsuleContent(uint256 _tokenId) public view returns (string memory) {
        Capsule memory cap = capsules[_tokenId];
        if (cap.isPrivate) return cap.content;
        require(block.timestamp >= cap.unlockTimestamp, "Locked");
        return cap.content;
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdraw failed");
    }
}