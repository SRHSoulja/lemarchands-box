// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/LemarchandsBox.sol";
import "../contracts/ERC6551Registry.sol";
import "../contracts/ERC6551Account.sol";
import "../contracts/LemarchandDispatcher.sol";
import "../contracts/MockNFTDrop.sol";
import "../contracts/MockERC20.sol";

contract LemarchandAutomatonTest is Test {
    LemarchandsBox public boxCollection;
    ERC6551Registry public registry;
    Lemarchand6551Account public accountImplementation;
    LemarchandDispatcher public dispatcher;
    MockNFTDrop public drop;

    address public botOperator = address(0xBA5E);
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public charlie = address(0xCAFE);
    address public dave = address(0xDA7E);
    address public eve = address(0xE7E);

    address[5] public users;
    address[5] public boxAccounts;

    function setUp() public {
        // 1. Deploy base contracts
        boxCollection = new LemarchandsBox("ipfs://QmBase/", "provHash123", address(this));
        boxCollection.setSaleActive(true);

        registry = new ERC6551Registry();
        accountImplementation = new Lemarchand6551Account();
        dispatcher = new LemarchandDispatcher(botOperator);
        drop = new MockNFTDrop();

        users = [alice, bob, charlie, dave, eve];

        // 2. Mint 1 Lemarchand Box to each of the 5 users
        for (uint256 i = 0; i < 5; i++) {
            address user = users[i];
            vm.deal(user, 10 ether);

            vm.prank(user);
            boxCollection.mint{value: 0.05 ether}(1);

            uint256 tokenId = i + 1;
            assertEq(boxCollection.ownerOf(tokenId), user);

            // 3. Create ERC-6551 Token Bound Account for each box
            address tba = registry.createAccount(
                address(accountImplementation),
                bytes32(0),
                block.chainid,
                address(boxCollection),
                tokenId
            );

            boxAccounts[i] = tba;
            assertEq(Lemarchand6551Account(payable(tba)).owner(), user);

            // 4. Fund each box's 6551 vault with 0.1 ETH
            vm.prank(user);
            (bool funded, ) = tba.call{value: 0.1 ether}("");
            assertTrue(funded);
            assertEq(tba.balance, 0.1 ether);
        }

        // 5. Configure Automaton Operator on Boxes 1..4 (Eve on Box 5 opts out)
        for (uint256 i = 0; i < 4; i++) {
            vm.prank(users[i]);
            Lemarchand6551Account(payable(boxAccounts[i])).setAutomatonConfig(
                address(dispatcher),
                true,          // enabled
                0.05 ether,    // max spend per mint
                0.20 ether     // daily spend limit
            );
        }
    }

    function test_InitialSetupAndOwnership() public view {
        for (uint256 i = 0; i < 5; i++) {
            assertEq(boxCollection.ownerOf(i + 1), users[i]);
            assertEq(Lemarchand6551Account(payable(boxAccounts[i])).owner(), users[i]);
        }
    }

    function test_PreFlightBatchSimulation() public {
        address[] memory boxes = new address[](5);
        for (uint256 i = 0; i < 5; i++) boxes[i] = boxAccounts[i];

        bytes memory mintCalldata = abi.encodeWithSelector(MockNFTDrop.mint.selector);

        // Run batch simulation via Dispatcher
        (bool[] memory results, uint256 successfulCount, ) = dispatcher.simulateBatch(
            boxes,
            address(drop),
            0.01 ether,
            mintCalldata
        );

        // Boxes 1..4 (Alice, Bob, Charlie, Dave) must succeed
        assertTrue(results[0], "Box 1 should succeed simulation");
        assertTrue(results[1], "Box 2 should succeed simulation");
        assertTrue(results[2], "Box 3 should succeed simulation");
        assertTrue(results[3], "Box 4 should succeed simulation");

        // Box 5 (Eve - opted out) must fail simulation without crashing the batch
        assertFalse(results[4], "Box 5 (opted out) should fail simulation");
        assertEq(successfulCount, 4, "Expected exactly 4 successful simulated mints");
    }

    function test_SingleBatchTransactionExecution() public {
        address[] memory boxes = new address[](5);
        for (uint256 i = 0; i < 5; i++) boxes[i] = boxAccounts[i];

        bytes memory mintCalldata = abi.encodeWithSelector(MockNFTDrop.mint.selector);

        // Bot Operator executes 1 single batch transaction
        vm.prank(botOperator);
        uint256 succeeded = dispatcher.dispatchBatch(
            boxes,
            address(drop),
            0.01 ether,
            mintCalldata
        );

        assertEq(succeeded, 4, "Expected 4 boxes to successfully mint");

        // Verify that Boxes 1..4 now own the newly minted NFT inside their 6551 accounts!
        for (uint256 i = 0; i < 4; i++) {
            assertEq(drop.balanceOf(boxAccounts[i]), 1, "Box should hold newly minted NFT");
            assertEq(boxAccounts[i].balance, 0.09 ether, "Box balance should have deducted 0.01 ETH");
        }

        // Box 5 was skipped cleanly: balance untouched, no NFT minted
        assertEq(drop.balanceOf(boxAccounts[4]), 0, "Box 5 should have 0 minted NFTs");
        assertEq(boxAccounts[4].balance, 0.10 ether, "Box 5 balance should remain untouched");
    }

    function test_SpendCapGuardrail() public {
        // Attempt to mint from an expensive drop (0.06 ETH, exceeding the 0.05 ETH user cap)
        address[] memory boxes = new address[](1);
        boxes[0] = boxAccounts[0]; // Alice

        bytes memory mintCalldata = abi.encodeWithSelector(MockNFTDrop.mint.selector);

        vm.prank(botOperator);
        uint256 succeeded = dispatcher.dispatchBatch(
            boxes,
            address(drop),
            0.06 ether, // Exceeds Alice's 0.05 ETH maxSpendPerTx cap!
            mintCalldata
        );

        assertEq(succeeded, 0, "Mint should be blocked by on-chain spend cap");
        assertEq(drop.balanceOf(boxAccounts[0]), 0, "Alice's box should not have minted");
        assertEq(boxAccounts[0].balance, 0.1 ether, "Alice's funds must remain completely safe");
    }

    function test_UserInstantKillSwitch() public {
        // Alice decides to turn her Automaton OFF
        vm.prank(alice);
        Lemarchand6551Account(payable(boxAccounts[0])).setAutomatonConfig(
            address(dispatcher),
            false, // TOGGLED OFF
            0.05 ether,
            0.20 ether
        );

        address[] memory boxes = new address[](1);
        boxes[0] = boxAccounts[0];
        bytes memory mintCalldata = abi.encodeWithSelector(MockNFTDrop.mint.selector);

        vm.prank(botOperator);
        uint256 succeeded = dispatcher.dispatchBatch(
            boxes,
            address(drop),
            0.01 ether,
            mintCalldata
        );

        assertEq(succeeded, 0, "Mint must be rejected when user has toggled bot OFF");
        assertEq(drop.balanceOf(boxAccounts[0]), 0);
    }

    function test_PreFlightSimulationPreventsWastedGasOnSoldOutDrop() public {
        // Pause the drop (simulating a sold out or closed drop)
        drop.setPaused(true);

        address[] memory boxes = new address[](4);
        for (uint256 i = 0; i < 4; i++) boxes[i] = boxAccounts[i];

        bytes memory mintCalldata = abi.encodeWithSelector(MockNFTDrop.mint.selector);

        // Simulation detects failure with 0 gas cost to the network
        (bool[] memory results, uint256 successfulCount, ) = dispatcher.simulateBatch(
            boxes,
            address(drop),
            0.01 ether,
            mintCalldata
        );

        assertEq(successfulCount, 0, "Simulation should flag 0 successes for paused/sold out drop");
        for (uint256 i = 0; i < 4; i++) {
            assertFalse(results[i], "All boxes should fail simulation");
        }
        // Result: Bot cancels broadcast, saving 100% of user gas!
    }

    function test_ERC20ReceiptAndReading() public {
        MockERC20 usdc = new MockERC20("USD Coin", "USDC", 6);
        uint256 payoutAmount = 500 * 10**6; // 500 USDC

        // Partner project pays yield directly to Box 1's 6551 address
        usdc.mint(boxAccounts[0], payoutAmount);
        assertEq(usdc.balanceOf(boxAccounts[0]), payoutAmount);

        // Read token metadata and balance in 1 single view call
        (
            string memory tokenName,
            string memory tokenSymbol,
            uint8 tokenDecimals,
            uint256 balance
        ) = Lemarchand6551Account(payable(boxAccounts[0])).getERC20Balance(address(usdc));

        assertEq(tokenName, "USD Coin");
        assertEq(tokenSymbol, "USDC");
        assertEq(tokenDecimals, 6);
        assertEq(balance, payoutAmount);
    }

    function test_ERC20WithdrawalByOwner() public {
        MockERC20 usdc = new MockERC20("USD Coin", "USDC", 6);
        uint256 payoutAmount = 500 * 10**6;
        usdc.mint(boxAccounts[0], payoutAmount);

        // Alice (Box 1 owner) withdraws 200 USDC to her personal wallet
        vm.prank(alice);
        bool ok = Lemarchand6551Account(payable(boxAccounts[0])).transferERC20(
            address(usdc),
            alice,
            200 * 10**6
        );

        assertTrue(ok, "Withdrawal should succeed");
        assertEq(usdc.balanceOf(boxAccounts[0]), 300 * 10**6, "Vault balance should decrease");
        assertEq(usdc.balanceOf(alice), 200 * 10**6, "Alice should receive withdrawn tokens");
    }

    function test_ERC20TheftPreventionFromOperator() public {
        MockERC20 usdc = new MockERC20("USD Coin", "USDC", 6);
        uint256 payoutAmount = 500 * 10**6;
        usdc.mint(boxAccounts[0], payoutAmount);

        // Bot operator attempts to call transfer(botOperator, ...) through execute()
        bytes memory stealCalldata = abi.encodeWithSelector(
            IERC20.transfer.selector,
            botOperator,
            payoutAmount
        );

        vm.prank(botOperator);
        vm.expectRevert(Lemarchand6551Account.NotAuthorized.selector);
        Lemarchand6551Account(payable(boxAccounts[0])).execute(
            address(usdc),
            0,
            stealCalldata,
            0
        );

        // Tokens remain completely safe in the box
        assertEq(usdc.balanceOf(boxAccounts[0]), payoutAmount);
        assertEq(usdc.balanceOf(botOperator), 0);
    }

    function test_ETHWithdrawalByOwner() public {
        uint256 initialAliceBalance = alice.balance;

        // Alice withdraws 0.04 ETH from Box 1 vault
        vm.prank(alice);
        Lemarchand6551Account(payable(boxAccounts[0])).transferETH(
            payable(alice),
            0.04 ether
        );

        assertEq(boxAccounts[0].balance, 0.06 ether, "Vault ETH balance should reduce");
        assertEq(alice.balance, initialAliceBalance + 0.04 ether, "Alice ETH should increase");
    }

    function test_StrayCuckEnshrinementAndWithdrawal() public {
        // Deploy Mock Stray Cucks collection
        MockNFTDrop strays = new MockNFTDrop();

        // Alice mints Stray Cuck #527
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        strays.mintTo{value: 0.01 ether}(alice);
        assertEq(strays.ownerOf(1), alice);

        // Alice enshrines Stray Cuck into her Box 1 6551 vault
        vm.prank(alice);
        strays.safeTransferFrom(alice, boxAccounts[0], 1);
        assertEq(strays.ownerOf(1), boxAccounts[0], "Box 1 vault should now own the Stray Cuck NFT");
        assertEq(strays.balanceOf(boxAccounts[0]), 1, "Box 1 vault NFT balance should be 1");

        // Alice (owner) withdraws Stray Cuck back to her wallet
        bytes memory withdrawCalldata = abi.encodeWithSelector(
            bytes4(keccak256("safeTransferFrom(address,address,uint256)")),
            boxAccounts[0],
            alice,
            1
        );

        vm.prank(alice);
        Lemarchand6551Account(payable(boxAccounts[0])).execute(
            address(strays),
            0,
            withdrawCalldata,
            0
        );

        assertEq(strays.ownerOf(1), alice, "Alice should have her Stray Cuck back in her wallet");
        assertEq(strays.balanceOf(boxAccounts[0]), 0, "Box 1 vault should have 0 NFTs");
    }

    function test_StrayCuckOperatorTheftPrevention() public {
        MockNFTDrop strays = new MockNFTDrop();

        // Enshrine Stray Cuck into Box 1 vault
        vm.prank(alice);
        strays.mintTo{value: 0.01 ether}(boxAccounts[0]);
        assertEq(strays.ownerOf(1), boxAccounts[0]);

        // Bot operator attempts to steal Stray Cuck using safeTransferFrom
        bytes memory stealCalldata = abi.encodeWithSelector(
            bytes4(keccak256("safeTransferFrom(address,address,uint256)")),
            boxAccounts[0],
            botOperator,
            1
        );

        vm.prank(botOperator);
        vm.expectRevert(Lemarchand6551Account.NotAuthorized.selector);
        Lemarchand6551Account(payable(boxAccounts[0])).execute(
            address(strays),
            0,
            stealCalldata,
            0
        );

        // Bot operator also attempts transferFrom
        bytes memory stealCalldata2 = abi.encodeWithSelector(
            IERC721.transferFrom.selector,
            boxAccounts[0],
            botOperator,
            1
        );

        vm.prank(botOperator);
        vm.expectRevert(Lemarchand6551Account.NotAuthorized.selector);
        Lemarchand6551Account(payable(boxAccounts[0])).execute(
            address(strays),
            0,
            stealCalldata2,
            0
        );

        // Stray Cuck remains 100% safe inside the vault
        assertEq(strays.ownerOf(1), boxAccounts[0]);
    }
}
