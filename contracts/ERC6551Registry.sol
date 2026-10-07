// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ERC6551Registry
 * @notice Canonical ERC-6551 Registry creating deterministic Token Bound Accounts using ERC-1167 Minimal Proxies
 */
interface IERC6551Registry {
    event ERC6551AccountCreated(
        address account,
        address indexed implementation,
        bytes32 salt,
        uint256 chainId,
        address indexed tokenContract,
        uint256 indexed tokenId
    );

    function createAccount(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external returns (address);

    function account(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external view returns (address);
}

contract ERC6551Registry is IERC6551Registry {
    error AccountCreationFailed();

    function createAccount(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external override returns (address) {
        bytes memory code = _creationCode(implementation, salt, chainId, tokenContract, tokenId);
        address expectedAddress = account(implementation, salt, chainId, tokenContract, tokenId);

        if (expectedAddress.code.length != 0) {
            return expectedAddress;
        }

        address deployedAccount;
        assembly {
            deployedAccount := create2(0, add(code, 0x20), mload(code), salt)
        }

        if (deployedAccount == address(0)) {
            revert AccountCreationFailed();
        }

        emit ERC6551AccountCreated(
            deployedAccount,
            implementation,
            salt,
            chainId,
            tokenContract,
            tokenId
        );

        return deployedAccount;
    }

    function account(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) public view override returns (address) {
        bytes32 bytecodeHash = keccak256(
            _creationCode(implementation, salt, chainId, tokenContract, tokenId)
        );

        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            salt,
                            bytecodeHash
                        )
                    )
                )
            )
        );
    }

    function _creationCode(
        address implementation,
        bytes32,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(
            hex"3d60ad80600a3d3981f3363d3d373d3d3d363d73",
            implementation,
            hex"5af43d82803e903d91602b57fd5bf3",
            abi.encode(chainId, tokenContract, tokenId)
        );
    }
}
