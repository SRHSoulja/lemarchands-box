// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Lemarchand's Box (The Lament Configuration)
 * @author Philip Lemarchand / 1784 Archive
 * @notice 1,000-Piece Interactive 3D Occult NFT Collection
 * 
 * "We have such sights to show you."
 */

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC2981 is IERC165 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount);
}

contract LemarchandsBox is IERC721, IERC721Metadata, IERC2981 {
    string private _name = "Lemarchand's Box";
    string private _symbol = "LAMENT";
    
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public totalSupply = 0;
    uint256 public mintPrice = 0.05 ether;
    uint256 public maxMintPerWallet = 5;
    bool public isSaleActive = false;

    // Provenance Hash for 1000 Pieces
    string public provenanceHash;
    string public baseTokenURI;
    string public contractURI;

    // Royalty settings (EIP-2981) - Default 5%
    address public royaltyReceiver;
    uint96 public royaltyFraction = 500; // 500 / 10000 = 5%

    address public owner;

    // Ownership mappings
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(address => uint256) public mintedPerWallet;

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    constructor(
        string memory initialBaseURI,
        string memory initialProvenanceHash,
        address initialRoyaltyReceiver
    ) {
        owner = msg.sender;
        baseTokenURI = initialBaseURI;
        provenanceHash = initialProvenanceHash;
        royaltyReceiver = initialRoyaltyReceiver != address(0) ? initialRoyaltyReceiver : msg.sender;
    }

    // --- Minting Logic ---
    function mint(uint256 quantity) external payable {
        require(isSaleActive, "Sale is not active");
        require(quantity > 0, "Must mint at least 1");
        require(totalSupply + quantity <= MAX_SUPPLY, "Exceeds max supply of 1000");
        require(mintedPerWallet[msg.sender] + quantity <= maxMintPerWallet, "Exceeds wallet limit");
        require(msg.value >= mintPrice * quantity, "Insufficient ETH sent");

        mintedPerWallet[msg.sender] += quantity;

        for (uint256 i = 0; i < quantity; i++) {
            totalSupply++;
            uint256 tokenId = totalSupply;
            _owners[tokenId] = msg.sender;
            emit Transfer(address(0), msg.sender, tokenId);
        }
        _balances[msg.sender] += quantity;
    }

    // Owner reserve / airdrop
    function reserveMint(address recipient, uint256 quantity) external onlyOwner {
        require(totalSupply + quantity <= MAX_SUPPLY, "Exceeds max supply");
        for (uint256 i = 0; i < quantity; i++) {
            totalSupply++;
            uint256 tokenId = totalSupply;
            _owners[tokenId] = recipient;
            emit Transfer(address(0), recipient, tokenId);
        }
        _balances[recipient] += quantity;
    }

    // --- Admin Settings ---
    function setSaleActive(bool active) external onlyOwner {
        isSaleActive = active;
    }

    function setMintPrice(uint256 price) external onlyOwner {
        mintPrice = price;
    }

    function setBaseURI(string memory newURI) external onlyOwner {
        baseTokenURI = newURI;
    }

    function setContractURI(string memory newContractURI) external onlyOwner {
        contractURI = newContractURI;
    }

    function setProvenanceHash(string memory newHash) external onlyOwner {
        provenanceHash = newHash;
    }

    function setRoyalty(address receiver, uint96 fraction) external onlyOwner {
        royaltyReceiver = receiver;
        royaltyFraction = fraction;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner).transfer(balance);
    }

    // --- ERC-721 View Methods ---
    function name() external view override returns (string memory) { return _name; }
    function symbol() external view override returns (string memory) { return _symbol; }

    function balanceOf(address account) external view override returns (uint256) {
        require(account != address(0), "Zero address query");
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token does not exist");
        return tokenOwner;
    }

    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return string(abi.encodePacked(baseTokenURI, _toString(tokenId), ".json"));
    }

    // --- EIP-2981 Royalty Standard ---
    function royaltyInfo(uint256, uint256 salePrice) external view override returns (address, uint256) {
        uint256 amount = (salePrice * royaltyFraction) / 10000;
        return (royaltyReceiver, amount);
    }

    // --- ERC-165 Interface Detection ---
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC721).interfaceId ||
               interfaceId == type(IERC721Metadata).interfaceId ||
               interfaceId == type(IERC2981).interfaceId ||
               interfaceId == type(IERC165).interfaceId;
    }

    // --- Approvals & Transfers ---
    function approve(address to, uint256 tokenId) external override {
        address tokenOwner = ownerOf(tokenId);
        require(msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender), "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external override {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address tokenOwner, address operator) public view override returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        require(ownerOf(tokenId) == from, "Incorrect from address");
        require(to != address(0), "Transfer to zero address");

        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external override {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata) external override {
        transferFrom(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || isApprovedForAll(tokenOwner, spender) || getApproved(tokenId) == spender);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
