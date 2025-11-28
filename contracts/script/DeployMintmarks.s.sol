// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {Mintmarks} from "../src/Mintmarks.sol";

contract DeployMintmarksScript is Script {
    function run() external returns (Mintmarks) {
        address emailVerifier = vm.envAddress("EMAIL_VERIFIER_ADDRESS");
        address passportVerifier = vm.envAddress("ZKPASSPORT_VERIFIER_ADDRESS");

        vm.startBroadcast();
        Mintmarks mintmarks = new Mintmarks(emailVerifier, passportVerifier);
        vm.stopBroadcast();

        console.log("Mintmarks deployed at:", address(mintmarks));
        console.log("Email verifier:", emailVerifier);
        console.log("Passport verifier:", passportVerifier);
        console.log("");
        console.log("Add to .env:");
        console.log("MINTMARKS_ADDRESS=%s", address(mintmarks));

        return mintmarks;
    }
}
