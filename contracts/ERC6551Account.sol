// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LemarchandsBox.sol";

interface IERC6551Account {
    function token() external view returns (uint256 chainId, address tokenContract, uint256 tokenId);
    function state() external view returns (uint256);
    function isValidSigner(address signer, bytes calldata context) external view returns (bytes4 magicValue);
}

interface IERC6551Executable {
    function execute(address to, uint256 value, bytes calldata data, uint8 operation) external payable returns (bytes memory);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

interface IERC1155Receiver {
    function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes calldata data) external returns (bytes4);
    function onERC1155BatchReceived(address operator, address from, uint256[] calldata ids, uint256[] calldata values, bytes calldata data) external returns (bytes4);
}

/**
 * @title Lemarchand6551Account
 * @notice Token Bound Account implementation with built-in Automaton Operator controls (Spend caps & Kill switch)
 */
contract Lemarchand6551Account is IERC6551Account, IERC6551Executable, IERC721Receiver, IERC1155Receiver {
    uint256 private _state;

    struct AutomatonConfig {
        bool enabled;
        uint256 maxSpendPerTx;
        uint256 dailySpendLimit;
        uint256 dailySpent;
        uint256 lastResetDay;
    }

    // Operator address => Configuration
    mapping(address => AutomatonConfig) public automatonConfigs;

    event AutomatonConfigUpdated(address indexed operator, bool enabled, uint256 maxSpendPerTx, uint256 dailySpendLimit);
    event Executed(address indexed target, uint256 value, bytes data);

    error NotAuthorized();
    error ExceedsSpendLimit();
    error ExceedsDailyLimit();
    error UnsupportedOperation();

    modifier onlyOwner() {
        if (msg.sender != owner()) revert NotAuthorized();
        _;
    }

    receive() external payable {}

    function owner() public view returns (address) {
        (, address tokenContract, uint256 tokenId) = token();
        if (tokenContract.code.length == 0) return address(0);
        try IERC721(tokenContract).ownerOf(tokenId) returns (address tokenOwner) {
            return tokenOwner;
        } catch {
            return address(0);
        }
    }

    function token() public view override returns (uint256 chainId, address tokenContract, uint256 tokenId) {
        bytes memory footer = new bytes(0x60);
        assembly {
            // ERC-6551 clone footer layout: [chainId (32 bytes)][tokenContract (32 bytes)][tokenId (32 bytes)]
            // Runtime code prefix is 45 bytes (0x2d), followed by 96 bytes (0x60) of encoded parameters
            extcodecopy(address(), add(footer, 0x20), 0x2d, 0x60)
        }
        return abi.decode(footer, (uint256, address, uint256));
    }

    function state() external view override returns (uint256) {
        return _state;
    }

    function isValidSigner(address signer, bytes calldata) external view override returns (bytes4) {
        if (signer == owner()) {
            return IERC6551Account.isValidSigner.selector;
        }
        if (automatonConfigs[signer].enabled) {
            return IERC6551Account.isValidSigner.selector;
        }
        return bytes4(0);
    }

    /**
     * @notice Set or update the Automaton Bot's permissions
     */
    function setAutomatonConfig(
        address operator,
        bool enabled,
        uint256 maxSpendPerTx,
        uint256 dailySpendLimit
    ) external onlyOwner {
        AutomatonConfig storage cfg = automatonConfigs[operator];
        cfg.enabled = enabled;
        cfg.maxSpendPerTx = maxSpendPerTx;
        cfg.dailySpendLimit = dailySpendLimit;

        emit AutomatonConfigUpdated(operator, enabled, maxSpendPerTx, dailySpendLimit);
    }

    /**
     * @notice Execute transactions from the 6551 vault
     * @dev Only the Box owner OR an authorized Automaton Operator (within spend caps) can execute
     */
    function execute(
        address to,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external payable override returns (bytes memory) {
        if (operation != 0) revert UnsupportedOperation(); // Only call supported

        address currentOwner = owner();
        bool isOwner = (msg.sender == currentOwner);

        if (!isOwner) {
            // Check Automaton Operator permissions & guardrails
            AutomatonConfig storage cfg = automatonConfigs[msg.sender];
            if (!cfg.enabled) revert NotAuthorized();

            if (value > cfg.maxSpendPerTx) revert ExceedsSpendLimit();

            uint256 currentDay = block.timestamp / 1 days;
            if (cfg.lastResetDay != currentDay) {
                cfg.dailySpent = 0;
                cfg.lastResetDay = currentDay;
            }

            if (cfg.dailySpent + value > cfg.dailySpendLimit) revert ExceedsDailyLimit();
            cfg.dailySpent += value;
        }

        _state++;

        (bool success, bytes memory result) = to.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }

        emit Executed(to, value, data);
        return result;
    }

    // --- NFT Receivers ---
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }
}
