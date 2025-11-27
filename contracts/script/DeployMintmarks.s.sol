// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {Mintmarks} from "../src/Mintmarks.sol";

contract DeployMintmarksScript is Script {
    // Deployed HonkVerifier on Base Sepolia
    address constant VERIFIER = 0xDB80797A62948Bc1189e46De13Cf3B1d5Ee60936;

    function run() external returns (Mintmarks) {
        vm.startBroadcast();
        Mintmarks mintmarks = new Mintmarks(VERIFIER);
        vm.stopBroadcast();

        console.log("Mintmarks deployed at:", address(mintmarks));
        console.log("Using verifier:", VERIFIER);
        return mintmarks;
    }
}
