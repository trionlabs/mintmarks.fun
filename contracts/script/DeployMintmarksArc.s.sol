// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {Mintmarks} from "../src/Mintmarks-arc.sol";

contract DeployMintmarksArcScript is Script {
    function run() external returns (Mintmarks) {
        address emailVerifier = vm.envAddress("EMAIL_VERIFIER_ADDRESS");
        address passportVerifier = vm.envAddress("ZKPASSPORT_VERIFIER_ADDRESS");
        // Owner defaults to deployer, can be overridden with MINTMARKS_OWNER
        address owner = vm.envOr("MINTMARKS_OWNER", msg.sender);

        vm.startBroadcast();
        Mintmarks mintmarks = new Mintmarks(emailVerifier, passportVerifier, owner);
        vm.stopBroadcast();

        console.log("Mintmarks-arc deployed at:", address(mintmarks));
        console.log("Email verifier:", emailVerifier);
        console.log("Passport verifier:", passportVerifier);
        console.log("Owner:", owner);
        console.log("Luma pubkey hash:", vm.toString(mintmarks.LUMA_PUBKEY_HASH()));
        console.log("");
        console.log("Add to .env:");
        console.log("MINTMARKS_ARC_ADDRESS=%s", address(mintmarks));

        return mintmarks;
    }
}


