// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Mintmarks, IEmailVerifier} from "../src/Mintmarks.sol";
import {
    IZKPassportVerifier,
    IZKPassportHelper,
    ProofVerificationParams,
    ProofVerificationData,
    ServiceConfig,
    BoundData
} from "../src/interfaces/IZKPassportVerifier.sol";

contract MockEmailVerifier is IEmailVerifier {
    bool public shouldVerify = true;

    function setVerify(bool _verify) external {
        shouldVerify = _verify;
    }

    function verify(bytes calldata, bytes32[] calldata) external view returns (bool) {
        return shouldVerify;
    }
}

contract MockZKPassportHelper is IZKPassportHelper {
    BoundData public boundData;
    bool public scopeValid = true;
    bool public ageValid = true;

    function setBoundData(address _sender, uint256 _chainId, string memory _customData) external {
        boundData = BoundData(_sender, _chainId, _customData);
    }

    function setScopeValid(bool _valid) external {
        scopeValid = _valid;
    }

    function setAgeValid(bool _valid) external {
        ageValid = _valid;
    }

    function getBoundData(bytes calldata) external view returns (BoundData memory) {
        return boundData;
    }

    function verifyScopes(bytes32[] calldata, string calldata, string calldata) external view returns (bool) {
        return scopeValid;
    }

    function isAgeAboveOrEqual(uint8, bytes calldata) external view returns (bool) {
        return ageValid;
    }
}

contract MockZKPassportVerifier is IZKPassportVerifier {
    bool public shouldVerify = true;
    bytes32 public uniqueId = bytes32(uint256(0x1111));
    MockZKPassportHelper public helper;

    constructor() {
        helper = new MockZKPassportHelper();
    }

    function setVerify(bool _verify) external {
        shouldVerify = _verify;
    }

    function setUniqueId(bytes32 _id) external {
        uniqueId = _id;
    }

    function verify(ProofVerificationParams calldata)
        external
        view
        returns (bool verified, bytes32 uniqueIdentifier, IZKPassportHelper _helper)
    {
        return (shouldVerify, uniqueId, helper);
    }
}

contract MintmarksTest is Test {
    Mintmarks public mintmarks;
    MockEmailVerifier public mockEmailVerifier;
    MockZKPassportVerifier public mockPassportVerifier;

    address public alice = address(0x1);
    address public bob = address(0x2);

    bytes32[] public sampleEmailInputs;
    ProofVerificationParams public samplePassportParams;

    function setUp() public {
        mockEmailVerifier = new MockEmailVerifier();
        mockPassportVerifier = new MockZKPassportVerifier();
        mintmarks = new Mintmarks(
            address(mockEmailVerifier),
            address(mockPassportVerifier)
        );

        // Build sample email public inputs (324 elements)
        sampleEmailInputs = new bytes32[](324);
        sampleEmailInputs[0] = bytes32(uint256(0x1234)); // pubkey_hash
        sampleEmailInputs[1] = bytes32(uint256(0xabcd)); // nullifier

        // date.storage
        bytes memory date = "Sat, 22 Nov 2025 04:14:00 +0000";
        for (uint256 i = 0; i < date.length && i < 64; i++) {
            sampleEmailInputs[2 + i] = bytes32(uint256(uint8(date[i])));
        }
        sampleEmailInputs[66] = bytes32(date.length);

        // event_name.storage
        bytes memory eventName = "NPC Side Event";
        for (uint256 i = 0; i < eventName.length && i < 256; i++) {
            sampleEmailInputs[67 + i] = bytes32(uint256(uint8(eventName[i])));
        }
        sampleEmailInputs[323] = bytes32(eventName.length);

        // Setup passport params (mostly empty for mock)
        samplePassportParams = ProofVerificationParams({
            version: bytes32(0),
            proofVerificationData: ProofVerificationData({
                vkeyHash: bytes32(0),
                proof: "",
                publicInputs: new bytes32[](0)
            }),
            committedInputs: "",
            serviceConfig: ServiceConfig({
                validityPeriodInSeconds: 3600,
                domain: "mintmarks.fun",
                scope: "mintmarks-personhood",
                devMode: false
            })
        });

        // Setup mock helper with correct bound data
        // Email nullifier as hex string: 0x000...abcd
        string memory nullifierHex = _bytes32ToHexString(sampleEmailInputs[1]);
        mockPassportVerifier.helper().setBoundData(alice, block.chainid, nullifierHex);
    }

    function test_mint_success() public {
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        assertEq(mintmarks.balanceOf(alice, tokenId), 1);
        assertEq(mintmarks.tokenNames(tokenId), "NPC Side Event");
        assertTrue(mintmarks.emailNullifierUsed(sampleEmailInputs[1]));
        assertTrue(mintmarks.passportIdUsed(mockPassportVerifier.uniqueId()));
    }

    function test_mint_emits_event() public {
        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        vm.expectEmit(true, true, false, true);
        emit Mintmarks.Minted(
            alice,
            tokenId,
            "NPC Side Event",
            sampleEmailInputs[1],
            mockPassportVerifier.uniqueId()
        );

        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_reverts_on_invalid_email_proof() public {
        mockEmailVerifier.setVerify(false);

        vm.prank(alice);
        vm.expectRevert(Mintmarks.InvalidEmailProof.selector);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_reverts_on_invalid_passport_proof() public {
        mockPassportVerifier.setVerify(false);

        vm.prank(alice);
        vm.expectRevert(Mintmarks.InvalidPassportProof.selector);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_reverts_on_invalid_scope() public {
        mockPassportVerifier.helper().setScopeValid(false);

        vm.prank(alice);
        vm.expectRevert(Mintmarks.InvalidPassportScope.selector);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_reverts_on_wrong_sender() public {
        // Bound data has alice, but bob is calling
        vm.prank(bob);
        vm.expectRevert(Mintmarks.InvalidBoundAddress.selector);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_reverts_on_wrong_chain() public {
        // Set wrong chain ID in bound data
        string memory nullifierHex = _bytes32ToHexString(sampleEmailInputs[1]);
        mockPassportVerifier.helper().setBoundData(alice, 999, nullifierHex);

        vm.prank(alice);
        vm.expectRevert(Mintmarks.InvalidBoundChain.selector);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_reverts_on_wrong_email_nullifier_binding() public {
        // Set wrong email nullifier in bound data
        mockPassportVerifier.helper().setBoundData(alice, block.chainid, "0xwrongnullifier");

        vm.prank(alice);
        vm.expectRevert(Mintmarks.InvalidBoundEmailNullifier.selector);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_reverts_on_email_nullifier_reuse() public {
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);

        // Try to mint again with same email nullifier but different passport
        mockPassportVerifier.setUniqueId(bytes32(uint256(0x2222)));

        vm.prank(alice);
        vm.expectRevert(Mintmarks.EmailNullifierAlreadyUsed.selector);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_reverts_on_passport_id_reuse() public {
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);

        // Try to mint again with same passport but different email nullifier
        sampleEmailInputs[1] = bytes32(uint256(0xdead));
        string memory newNullifierHex = _bytes32ToHexString(sampleEmailInputs[1]);
        mockPassportVerifier.helper().setBoundData(alice, block.chainid, newNullifierHex);

        vm.prank(alice);
        vm.expectRevert(Mintmarks.PassportIdAlreadyUsed.selector);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);
    }

    function test_different_users_can_mint_same_event() public {
        // Alice mints
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);

        // Setup for Bob with different nullifiers
        sampleEmailInputs[1] = bytes32(uint256(0xbeef));
        string memory bobNullifierHex = _bytes32ToHexString(sampleEmailInputs[1]);
        mockPassportVerifier.helper().setBoundData(bob, block.chainid, bobNullifierHex);
        mockPassportVerifier.setUniqueId(bytes32(uint256(0x3333)));

        // Bob mints
        vm.prank(bob);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");
        assertEq(mintmarks.balanceOf(alice, tokenId), 1);
        assertEq(mintmarks.balanceOf(bob, tokenId), 1);
    }

    function test_uri_returns_base64_json() public {
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs, samplePassportParams);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");
        string memory tokenUri = mintmarks.uri(tokenId);

        assertTrue(bytes(tokenUri).length > 0);
        assertTrue(_startsWith(tokenUri, "data:application/json;base64,"));
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

    // Helper: convert bytes32 to hex string (must match contract implementation)
    function _bytes32ToHexString(bytes32 data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(66);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 32; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
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
