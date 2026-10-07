// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LemarchandsBox.sol";

/**
 * @title MockNFTDrop (HotRelicDrop)
 * @notice A simulated live NFT drop with mint pricing, supply caps, and instant receiver minting
 */
contract MockNFTDrop is IERC721, IERC721Metadata {
    string private _name = "Hot Relic Drop";
    string private _symbol = "RELIC";

    uint256 public constant MINT_PRICE = 0.01 ether;
    uint256 public constant MAX_SUPPLY = 50;

    uint256 public totalSupply = 0;
    bool public isPaused = false;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    event Minted(address indexed recipient, uint256 indexed tokenId);

    function setPaused(bool paused) external {
        isPaused = paused;
    }

    // Standard mint function where msg.sender is the recipient (the 6551 box)
    function mint() external payable {
        require(!isPaused, "Minting is paused");
        require(msg.value >= MINT_PRICE, "Insufficient ETH sent");
        require(totalSupply + 1 <= MAX_SUPPLY, "Drop sold out");

        totalSupply++;
        uint256 tokenId = totalSupply;

        _owners[tokenId] = msg.sender;
        _balances[msg.sender]++;

        emit Transfer(address(0), msg.sender, tokenId);
        emit Minted(msg.sender, tokenId);
    }

    // Direct recipient mint function
    function mintTo(address recipient) external payable {
        require(!isPaused, "Minting is paused");
        require(msg.value >= MINT_PRICE, "Insufficient ETH sent");
        require(totalSupply + 1 <= MAX_SUPPLY, "Drop sold out");

        totalSupply++;
        uint256 tokenId = totalSupply;

        _owners[tokenId] = recipient;
        _balances[recipient]++;

        emit Transfer(address(0), recipient, tokenId);
        emit Minted(recipient, tokenId);
    }

    // Standard ERC-721 views
    function balanceOf(address owner) external view override returns (uint256) {
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) external view override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Nonexistent token");
        return owner;
    }

    function name() external view override returns (string memory) { return _name; }
    function symbol() external view override returns (string memory) { return _symbol; }
    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        require(_owners[tokenId] != address(0), "Nonexistent token");
        return string(abi.encodePacked("ipfs://QmRelic/", _toString(tokenId), ".json"));
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC721).interfaceId || interfaceId == type(IERC721Metadata).interfaceId;
    }

    // Dummy stubs for transfer
    function safeTransferFrom(address, address, uint256, bytes calldata) external override {}
    function safeTransferFrom(address, address, uint256) external override {}
    function transferFrom(address, address, uint256) external override {}
    function approve(address, uint256) external override {}
    function setApprovalForAll(address, bool) external override {}
    function getApproved(uint256) external pure override returns (address) { return address(0); }
    function isApprovedForAll(address, address) external pure override returns (bool) { return false; }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
