// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {HonkVerifier} from "../src/UltraHonkVerifier.sol";

contract DeployScript is Script {
    function run() external returns (HonkVerifier) {
        vm.startBroadcast();
        HonkVerifier verifier = new HonkVerifier();
        vm.stopBroadcast();

        console.log("HonkVerifier deployed at:", address(verifier));
        return verifier;
    }
}
