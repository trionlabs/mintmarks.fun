// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {Mintmarks} from "../src/Mintmarks.sol";

contract DeployMintmarksScript is Script {
    function run() external returns (Mintmarks) {
        address verifier = vm.envAddress("VERIFIER_ADDRESS");

        vm.startBroadcast();
        Mintmarks mintmarks = new Mintmarks(verifier);
        vm.stopBroadcast();

        console.log("Mintmarks deployed at:", address(mintmarks));
        console.log("Using verifier:", verifier);
        console.log("");
        console.log("Add to .env:");
        console.log("MINTMARKS_ADDRESS=%s", address(mintmarks));

        return mintmarks;
    }
}
