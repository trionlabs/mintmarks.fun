// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {Mintmarks, IVerifier} from "../src/Mintmarks.sol";

contract MockVerifier is IVerifier {
    bool public shouldVerify = true;

    function setVerify(bool _verify) external {
        shouldVerify = _verify;
    }

    function verify(bytes calldata, bytes32[] calldata) external view returns (bool) {
        return shouldVerify;
    }
}

contract MintmarksTest is Test {
    Mintmarks public mintmarks;
    MockVerifier public mockVerifier;

    address public alice = address(0x1);
    address public bob = address(0x2);

    // Sample public inputs matching circuit structure
    bytes32[] public sampleInputs;

    function setUp() public {
        mockVerifier = new MockVerifier();
        mintmarks = new Mintmarks(address(mockVerifier));

        // Build sample public inputs (324 elements)
        sampleInputs = new bytes32[](324);

        // [0]: pubkey_hash
        sampleInputs[0] = bytes32(uint256(0x1234));

        // [1]: nullifier
        sampleInputs[1] = bytes32(uint256(0xabcd));

        // [2-65]: date.storage (64 bytes) - "Sat, 22 Nov 2025"
        bytes memory date = "Sat, 22 Nov 2025 04:14:00 +0000";
        for (uint256 i = 0; i < date.length && i < 64; i++) {
            sampleInputs[2 + i] = bytes32(uint256(uint8(date[i])));
        }

        // [66]: date.len
        sampleInputs[66] = bytes32(date.length);

        // [67-322]: event_name.storage (256 bytes) - "NPC Side Event"
        bytes memory eventName = "NPC Side Event";
        for (uint256 i = 0; i < eventName.length && i < 256; i++) {
            sampleInputs[67 + i] = bytes32(uint256(uint8(eventName[i])));
        }

        // [323]: event_name.len
        sampleInputs[323] = bytes32(eventName.length);
    }

    function test_mint_success() public {
        vm.prank(alice);
        mintmarks.mint("", sampleInputs);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        assertEq(mintmarks.balanceOf(alice, tokenId), 1);
        assertEq(mintmarks.tokenNames(tokenId), "NPC Side Event");
        assertTrue(mintmarks.nullifierUsed(sampleInputs[1]));
    }

    function test_mint_emits_event() public {
        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        vm.expectEmit(true, true, false, true);
        emit Mintmarks.Minted(alice, tokenId, "NPC Side Event", sampleInputs[1]);

        vm.prank(alice);
        mintmarks.mint("", sampleInputs);
    }

    function test_mint_reverts_on_invalid_proof() public {
        mockVerifier.setVerify(false);

        vm.prank(alice);
        vm.expectRevert(Mintmarks.InvalidProof.selector);
        mintmarks.mint("", sampleInputs);
    }

    function test_mint_reverts_on_nullifier_reuse() public {
        vm.prank(alice);
        mintmarks.mint("", sampleInputs);

        vm.prank(bob);
        vm.expectRevert(Mintmarks.NullifierAlreadyUsed.selector);
        mintmarks.mint("", sampleInputs);
    }

    function test_same_event_different_nullifiers() public {
        // First mint
        vm.prank(alice);
        mintmarks.mint("", sampleInputs);

        // Change nullifier
        sampleInputs[1] = bytes32(uint256(0xdead));

        // Second mint should succeed
        vm.prank(bob);
        mintmarks.mint("", sampleInputs);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        assertEq(mintmarks.balanceOf(alice, tokenId), 1);
        assertEq(mintmarks.balanceOf(bob, tokenId), 1);
    }

    function test_uri_returns_base64_json() public {
        vm.prank(alice);
        mintmarks.mint("", sampleInputs);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");
        string memory tokenUri = mintmarks.uri(tokenId);

        // Check it starts with base64 data URI
        assertTrue(bytes(tokenUri).length > 0);
        assertTrue(_startsWith(tokenUri, "data:application/json;base64,"));
    }

    function test_uri_empty_for_unknown_token() public view {
        uint256 unknownTokenId = uint256(keccak256("Unknown Event"));
        assertEq(mintmarks.uri(unknownTokenId), "");
    }

    function test_getTokenId_deterministic() public view {
        uint256 id1 = mintmarks.getTokenId("NPC Side Event");
        uint256 id2 = mintmarks.getTokenId("NPC Side Event");
        uint256 id3 = mintmarks.getTokenId("Different Event");

        assertEq(id1, id2);
        assertTrue(id1 != id3);
    }

    function test_name_and_symbol() public view {
        assertEq(mintmarks.name(), "Mintmarks");
        assertEq(mintmarks.symbol(), "MARK");
    }

    function test_contractURI() public view {
        string memory contractUri = mintmarks.contractURI();
        assertTrue(bytes(contractUri).length > 0);
        assertTrue(_startsWith(contractUri, "data:application/json;base64,"));
    }

    function _startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);
        if (strBytes.length < prefixBytes.length) return false;
        for (uint256 i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) return false;
        }
        return true;
    }
}
