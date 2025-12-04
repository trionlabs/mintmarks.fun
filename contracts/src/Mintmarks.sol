// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {
    IZKPassportVerifier,
    IZKPassportHelper,
    ProofVerificationParams,
    BoundData
} from "./interfaces/IZKPassportVerifier.sol";


interface IEmailVerifier {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool);
}

/// @title Mintmarks
/// @author Mintmarks Team
/// @notice Soulbound ERC1155 tokens proving event attendance via ZK verification
/// @dev Supports two minting modes:
///      1. Email-only: Proves event attendance (mint)
///      2. Passport-verified: Proves attendance + unique personhood (mintWithPassport)
///      Tokens are non-transferable (soulbound) - only minting is allowed.
contract Mintmarks is ERC1155, Ownable {
    using Strings for uint256;
    using Strings for int256;

    /*//////////////////////////////////////////////////////////////
                            PUBLIC INPUTS LAYOUT
    //////////////////////////////////////////////////////////////*/

    /// @dev Public inputs structure from Noir circuit:
    ///      [0]: pubkey_hash - Poseidon hash of DKIM public key
    ///      [1]: email_nullifier - Pedersen hash of signature (prevents double-claiming)
    ///      [2-65]: date.storage (64 bytes)
    ///      [66]: date.len
    ///      [67-322]: event_name.storage (256 bytes)
    ///      [323]: event_name.len
    uint256 private constant PUBKEY_HASH_INDEX = 0;
    uint256 private constant NULLIFIER_INDEX = 1;
    uint256 private constant EVENT_NAME_START = 67;
    uint256 private constant EVENT_NAME_LEN_INDEX = 323;

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice The domain that passport proofs must be scoped to
    string public constant DOMAIN = "mintmarks.fun";

    /// @notice The fixed scope for passport proofs
    /// @dev All passport proofs use the same scope for stable passportId (1:1 wallet-passport binding)
    string public constant SCOPE = "mintmarks";

    /// @notice Known Luma DKIM public key hashes (user.luma-mail.com)
    /// @dev Poseidon hash of the RSA-2048 DKIM public keys used by Luma
    /// @dev Luma rotates DKIM keys periodically - add new ones via setAllowedPubkeyHash()
    bytes32 public constant LUMA_PUBKEY_HASH = 0x2262a82e42989fff21ac1f474de8440bbd7ddec5e868dd699efdf4439184dcf0;
    
    /// @notice Secondary Luma DKIM public key hash (rotated key as of Dec 2024)
    bytes32 public constant LUMA_PUBKEY_HASH_2 = 0x14867ad1414e10a18a36e0db535e47f1a11a4d3d97f7eb3eb2ad6c09d8772e33;
    
    /// @notice Third Luma DKIM public key hash (another selector)
    bytes32 public constant LUMA_PUBKEY_HASH_3 = 0x1b38eebb7fe1727ea967eded5baf387e8455858dfa483e7de3bc7784144b4699;

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The DKIM email proof verifier contract
    IEmailVerifier public immutable EMAIL_VERIFIER;

    /// @notice The ZKPassport verifier contract
    IZKPassportVerifier public immutable PASSPORT_VERIFIER;

    /// @notice Tracks which DKIM pubkey hashes are allowed (Luma domains)
    /// @dev Only emails signed with allowed DKIM keys can mint
    mapping(bytes32 => bool) public allowedPubkeyHashes;

    /// @notice Tracks which email nullifiers have been used (prevents double-claiming same email)
    mapping(bytes32 => bool) public emailNullifierUsed;

    /// @notice Tracks which (user, event) combinations have been minted
    /// @dev Prevents same user from minting same event twice
    mapping(address => mapping(uint256 => bool)) public hasMinted;

    /// @notice Tracks passport verification status per (user, event)
    /// @dev True = passport verified, False = email only
    mapping(address => mapping(uint256 => bool)) public isPassportVerified;

    /// @notice Tracks passport usage per event (prevents same passport minting same event twice)
    mapping(bytes32 => mapping(uint256 => bool)) public passportUsedForEvent;

    /// @notice Maps wallet address to bound passport ID (1 wallet → 1 passport)
    mapping(address => bytes32) public walletPassport;

    /// @notice Maps passport ID to bound wallet address (1 passport → 1 wallet)
    mapping(bytes32 => address) public passportWallet;

    /// @notice Maps token IDs to their event names
    mapping(uint256 => string) public tokenNames;

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @dev Thrown when the DKIM email proof verification fails
    error InvalidEmailProof();

    /// @dev Thrown when the DKIM pubkey hash is not in the allowed list
    error InvalidPubkeyHash();

    /// @dev Thrown when the ZKPassport proof verification fails
    error InvalidPassportProof();

    /// @dev Thrown when the passport proof domain/scope doesn't match expected values
    error InvalidPassportScope();

    /// @dev Thrown when the bound sender address doesn't match msg.sender
    error InvalidBoundAddress();

    /// @dev Thrown when the bound chain ID doesn't match current chain
    error InvalidBoundChain();

    /// @dev Thrown when attempting to use an email nullifier that's already been claimed
    error EmailNullifierAlreadyUsed();

    /// @dev Thrown when user has already minted this event
    error AlreadyMintedThisEvent();

    /// @dev Thrown when passport has already been used for this event
    error PassportAlreadyUsedForEvent();

    /// @dev Thrown when the extracted event name exceeds 256 bytes
    error EventNameTooLong();

    /// @dev Thrown when attempting to transfer or burn a soulbound token
    error NonTransferable();

    /// @dev Thrown when trying to upgrade a token that hasn't been minted
    error NotMinted();

    /// @dev Thrown when trying to upgrade a token that's already passport verified
    error AlreadyVerified();

    /// @dev Thrown when wallet tries to use a different passport than previously bound
    error WalletBoundToDifferentPassport();

    /// @dev Thrown when passport tries to bind to a different wallet than previously bound
    error PassportBoundToDifferentWallet();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new Mintmark is minted
    /// @param to The address receiving the token
    /// @param tokenId The token ID (hash of event name)
    /// @param eventName The name of the event
    /// @param emailNullifier The nullifier from the email proof
    /// @param passportId The unique identifier from passport (bytes32(0) if not verified)
    /// @param passportVerified Whether passport verification was used
    event Minted(
        address indexed to,
        uint256 indexed tokenId,
        string eventName,
        bytes32 emailNullifier,
        bytes32 passportId,
        bool passportVerified
    );

    /// @notice Emitted when a user upgrades from email-only to passport-verified
    /// @param user The user address
    /// @param tokenId The token ID (hash of event name)
    /// @param passportId The unique identifier from passport
    event Upgraded(
        address indexed user,
        uint256 indexed tokenId,
        bytes32 passportId
    );

    /// @notice Emitted when a DKIM pubkey hash is added or removed from allowed list
    /// @param pubkeyHash The DKIM public key hash
    /// @param allowed Whether the hash is now allowed or not
    event PubkeyHashUpdated(bytes32 indexed pubkeyHash, bool allowed);

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Creates a new Mintmarks contract
    /// @param _emailVerifier Address of the DKIM email proof verifier (UltraHonk)
    /// @param _passportVerifier Address of the ZKPassport verifier
    /// @param _owner Address of the contract owner (can manage allowed pubkey hashes)
    constructor(
        address _emailVerifier,
        address _passportVerifier,
        address _owner
    ) ERC1155("") Ownable(_owner) {
        EMAIL_VERIFIER = IEmailVerifier(_emailVerifier);
        PASSPORT_VERIFIER = IZKPassportVerifier(_passportVerifier);

        // Add known Luma DKIM pubkey hashes to allowed list
        allowedPubkeyHashes[LUMA_PUBKEY_HASH] = true;
        emit PubkeyHashUpdated(LUMA_PUBKEY_HASH, true);
        
        allowedPubkeyHashes[LUMA_PUBKEY_HASH_2] = true;
        emit PubkeyHashUpdated(LUMA_PUBKEY_HASH_2, true);
        
        allowedPubkeyHashes[LUMA_PUBKEY_HASH_3] = true;
        emit PubkeyHashUpdated(LUMA_PUBKEY_HASH_3, true);
    }

    /*//////////////////////////////////////////////////////////////
                            ERC1155 METADATA
    //////////////////////////////////////////////////////////////*/

    /// @notice Returns the collection name
    /// @return The name "Mintmarks"
    function name() public pure returns (string memory) {
        return "Mintmarks";
    }

    /// @notice Returns the collection symbol
    /// @return The symbol "MARK"
    function symbol() public pure returns (string memory) {
        return "MARK";
    }

    /*//////////////////////////////////////////////////////////////
                           SOULBOUND LOGIC
    //////////////////////////////////////////////////////////////*/

    /// @dev Override to enforce soulbound behavior - only minting is allowed
    /// @param from Source address (must be zero for minting)
    /// @param to Destination address
    /// @param ids Array of token IDs
    /// @param values Array of amounts
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override {
        if (from != address(0)) {
            revert NonTransferable();
        }
        super._update(from, to, ids, values);
    }

    /*//////////////////////////////////////////////////////////////
                              MINTING
    //////////////////////////////////////////////////////////////*/

    /// @notice Mint with email proof only (not passport verified)
    /// @dev Proves event attendance but not unique personhood
    /// @param emailProof The UltraHonk proof bytes from the Noir circuit
    /// @param emailPublicInputs The public inputs array from the email proof
    function mint(
        bytes calldata emailProof,
        bytes32[] calldata emailPublicInputs
    ) external {
        _mintInternal(emailProof, emailPublicInputs, bytes32(0), false);
    }

    /// @notice Mint with email + passport proof (passport verified)
    /// @dev Proves event attendance AND unique personhood
    /// @param emailProof The UltraHonk proof bytes from the Noir circuit
    /// @param emailPublicInputs The public inputs array from the email proof
    /// @param passportParams The ZKPassport verification parameters
    function mintWithPassport(
        bytes calldata emailProof,
        bytes32[] calldata emailPublicInputs,
        ProofVerificationParams calldata passportParams
    ) external {
        bytes32 passportId = _verifyPassport(passportParams);
        _mintInternal(emailProof, emailPublicInputs, passportId, true);
    }

    /// @dev Internal mint logic shared by both functions
    /// @param emailProof The email proof bytes
    /// @param emailPublicInputs The email public inputs
    /// @param passportId The passport ID (bytes32(0) if not verified)
    /// @param withPassport Whether passport verification was used
    function _mintInternal(
        bytes calldata emailProof,
        bytes32[] calldata emailPublicInputs,
        bytes32 passportId,
        bool withPassport
    ) internal {
        // 1. Verify email proof
        if (!EMAIL_VERIFIER.verify(emailProof, emailPublicInputs)) {
            revert InvalidEmailProof();
        }

        // 2. Verify DKIM pubkey hash is from allowed list (Luma domains only)
        bytes32 pubkeyHash = emailPublicInputs[PUBKEY_HASH_INDEX];
        if (!allowedPubkeyHashes[pubkeyHash]) {
            revert InvalidPubkeyHash();
        }

        // 3. Extract email nullifier and event name
        bytes32 emailNullifier = emailPublicInputs[NULLIFIER_INDEX];
        string memory eventName = _extractEventName(emailPublicInputs);
        uint256 tokenId = uint256(keccak256(bytes(eventName)));

        // 4. Check email nullifier not used
        if (emailNullifierUsed[emailNullifier]) {
            revert EmailNullifierAlreadyUsed();
        }

        // 5. Check user hasn't minted this event
        if (hasMinted[msg.sender][tokenId]) {
            revert AlreadyMintedThisEvent();
        }

        // 6. If passport verified, check passport not used for this event
        if (withPassport) {
            if (passportUsedForEvent[passportId][tokenId]) {
                revert PassportAlreadyUsedForEvent();
            }
            passportUsedForEvent[passportId][tokenId] = true;
        }

        // 7. Mark as used
        emailNullifierUsed[emailNullifier] = true;
        hasMinted[msg.sender][tokenId] = true;
        isPassportVerified[msg.sender][tokenId] = withPassport;

        // 8. Store event name if new
        if (bytes(tokenNames[tokenId]).length == 0) {
            tokenNames[tokenId] = eventName;
        }

        // 9. Mint
        _mint(msg.sender, tokenId, 1, "");

        emit Minted(msg.sender, tokenId, eventName, emailNullifier, passportId, withPassport);
    }

    /*//////////////////////////////////////////////////////////////
                              UPGRADING
    //////////////////////////////////////////////////////////////*/

    /// @notice Upgrade an email-only mint to passport-verified
    /// @dev Allows users to add passport verification after initial email-only mint
    /// @param tokenId The token ID to upgrade
    /// @param passportParams The ZKPassport verification parameters
    function upgradeToVerified(
        uint256 tokenId,
        ProofVerificationParams calldata passportParams
    ) external {
        // 1. Check user has minted this token
        if (!hasMinted[msg.sender][tokenId]) {
            revert NotMinted();
        }

        // 2. Check not already verified
        if (isPassportVerified[msg.sender][tokenId]) {
            revert AlreadyVerified();
        }

        // 3-5. Verify passport proof, scope, bound data, and 1:1 binding
        bytes32 passportId = _verifyPassport(passportParams);

        // 6. Check passport not already used for this event
        if (passportUsedForEvent[passportId][tokenId]) {
            revert PassportAlreadyUsedForEvent();
        }

        // 7. Update state
        passportUsedForEvent[passportId][tokenId] = true;
        isPassportVerified[msg.sender][tokenId] = true;

        emit Upgraded(msg.sender, tokenId, passportId);
    }

    /*//////////////////////////////////////////////////////////////
                         ADMIN: PUBKEY MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Add or remove a DKIM pubkey hash from the allowed list
    /// @dev Only owner can call. Used to add new Luma DKIM keys or revoke compromised ones.
    /// @param pubkeyHash The Poseidon hash of the DKIM public key
    /// @param allowed Whether to allow or disallow this pubkey hash
    function setAllowedPubkeyHash(bytes32 pubkeyHash, bool allowed) external onlyOwner {
        allowedPubkeyHashes[pubkeyHash] = allowed;
        emit PubkeyHashUpdated(pubkeyHash, allowed);
    }

    /// @notice Batch add or remove DKIM pubkey hashes
    /// @dev Only owner can call. Useful for adding multiple keys at once.
    /// @param pubkeyHashes Array of pubkey hashes to update
    /// @param allowed Array of allowed states (must match length of pubkeyHashes)
    function setAllowedPubkeyHashBatch(
        bytes32[] calldata pubkeyHashes,
        bool[] calldata allowed
    ) external onlyOwner {
        require(pubkeyHashes.length == allowed.length, "Length mismatch");
        for (uint256 i = 0; i < pubkeyHashes.length; i++) {
            allowedPubkeyHashes[pubkeyHashes[i]] = allowed[i];
            emit PubkeyHashUpdated(pubkeyHashes[i], allowed[i]);
        }
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL HELPERS
    //////////////////////////////////////////////////////////////*/

    /// @dev Verifies passport proof, scope, bound data, and enforces 1:1 wallet-passport binding
    /// @param passportParams The ZKPassport verification parameters
    /// @return passportId The unique passport identifier (stable across all events)
    function _verifyPassport(
        ProofVerificationParams calldata passportParams
    ) internal returns (bytes32) {
        // Verify passport proof
        (bool verified, bytes32 passportId, IZKPassportHelper helper) =
            PASSPORT_VERIFIER.verify(passportParams);

        if (!verified) {
            revert InvalidPassportProof();
        }

        // Verify scope - accept both production domain and localhost in devMode
        string memory expectedDomain = DOMAIN;
        if (passportParams.serviceConfig.devMode) {
            bool isValidDomain = (
                keccak256(bytes(passportParams.serviceConfig.domain)) == keccak256(bytes(DOMAIN)) ||
                keccak256(bytes(passportParams.serviceConfig.domain)) == keccak256(bytes("localhost"))
            );
            if (isValidDomain) {
                expectedDomain = passportParams.serviceConfig.domain;
            }
        }

        // Use fixed scope for stable passportId (enables 1:1 wallet-passport binding)
        if (!helper.verifyScopes(
            passportParams.proofVerificationData.publicInputs,
            expectedDomain,
            SCOPE
        )) {
            revert InvalidPassportScope();
        }

        // Verify bound data
        BoundData memory boundData = helper.getBoundData(passportParams.committedInputs);

        if (boundData.senderAddress != msg.sender) {
            revert InvalidBoundAddress();
        }

        if (boundData.chainId != block.chainid) {
            revert InvalidBoundChain();
        }

        // Enforce 1:1 wallet-passport binding
        // Check wallet → passport binding (1 wallet → 1 passport)
        if (walletPassport[msg.sender] == bytes32(0)) {
            walletPassport[msg.sender] = passportId;
        } else if (walletPassport[msg.sender] != passportId) {
            revert WalletBoundToDifferentPassport();
        }

        // Check passport → wallet binding (1 passport → 1 wallet)
        if (passportWallet[passportId] == address(0)) {
            passportWallet[passportId] = msg.sender;
        } else if (passportWallet[passportId] != msg.sender) {
            revert PassportBoundToDifferentWallet();
        }

        return passportId;
    }

    /// @dev Extracts the event name from email proof public inputs
    /// @param publicInputs The public inputs array from the email proof
    /// @return The extracted event name as a string
    function _extractEventName(bytes32[] calldata publicInputs) internal pure returns (string memory) {
        uint256 len = uint256(publicInputs[EVENT_NAME_LEN_INDEX]);
        if (len > 256) {
            revert EventNameTooLong();
        }

        bytes memory eventName = new bytes(len);
        for (uint256 i = 0; i < len; i++) {
            eventName[i] = bytes1(uint8(uint256(publicInputs[EVENT_NAME_START + i])));
        }

        return string(eventName);
    }

    /*//////////////////////////////////////////////////////////////
                        SVG GENERATION - GRADIENT FLUX
    //////////////////////////////////////////////////////////////*/

    /// @dev Returns monocolor palette based on seed (3-char hex optimized)
    function _getPalette(uint256 seed) internal pure returns (
        string memory light,
        string memory dark,
        string memory accent
    ) {
        uint256 idx = seed % 10;
        if (idx == 0) return ("#cef", "#013", "#8bf");     // Ice
        if (idx == 1) return ("#cff", "#022", "#8ff");     // Glacier
        if (idx == 2) return ("#ecf", "#102", "#b8f");     // Amethyst
        if (idx == 3) return ("#fce", "#201", "#f8b");     // Rose
        if (idx == 4) return ("#fec", "#210", "#fb8");     // Amber
        if (idx == 5) return ("#cfe", "#021", "#8fb");     // Emerald
        if (idx == 6) return ("#fcc", "#200", "#f88");     // Coral
        if (idx == 7) return ("#cdf", "#012", "#89f");     // Sapphire
        if (idx == 8) return ("#eee", "#111", "#999");     // Noir
        return         ("#fed", "#110", "#db9");           // Sand
    }

    /// @dev Converts signed integer to string
    function _itoa(int256 v) internal pure returns (string memory) {
        if (v >= 0) return uint256(v).toString();
        return string(abi.encodePacked("-", uint256(-v).toString()));
    }

    /// @dev Simple sine approximation using quadratic (-100 to 100 scaled)
    /// @param t Position 0-100 (maps to 0-2π)
    function _sin100(uint256 t) internal pure returns (int256) {
        // Normalize to 0-100 range
        t = t % 100;
        // Map to quadratic approximation: peak at 25, trough at 75
        if (t <= 50) {
            // Rising then falling: 0->100->0
            int256 x = int256(t) - 25;
            return 100 - (x * x * 4) / 25;
        } else {
            // Falling then rising: 0->-100->0
            int256 x = int256(t) - 75;
            return -100 + (x * x * 4) / 25;
        }
    }

    /// @dev Generates SVG defs (gradient + scrim)
    function _svgDefs(string memory light, string memory dark, bytes1 h) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<defs><linearGradient id="f', h, '"><stop stop-color="', light,
            '" stop-opacity="0"/><stop offset=".5" stop-color="', light,
            '"/><stop offset="1" stop-color="', light, '" stop-opacity="0"/></linearGradient>',
            '<linearGradient id="s" y2="1"><stop stop-color="', dark,
            '" stop-opacity="0"/><stop offset="1" stop-color="', dark, '" stop-opacity=".9"/></linearGradient></defs>'
        ));
    }

    /// @dev Generates 5 flux strips (ultra-minimal)
    function _svgFlux(uint256 seed, bytes1 h) internal pure returns (string memory) {
        uint256 freq = (seed % 3) + 1;
        uint256 phase = (seed >> 8) % 100;
        int256 amp = int256(60 + (seed >> 16) % 80);

        return string(abi.encodePacked(
            '<rect x="', _itoa(-200 + (_sin100((0 * freq * 20 + phase) % 100) * amp) / 100), '" y="0" width="800" height="80" fill="url(#f', h, ')"/>',
            '<rect x="', _itoa(-200 + (_sin100((1 * freq * 20 + phase) % 100) * amp) / 100), '" y="80" width="800" height="80" fill="url(#f', h, ')"/>',
            '<rect x="', _itoa(-200 + (_sin100((2 * freq * 20 + phase) % 100) * amp) / 100), '" y="160" width="800" height="80" fill="url(#f', h, ')"/>',
            '<rect x="', _itoa(-200 + (_sin100((3 * freq * 20 + phase) % 100) * amp) / 100), '" y="240" width="800" height="80" fill="url(#f', h, ')"/>',
            '<rect x="', _itoa(-200 + (_sin100((4 * freq * 20 + phase) % 100) * amp) / 100), '" y="320" width="800" height="80" fill="url(#f', h, ')"/>'
        ));
    }

    /// @dev Generates verified frame (Piano Black style)
    function _svgFrame(string memory accent) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<rect x="12" y="12" width="376" height="376" fill="none" stroke="#050505" stroke-width="24"/>',
            '<rect x="24" y="24" width="352" height="352" fill="none" stroke="', accent, '" stroke-width="1.5" opacity=".8"/>'
        ));
    }

    /// @dev Generates text overlays
    function _svgText(
        string memory eventName,
        uint256 tokenId,
        string memory light,
        string memory accent,
        bool v
    ) internal pure returns (string memory) {
        string memory r = v ? "366" : "370";
        string memory t = v ? "39" : "35";
        string memory b = v ? "366" : "370";
        string memory l = v ? "34" : "30";

        return string(abi.encodePacked(
            '<text x="', r, '" y="', t, '" text-anchor="end" fill="', light,
            '" font-size="8" opacity=".7">MINTMARKS</text>',
            '<text x="', l, '" y="', b, '" fill="#fff" font-size="16" font-weight="600">', eventName, '</text>',
            '<text x="', r, '" y="', b, '" text-anchor="end" fill="', accent,
            '" font-size="12">#', tokenId.toString(), '</text>'
        ));
    }

    /// @dev Generates an SVG image with Gradient Flux style
    /// @param eventName The event name to display
    /// @param verified Whether passport verified
    /// @param tokenId The token ID for visual seed
    function _generateSVG(string memory eventName, bool verified, uint256 tokenId) internal pure returns (string memory) {
        uint256 seed = uint256(keccak256(abi.encodePacked(eventName)));
        (string memory light, string memory dark, string memory accent) = _getPalette(seed);
        bytes1 h = bytes("0123456789abcdef")[seed % 16];

        return string(abi.encodePacked(
            '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">',
            _svgDefs(light, dark, h),
            '<rect width="400" height="400" fill="', dark, '"/>',
            _svgFlux(seed, h),
            verified ? _svgFrame(accent) : "",
            '<rect y="300" width="400" height="100" fill="url(#s)"/>',
            _svgText(eventName, tokenId, light, accent, verified),
            '</svg>'
        ));
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Check if a user has passport verification for an event
    /// @param user The user address
    /// @param tokenId The token ID (event)
    /// @return True if passport verified, false otherwise
    function getVerificationStatus(address user, uint256 tokenId) external view returns (bool) {
        return isPassportVerified[user][tokenId];
    }

    /// @notice Batch check verification status for multiple users/events
    /// @param users Array of user addresses
    /// @param tokenIds Array of token IDs
    /// @return Array of verification statuses
    function getVerificationStatusBatch(
        address[] calldata users,
        uint256[] calldata tokenIds
    ) external view returns (bool[] memory) {
        require(users.length == tokenIds.length, "Length mismatch");
        bool[] memory statuses = new bool[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            statuses[i] = isPassportVerified[users[i]][tokenIds[i]];
        }
        return statuses;
    }

    /// @notice Returns the metadata URI for a token (generic, not user-specific)
    /// @dev Returns base64-encoded JSON with on-chain SVG image
    ///      Note: ERC1155 uri() is per tokenId, not per user.
    ///      Use userTokenURI() or getVerificationStatus() for user-specific data.
    /// @param tokenId The token ID to query
    /// @return The data URI containing the token metadata
    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory eventName = tokenNames[tokenId];
        if (bytes(eventName).length == 0) {
            return "";
        }

        // Generate SVG with generic "Verified" since uri is per-token, not per-user
        string memory svg = _generateSVG(eventName, true, tokenId);
        string memory imageURI = string(
            abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svg)))
        );

        string memory json = string(
            abi.encodePacked(
                '{"name":"',
                eventName,
                '","description":"Soulbound proof of attendance for ',
                eventName,
                '. Query userTokenURI(user, tokenId) for user-specific metadata.","image":"',
                imageURI,
                '","attributes":[{"trait_type":"Soulbound","value":"Yes"},{"trait_type":"Event","value":"',
                eventName,
                '"}]}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    /// @notice Returns user-specific metadata URI with correct verification status
    /// @dev Returns base64-encoded JSON with SVG reflecting user's verification level
    /// @param user The user address to query
    /// @param tokenId The token ID to query
    /// @return The data URI containing user-specific token metadata
    function userTokenURI(address user, uint256 tokenId) public view returns (string memory) {
        string memory eventName = tokenNames[tokenId];
        if (bytes(eventName).length == 0) {
            return "";
        }

        // Check if user has this token
        if (!hasMinted[user][tokenId]) {
            return "";
        }

        bool verified = isPassportVerified[user][tokenId];
        string memory svg = _generateSVG(eventName, verified, tokenId);
        string memory imageURI = string(
            abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svg)))
        );

        string memory verificationValue = verified ? "Passport Verified" : "Email Only";

        string memory json = string(
            abi.encodePacked(
                '{"name":"',
                eventName,
                '","description":"Soulbound proof of attendance for ',
                eventName,
                '.","image":"',
                imageURI,
                '","attributes":[{"trait_type":"Soulbound","value":"Yes"},{"trait_type":"Event","value":"',
                eventName,
                '"},{"trait_type":"Verification","value":"',
                verificationValue,
                '"}]}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    /// @notice Computes the token ID for a given event name
    /// @param eventName The event name
    /// @return The token ID (keccak256 hash of the event name)
    function getTokenId(string calldata eventName) external pure returns (uint256) {
        return uint256(keccak256(bytes(eventName)));
    }

    /// @notice Returns the collection-level metadata URI
    /// @return The data URI containing collection metadata
    function contractURI() public pure returns (string memory) {
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        '{"name":"Mintmarks","description":"Soulbound proof of event attendance. Supports email-only and passport-verified minting modes."}'
                    )
                )
            )
        );
    }
}
