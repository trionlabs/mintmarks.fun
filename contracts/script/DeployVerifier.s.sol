// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {HonkVerifier} from "@verifier/UltraHonkVerifier.sol";

contract DeployVerifierScript is Script {
    function run() external returns (HonkVerifier) {
        vm.startBroadcast();
        HonkVerifier verifier = new HonkVerifier();
        vm.stopBroadcast();

        console.log("HonkVerifier deployed at:", address(verifier));
        console.log("");
        console.log("Add to .env:");
        console.log("VERIFIER_ADDRESS=%s", address(verifier));

        return verifier;
    }
}
