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
        // Fixed scope "mintmarks" produces stable passportId for 1:1 wallet binding
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
                scope: "mintmarks",
                devMode: false
            })
        });

        // Setup mock helper with correct bound data
        mockPassportVerifier.helper().setBoundData(alice, block.chainid, "");
    }

    /*//////////////////////////////////////////////////////////////
                         EMAIL-ONLY MINT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_mint_email_only_success() public {
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        assertEq(mintmarks.balanceOf(alice, tokenId), 1);
        assertEq(mintmarks.tokenNames(tokenId), "NPC Side Event");
        assertTrue(mintmarks.emailNullifierUsed(sampleEmailInputs[1]));
        assertTrue(mintmarks.hasMinted(alice, tokenId));
        assertFalse(mintmarks.isPassportVerified(alice, tokenId));
    }

    function test_mint_email_only_emits_event() public {
        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        vm.expectEmit(true, true, false, true);
        emit Mintmarks.Minted(
            alice,
            tokenId,
            "NPC Side Event",
            sampleEmailInputs[1],
            bytes32(0),
            false
        );

        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);
    }

    function test_mint_email_only_reverts_on_invalid_proof() public {
        mockEmailVerifier.setVerify(false);

        vm.prank(alice);
        vm.expectRevert(Mintmarks.InvalidEmailProof.selector);
        mintmarks.mint("", sampleEmailInputs);
    }

    function test_mint_email_only_reverts_on_nullifier_reuse() public {
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        vm.prank(bob);
        vm.expectRevert(Mintmarks.EmailNullifierAlreadyUsed.selector);
        mintmarks.mint("", sampleEmailInputs);
    }

    function test_mint_email_only_reverts_on_same_event_twice() public {
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        // Different email nullifier, same event
        sampleEmailInputs[1] = bytes32(uint256(0xdead));

        vm.prank(alice);
        vm.expectRevert(Mintmarks.AlreadyMintedThisEvent.selector);
        mintmarks.mint("", sampleEmailInputs);
    }

    /*//////////////////////////////////////////////////////////////
                      PASSPORT-VERIFIED MINT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_mint_with_passport_success() public {
        vm.prank(alice);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        assertEq(mintmarks.balanceOf(alice, tokenId), 1);
        assertEq(mintmarks.tokenNames(tokenId), "NPC Side Event");
        assertTrue(mintmarks.emailNullifierUsed(sampleEmailInputs[1]));
        assertTrue(mintmarks.hasMinted(alice, tokenId));
        assertTrue(mintmarks.isPassportVerified(alice, tokenId));
        assertTrue(mintmarks.passportUsedForEvent(mockPassportVerifier.uniqueId(), tokenId));
    }

    function test_mint_with_passport_emits_event() public {
        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        vm.expectEmit(true, true, false, true);
        emit Mintmarks.Minted(
            alice,
            tokenId,
            "NPC Side Event",
            sampleEmailInputs[1],
            mockPassportVerifier.uniqueId(),
            true
        );

        vm.prank(alice);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_with_passport_reverts_on_invalid_email_proof() public {
        mockEmailVerifier.setVerify(false);

        vm.prank(alice);
        vm.expectRevert(Mintmarks.InvalidEmailProof.selector);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_with_passport_reverts_on_invalid_passport_proof() public {
        mockPassportVerifier.setVerify(false);

        vm.prank(alice);
        vm.expectRevert(Mintmarks.InvalidPassportProof.selector);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_with_passport_reverts_on_invalid_scope() public {
        mockPassportVerifier.helper().setScopeValid(false);

        vm.prank(alice);
        vm.expectRevert(Mintmarks.InvalidPassportScope.selector);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_with_passport_reverts_on_wrong_sender() public {
        vm.prank(bob);
        vm.expectRevert(Mintmarks.InvalidBoundAddress.selector);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_with_passport_reverts_on_wrong_chain() public {
        mockPassportVerifier.helper().setBoundData(alice, 999, "");

        vm.prank(alice);
        vm.expectRevert(Mintmarks.InvalidBoundChain.selector);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_with_passport_reverts_on_same_event_twice() public {
        vm.prank(alice);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        // Different email nullifier, same event
        sampleEmailInputs[1] = bytes32(uint256(0xdead));

        vm.prank(alice);
        vm.expectRevert(Mintmarks.AlreadyMintedThisEvent.selector);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);
    }

    function test_mint_with_passport_reverts_on_passport_reuse_different_wallet() public {
        vm.prank(alice);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        // Setup bob with different email but same passport
        sampleEmailInputs[1] = bytes32(uint256(0xbeef));
        mockPassportVerifier.helper().setBoundData(bob, block.chainid, "");
        // Keep same passport uniqueId - now bound to Alice's wallet

        // 1:1 binding: passport already bound to alice, can't be used by bob
        vm.prank(bob);
        vm.expectRevert(Mintmarks.PassportBoundToDifferentWallet.selector);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);
    }

    /*//////////////////////////////////////////////////////////////
                    1:1 WALLET-PASSPORT BINDING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_wallet_bound_to_different_passport_reverts() public {
        // Alice mints with passport 1
        vm.prank(alice);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        // Alice tries to use a different passport for another event
        sampleEmailInputs[1] = bytes32(uint256(0xdead));
        bytes memory eventName2 = "Another Event";
        for (uint256 i = 0; i < eventName2.length && i < 256; i++) {
            sampleEmailInputs[67 + i] = bytes32(uint256(uint8(eventName2[i])));
        }
        for (uint256 i = eventName2.length; i < 256; i++) {
            sampleEmailInputs[67 + i] = bytes32(0);
        }
        sampleEmailInputs[323] = bytes32(eventName2.length);

        // Set a different passport uniqueId
        mockPassportVerifier.setUniqueId(bytes32(uint256(0x2222)));

        // Alice tries to mint with different passport - should fail
        // 1:1 binding: wallet already bound to passport 0x1111
        vm.prank(alice);
        vm.expectRevert(Mintmarks.WalletBoundToDifferentPassport.selector);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);
    }

    function test_wallet_passport_mappings_set_correctly() public {
        bytes32 passportId = mockPassportVerifier.uniqueId();

        // Before mint, mappings should be empty
        assertEq(mintmarks.walletPassport(alice), bytes32(0));
        assertEq(mintmarks.passportWallet(passportId), address(0));

        // Alice mints with passport
        vm.prank(alice);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        // Mappings should be set
        assertEq(mintmarks.walletPassport(alice), passportId);
        assertEq(mintmarks.passportWallet(passportId), alice);
    }

    function test_upgrade_sets_wallet_passport_binding() public {
        bytes32 passportId = mockPassportVerifier.uniqueId();

        // Alice mints email-only
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        // Before upgrade, mappings should be empty
        assertEq(mintmarks.walletPassport(alice), bytes32(0));
        assertEq(mintmarks.passportWallet(passportId), address(0));

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        // Alice upgrades
        vm.prank(alice);
        mintmarks.upgradeToVerified(tokenId, samplePassportParams);

        // Mappings should be set
        assertEq(mintmarks.walletPassport(alice), passportId);
        assertEq(mintmarks.passportWallet(passportId), alice);
    }

    function test_upgrade_reverts_if_wallet_bound_to_different_passport() public {
        // Alice mints with passport for event 1
        vm.prank(alice);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        // Alice mints email-only for event 2
        sampleEmailInputs[1] = bytes32(uint256(0xdead));
        bytes memory eventName2 = "Another Event";
        for (uint256 i = 0; i < eventName2.length && i < 256; i++) {
            sampleEmailInputs[67 + i] = bytes32(uint256(uint8(eventName2[i])));
        }
        for (uint256 i = eventName2.length; i < 256; i++) {
            sampleEmailInputs[67 + i] = bytes32(0);
        }
        sampleEmailInputs[323] = bytes32(eventName2.length);

        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        uint256 tokenId2 = mintmarks.getTokenId("Another Event");

        // Alice tries to upgrade with a different passport
        mockPassportVerifier.setUniqueId(bytes32(uint256(0x3333)));

        vm.prank(alice);
        vm.expectRevert(Mintmarks.WalletBoundToDifferentPassport.selector);
        mintmarks.upgradeToVerified(tokenId2, samplePassportParams);
    }

    /*//////////////////////////////////////////////////////////////
                    CROSS-MODE AND MULTI-MINT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_same_passport_can_mint_different_events() public {
        // First mint event 1
        vm.prank(alice);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        // Different email nullifier and event name
        sampleEmailInputs[1] = bytes32(uint256(0xdead));
        bytes memory eventName2 = "Another Event";
        for (uint256 i = 0; i < eventName2.length && i < 256; i++) {
            sampleEmailInputs[67 + i] = bytes32(uint256(uint8(eventName2[i])));
        }
        for (uint256 i = eventName2.length; i < 256; i++) {
            sampleEmailInputs[67 + i] = bytes32(0);
        }
        sampleEmailInputs[323] = bytes32(eventName2.length);

        // Same passport, different event - should work
        vm.prank(alice);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        uint256 tokenId1 = mintmarks.getTokenId("NPC Side Event");
        uint256 tokenId2 = mintmarks.getTokenId("Another Event");
        assertEq(mintmarks.balanceOf(alice, tokenId1), 1);
        assertEq(mintmarks.balanceOf(alice, tokenId2), 1);
        assertTrue(mintmarks.isPassportVerified(alice, tokenId1));
        assertTrue(mintmarks.isPassportVerified(alice, tokenId2));
    }

    function test_different_users_can_mint_same_event_email_only() public {
        // Alice mints
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        // Bob mints with different email nullifier
        sampleEmailInputs[1] = bytes32(uint256(0xbeef));

        vm.prank(bob);
        mintmarks.mint("", sampleEmailInputs);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");
        assertEq(mintmarks.balanceOf(alice, tokenId), 1);
        assertEq(mintmarks.balanceOf(bob, tokenId), 1);
        assertFalse(mintmarks.isPassportVerified(alice, tokenId));
        assertFalse(mintmarks.isPassportVerified(bob, tokenId));
    }

    function test_different_users_can_mint_same_event_with_passport() public {
        // Alice mints with passport
        vm.prank(alice);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        // Setup for Bob with different email and passport
        sampleEmailInputs[1] = bytes32(uint256(0xbeef));
        mockPassportVerifier.helper().setBoundData(bob, block.chainid, "");
        mockPassportVerifier.setUniqueId(bytes32(uint256(0x3333)));

        // Bob mints with passport
        vm.prank(bob);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");
        assertEq(mintmarks.balanceOf(alice, tokenId), 1);
        assertEq(mintmarks.balanceOf(bob, tokenId), 1);
        assertTrue(mintmarks.isPassportVerified(alice, tokenId));
        assertTrue(mintmarks.isPassportVerified(bob, tokenId));
    }

    function test_user_cannot_mint_same_event_with_different_modes() public {
        // Alice mints email-only first
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        // Alice tries to mint same event with passport
        sampleEmailInputs[1] = bytes32(uint256(0xdead));

        vm.prank(alice);
        vm.expectRevert(Mintmarks.AlreadyMintedThisEvent.selector);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);
    }

    /*//////////////////////////////////////////////////////////////
                          UPGRADE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_upgrade_success() public {
        // Alice mints email-only first
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        // Verify initial state
        assertTrue(mintmarks.hasMinted(alice, tokenId));
        assertFalse(mintmarks.isPassportVerified(alice, tokenId));

        // Alice upgrades to verified
        vm.prank(alice);
        mintmarks.upgradeToVerified(tokenId, samplePassportParams);

        // Verify upgraded state
        assertTrue(mintmarks.isPassportVerified(alice, tokenId));
        assertTrue(mintmarks.passportUsedForEvent(mockPassportVerifier.uniqueId(), tokenId));
    }

    function test_upgrade_emits_event() public {
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        vm.expectEmit(true, true, false, true);
        emit Mintmarks.Upgraded(alice, tokenId, mockPassportVerifier.uniqueId());

        vm.prank(alice);
        mintmarks.upgradeToVerified(tokenId, samplePassportParams);
    }

    function test_upgrade_reverts_if_not_minted() public {
        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        vm.prank(alice);
        vm.expectRevert(Mintmarks.NotMinted.selector);
        mintmarks.upgradeToVerified(tokenId, samplePassportParams);
    }

    function test_upgrade_reverts_if_already_verified() public {
        // Alice mints with passport (already verified)
        vm.prank(alice);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        // Try to upgrade - should fail
        mockPassportVerifier.setUniqueId(bytes32(uint256(0x2222))); // Different passport
        vm.prank(alice);
        vm.expectRevert(Mintmarks.AlreadyVerified.selector);
        mintmarks.upgradeToVerified(tokenId, samplePassportParams);
    }

    function test_upgrade_reverts_on_invalid_passport() public {
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        mockPassportVerifier.setVerify(false);

        vm.prank(alice);
        vm.expectRevert(Mintmarks.InvalidPassportProof.selector);
        mintmarks.upgradeToVerified(tokenId, samplePassportParams);
    }

    function test_upgrade_reverts_if_user_hasnt_minted() public {
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        // Bob tries to upgrade but Bob hasn't minted this token
        // The hasMinted check fails before reaching bound address check
        vm.prank(bob);
        vm.expectRevert(Mintmarks.NotMinted.selector);
        mintmarks.upgradeToVerified(tokenId, samplePassportParams);
    }

    function test_upgrade_reverts_on_wrong_bound_address() public {
        // Alice mints email-only
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        // Set passport bound data to Bob (not Alice)
        mockPassportVerifier.helper().setBoundData(bob, block.chainid, "");

        // Alice tries to upgrade with passport bound to Bob
        vm.prank(alice);
        vm.expectRevert(Mintmarks.InvalidBoundAddress.selector);
        mintmarks.upgradeToVerified(tokenId, samplePassportParams);
    }

    function test_upgrade_reverts_on_passport_bound_to_different_wallet() public {
        // Alice mints email-only
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        // Bob mints with passport for same event (passport now bound to Bob)
        sampleEmailInputs[1] = bytes32(uint256(0xbeef));
        mockPassportVerifier.helper().setBoundData(bob, block.chainid, "");
        // Keep same passport uniqueId

        vm.prank(bob);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        // Alice tries to upgrade with same passport - should fail
        // 1:1 binding: passport bound to bob, alice can't use it
        mockPassportVerifier.helper().setBoundData(alice, block.chainid, "");
        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        vm.prank(alice);
        vm.expectRevert(Mintmarks.PassportBoundToDifferentWallet.selector);
        mintmarks.upgradeToVerified(tokenId, samplePassportParams);
    }

    function test_same_passport_can_upgrade_different_events() public {
        // Alice mints email-only for event 1
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        // Alice mints email-only for event 2
        sampleEmailInputs[1] = bytes32(uint256(0xdead));
        bytes memory eventName2 = "Another Event";
        for (uint256 i = 0; i < eventName2.length && i < 256; i++) {
            sampleEmailInputs[67 + i] = bytes32(uint256(uint8(eventName2[i])));
        }
        for (uint256 i = eventName2.length; i < 256; i++) {
            sampleEmailInputs[67 + i] = bytes32(0);
        }
        sampleEmailInputs[323] = bytes32(eventName2.length);

        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        uint256 tokenId1 = mintmarks.getTokenId("NPC Side Event");
        uint256 tokenId2 = mintmarks.getTokenId("Another Event");

        // Upgrade both with same passport
        vm.prank(alice);
        mintmarks.upgradeToVerified(tokenId1, samplePassportParams);

        vm.prank(alice);
        mintmarks.upgradeToVerified(tokenId2, samplePassportParams);

        assertTrue(mintmarks.isPassportVerified(alice, tokenId1));
        assertTrue(mintmarks.isPassportVerified(alice, tokenId2));
    }

    /*//////////////////////////////////////////////////////////////
                    VERIFICATION STATUS QUERIES
    //////////////////////////////////////////////////////////////*/

    function test_get_verification_status() public {
        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        // Before mint
        assertFalse(mintmarks.getVerificationStatus(alice, tokenId));

        // After email-only mint
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);
        assertFalse(mintmarks.getVerificationStatus(alice, tokenId));

        // Setup bob with passport
        sampleEmailInputs[1] = bytes32(uint256(0xbeef));
        mockPassportVerifier.helper().setBoundData(bob, block.chainid, "");
        mockPassportVerifier.setUniqueId(bytes32(uint256(0x3333)));

        // After passport mint
        vm.prank(bob);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);
        assertTrue(mintmarks.getVerificationStatus(bob, tokenId));
    }

    function test_get_verification_status_batch() public {
        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        // Alice mints email-only
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        // Bob mints with passport
        sampleEmailInputs[1] = bytes32(uint256(0xbeef));
        mockPassportVerifier.helper().setBoundData(bob, block.chainid, "");
        mockPassportVerifier.setUniqueId(bytes32(uint256(0x3333)));

        vm.prank(bob);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        // Batch query
        address[] memory users = new address[](2);
        users[0] = alice;
        users[1] = bob;

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = tokenId;
        tokenIds[1] = tokenId;

        bool[] memory statuses = mintmarks.getVerificationStatusBatch(users, tokenIds);
        assertFalse(statuses[0]); // Alice - email only
        assertTrue(statuses[1]);  // Bob - passport verified
    }

    /*//////////////////////////////////////////////////////////////
                         METADATA TESTS
    //////////////////////////////////////////////////////////////*/

    function test_uri_returns_base64_json() public {
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");
        string memory tokenUri = mintmarks.uri(tokenId);

        assertTrue(bytes(tokenUri).length > 0);
        assertTrue(_startsWith(tokenUri, "data:application/json;base64,"));
    }

    function test_userTokenURI_returns_correct_verification_status() public {
        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        // Alice mints email-only
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        // Bob mints with passport
        sampleEmailInputs[1] = bytes32(uint256(0xbeef));
        mockPassportVerifier.helper().setBoundData(bob, block.chainid, "");
        mockPassportVerifier.setUniqueId(bytes32(uint256(0x3333)));

        vm.prank(bob);
        mintmarks.mintWithPassport("", sampleEmailInputs, samplePassportParams);

        // Check Alice's userTokenURI (email only - should show yellow badge)
        string memory aliceUri = mintmarks.userTokenURI(alice, tokenId);
        assertTrue(bytes(aliceUri).length > 0);
        assertTrue(_startsWith(aliceUri, "data:application/json;base64,"));

        // Check Bob's userTokenURI (passport verified - should show green badge)
        string memory bobUri = mintmarks.userTokenURI(bob, tokenId);
        assertTrue(bytes(bobUri).length > 0);
        assertTrue(_startsWith(bobUri, "data:application/json;base64,"));

        // URIs should be different (different verification levels)
        assertTrue(keccak256(bytes(aliceUri)) != keccak256(bytes(bobUri)));
    }

    function test_userTokenURI_returns_empty_for_non_holder() public {
        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        // Alice hasn't minted
        string memory uri = mintmarks.userTokenURI(alice, tokenId);
        assertEq(bytes(uri).length, 0);
    }

    function test_userTokenURI_updates_after_upgrade() public {
        uint256 tokenId = mintmarks.getTokenId("NPC Side Event");

        // Alice mints email-only
        vm.prank(alice);
        mintmarks.mint("", sampleEmailInputs);

        // Get URI before upgrade
        string memory uriBefore = mintmarks.userTokenURI(alice, tokenId);

        // Alice upgrades
        vm.prank(alice);
        mintmarks.upgradeToVerified(tokenId, samplePassportParams);

        // Get URI after upgrade
        string memory uriAfter = mintmarks.userTokenURI(alice, tokenId);

        // URIs should be different (verification changed)
        assertTrue(keccak256(bytes(uriBefore)) != keccak256(bytes(uriAfter)));
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

    /*//////////////////////////////////////////////////////////////
                            HELPERS
    //////////////////////////////////////////////////////////////*/

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
