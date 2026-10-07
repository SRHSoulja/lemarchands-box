// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ERC6551Account.sol";

/**
 * @title LemarchandDispatcher
 * @notice Batch multi-box minting coordinator for the Lemarchand Automaton Bot
 * @dev Replaces 500 individual transactions with 1 single coordinated multicall
 */
contract LemarchandDispatcher {
    address public owner;
    address public operator; // The bot signing address

    event OperatorUpdated(address indexed newOperator);
    event BatchExecuted(address indexed targetContract, uint256 totalAttempted, uint256 totalSucceeded);
    event BoxMinted(address indexed box, address indexed targetContract, uint256 value);
    event BoxSkipped(address indexed box, bytes reason);

    error Unauthorized();
    error ZeroAddress();

    modifier onlyOperator() {
        if (msg.sender != operator && msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address initialOperator) {
        if (initialOperator == address(0)) revert ZeroAddress();
        owner = msg.sender;
        operator = initialOperator;
    }

    function setOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) revert ZeroAddress();
        operator = newOperator;
        emit OperatorUpdated(newOperator);
    }

    /**
     * @notice Execute a mint batch across multiple 6551 boxes in 1 single transaction
     * @param boxes Array of Lemarchand 6551 box accounts
     * @param targetContract The target NFT drop contract
     * @param valuePerBox The ETH required per mint (deducted from each box's balance)
     * @param mintCalldata The encoded mint calldata
     */
    function dispatchBatch(
        address[] calldata boxes,
        address targetContract,
        uint256 valuePerBox,
        bytes calldata mintCalldata
    ) external onlyOperator returns (uint256 succeeded) {
        uint256 total = boxes.length;

        for (uint256 i = 0; i < total; i++) {
            address box = boxes[i];

            // Low-level call to the 6551 account's execute function
            // Non-blocking: if one box fails (e.g. out of funds, or toggled off), it skips without reverting the rest
            (bool ok, bytes memory returnData) = box.call(
                abi.encodeWithSelector(
                    IERC6551Executable.execute.selector,
                    targetContract,
                    valuePerBox,
                    mintCalldata,
                    uint8(0) // CALL
                )
            );

            if (ok) {
                succeeded++;
                emit BoxMinted(box, targetContract, valuePerBox);
            } else {
                emit BoxSkipped(box, returnData);
            }
        }

        emit BatchExecuted(targetContract, total, succeeded);
    }

    /**
     * @notice Single-shot batch pre-simulation
     * @dev Called via eth_call by the bot to verify the entire batch in 1 network roundtrip
     */
    function simulateBatch(
        address[] calldata boxes,
        address targetContract,
        uint256 valuePerBox,
        bytes calldata mintCalldata
    ) external returns (bool[] memory results, uint256 successfulCount, bytes[] memory errors) {
        uint256 total = boxes.length;
        results = new bool[](total);
        errors = new bytes[](total);

        for (uint256 i = 0; i < total; i++) {
            address box = boxes[i];

            (bool ok, bytes memory returnData) = box.call(
                abi.encodeWithSelector(
                    IERC6551Executable.execute.selector,
                    targetContract,
                    valuePerBox,
                    mintCalldata,
                    uint8(0)
                )
            );

            results[i] = ok;
            if (ok) {
                successfulCount++;
            } else {
                errors[i] = returnData;
            }
        }
    }
}
