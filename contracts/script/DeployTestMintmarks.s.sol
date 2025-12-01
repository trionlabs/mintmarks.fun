// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {TestMintmarks} from "../src/TestMintmarks.sol";

/**
 * @title DeployTestMintmarksScript
 * @notice Deploy script for TestMintmarks contract on Base Sepolia
 * 
 * Usage:
 *   forge script script/DeployTestMintmarks.s.sol:DeployTestMintmarksScript \
 *     --rpc-url base-sepolia \
 *     --broadcast \
 *     --verify
 */
contract DeployTestMintmarksScript is Script {
    function run() external returns (TestMintmarks) {
        vm.startBroadcast();
        TestMintmarks testMintmarks = new TestMintmarks();
        vm.stopBroadcast();

        console.log("=================================");
        console.log("TestMintmarks Deployment Complete");
        console.log("=================================");
        console.log("Contract Address:", address(testMintmarks));
        console.log("Network: Base Sepolia (chainId: 84532)");
        console.log("Mint Fee: 0.00001 ETH");
        console.log("");
        console.log("Add to web/.env:");
        console.log("VITE_TEST_MINTMARKS_ADDRESS=%s", address(testMintmarks));
        console.log("");
        console.log("View on BaseScan:");
        console.log("https://sepolia.basescan.org/address/%s", address(testMintmarks));

        return testMintmarks;
    }
}








