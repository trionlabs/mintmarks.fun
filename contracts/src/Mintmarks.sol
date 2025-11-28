// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {
    IZKPassportVerifier,
    IZKPassportHelper,
    ProofVerificationParams,
    BoundData
} from "./interfaces/IZKPassportVerifier.sol";

/// @notice Interface for the DKIM email proof verifier (UltraHonk circuit)
interface IEmailVerifier {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool);
}

/// @title Mintmarks
/// @author Mintmarks Team
/// @notice Soulbound ERC1155 tokens proving event attendance via dual ZK verification
/// @dev Requires both DKIM email proof (via Noir/UltraHonk) and ZKPassport proof for minting.
///      Tokens are non-transferable (soulbound) - only minting is allowed.
///      Each email nullifier and passport ID can only be used once to prevent double-claiming.
contract Mintmarks is ERC1155 {
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
    uint256 private constant NULLIFIER_INDEX = 1;
    uint256 private constant EVENT_NAME_START = 67;
    uint256 private constant EVENT_NAME_LEN_INDEX = 323;

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice The domain that passport proofs must be scoped to
    string public constant DOMAIN = "mintmarks.fun";

    /// @notice The scope identifier for passport proofs
    string public constant SCOPE = "mintmarks-personhood";

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The DKIM email proof verifier contract
    IEmailVerifier public immutable EMAIL_VERIFIER;

    /// @notice The ZKPassport verifier contract
    IZKPassportVerifier public immutable PASSPORT_VERIFIER;

    /// @notice Tracks which email nullifiers have been used (prevents double-claiming same email)
    mapping(bytes32 => bool) public emailNullifierUsed;

    /// @notice Tracks which passport IDs have been used (prevents double-claiming same passport)
    mapping(bytes32 => bool) public passportIdUsed;

    /// @notice Maps token IDs to their event names
    mapping(uint256 => string) public tokenNames;

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @dev Thrown when the DKIM email proof verification fails
    error InvalidEmailProof();

    /// @dev Thrown when the ZKPassport proof verification fails
    error InvalidPassportProof();

    /// @dev Thrown when the passport proof domain/scope doesn't match expected values
    error InvalidPassportScope();

    /// @dev Thrown when the bound sender address doesn't match msg.sender
    error InvalidBoundAddress();

    /// @dev Thrown when the bound chain ID doesn't match current chain
    error InvalidBoundChain();

    /// @dev Thrown when the email nullifier bound to passport doesn't match the email proof
    error InvalidBoundEmailNullifier();

    /// @dev Thrown when attempting to use an email nullifier that's already been claimed
    error EmailNullifierAlreadyUsed();

    /// @dev Thrown when attempting to use a passport ID that's already been claimed
    error PassportIdAlreadyUsed();

    /// @dev Thrown when the extracted event name exceeds 256 bytes
    error EventNameTooLong();

    /// @dev Thrown when attempting to transfer or burn a soulbound token
    error NonTransferable();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new Mintmark is minted
    /// @param to The address receiving the token
    /// @param tokenId The token ID (hash of event name)
    /// @param eventName The name of the event
    /// @param emailNullifier The nullifier from the email proof
    /// @param passportId The unique identifier from the passport proof
    event Minted(
        address indexed to,
        uint256 indexed tokenId,
        string eventName,
        bytes32 emailNullifier,
        bytes32 passportId
    );

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Creates a new Mintmarks contract
    /// @param _emailVerifier Address of the DKIM email proof verifier (UltraHonk)
    /// @param _passportVerifier Address of the ZKPassport verifier
    constructor(address _emailVerifier, address _passportVerifier) ERC1155("") {
        EMAIL_VERIFIER = IEmailVerifier(_emailVerifier);
        PASSPORT_VERIFIER = IZKPassportVerifier(_passportVerifier);
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

    /// @notice Mint a soulbound Mintmark by providing both email and passport proofs
    /// @dev Verification flow:
    ///      1. Verify DKIM email proof
    ///      2. Check email nullifier hasn't been used
    ///      3. Verify ZKPassport proof (proof of personhood)
    ///      4. Verify passport domain/scope
    ///      5. Verify bound data (sender, chain, email nullifier)
    ///      6. Check passport ID hasn't been used
    ///      7. Mint token
    /// @param emailProof The UltraHonk proof bytes from the Noir circuit
    /// @param emailPublicInputs The public inputs array from the email proof
    /// @param passportParams The ZKPassport verification parameters
    function mint(
        bytes calldata emailProof,
        bytes32[] calldata emailPublicInputs,
        ProofVerificationParams calldata passportParams
    ) external {
        // 1. Verify email proof
        if (!EMAIL_VERIFIER.verify(emailProof, emailPublicInputs)) {
            revert InvalidEmailProof();
        }

        // 2. Extract email nullifier
        bytes32 emailNullifier = emailPublicInputs[NULLIFIER_INDEX];

        // 3. Check email nullifier not used
        if (emailNullifierUsed[emailNullifier]) {
            revert EmailNullifierAlreadyUsed();
        }

        // 4. Verify passport proof
        (bool verified, bytes32 passportId, IZKPassportHelper helper) =
            PASSPORT_VERIFIER.verify(passportParams);

        if (!verified) {
            revert InvalidPassportProof();
        }

        // 5. Verify passport was generated for our domain/scope
        // In devMode, also accept "localhost" for local testing
        // This is safe because devMode proofs are only valid on testnet ZKPassport verifiers
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

        if (!helper.verifyScopes(
            passportParams.proofVerificationData.publicInputs,
            expectedDomain,
            SCOPE
        )) {
            revert InvalidPassportScope();
        }

        // 6. Verify bound data
        BoundData memory boundData = helper.getBoundData(passportParams.committedInputs);

        if (boundData.senderAddress != msg.sender) {
            revert InvalidBoundAddress();
        }

        if (boundData.chainId != block.chainid) {
            revert InvalidBoundChain();
        }

        // Check email nullifier is bound to passport proof
        if (keccak256(bytes(boundData.customData)) != keccak256(bytes(_bytes32ToHexString(emailNullifier)))) {
            revert InvalidBoundEmailNullifier();
        }

        // 7. Check passport ID not used
        if (passportIdUsed[passportId]) {
            revert PassportIdAlreadyUsed();
        }

        // 8. Mark both nullifiers as used
        emailNullifierUsed[emailNullifier] = true;
        passportIdUsed[passportId] = true;

        // 9. Extract event name and mint
        string memory eventName = _extractEventName(emailPublicInputs);
        uint256 tokenId = uint256(keccak256(bytes(eventName)));

        if (bytes(tokenNames[tokenId]).length == 0) {
            tokenNames[tokenId] = eventName;
        }

        _mint(msg.sender, tokenId, 1, "");

        emit Minted(msg.sender, tokenId, eventName, emailNullifier, passportId);
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL HELPERS
    //////////////////////////////////////////////////////////////*/

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

    /// @dev Converts a bytes32 value to a hex string with "0x" prefix
    /// @param data The bytes32 value to convert
    /// @return The hex string representation
    function _bytes32ToHexString(bytes32 data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(66); // 0x + 64 hex chars
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 32; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }

    /// @dev Generates an SVG image for a token
    /// @param eventName The event name to display in the SVG
    /// @return The SVG markup as a string
    function _generateSVG(string memory eventName) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
                '<defs>',
                '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" style="stop-color:#1a1a2e"/>',
                '<stop offset="100%" style="stop-color:#16213e"/>',
                '</linearGradient>',
                '</defs>',
                '<rect width="400" height="400" fill="url(#bg)"/>',
                '<rect x="20" y="20" width="360" height="360" rx="20" fill="none" stroke="#e94560" stroke-width="2"/>',
                '<text x="200" y="80" text-anchor="middle" fill="#e94560" font-family="Arial,sans-serif" font-size="24" font-weight="bold">MINTMARKS</text>',
                '<line x1="60" y1="100" x2="340" y2="100" stroke="#e94560" stroke-width="1" opacity="0.5"/>',
                '<text x="200" y="200" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="20">',
                eventName,
                '</text>',
                '<text x="200" y="330" text-anchor="middle" fill="#888888" font-family="Arial,sans-serif" font-size="12">Verified Attendance + Passport</text>',
                '<text x="200" y="355" text-anchor="middle" fill="#e94560" font-family="Arial,sans-serif" font-size="10" font-weight="bold">SOULBOUND</text>',
                '</svg>'
            )
        );
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Returns the metadata URI for a token
    /// @dev Returns base64-encoded JSON with on-chain SVG image
    /// @param tokenId The token ID to query
    /// @return The data URI containing the token metadata
    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory eventName = tokenNames[tokenId];
        if (bytes(eventName).length == 0) {
            return "";
        }

        string memory svg = _generateSVG(eventName);
        string memory imageURI = string(
            abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svg)))
        );

        string memory json = string(
            abi.encodePacked(
                '{"name":"',
                eventName,
                '","description":"Soulbound proof of attendance for ',
                eventName,
                ' - verified with passport (non-transferable)","image":"',
                imageURI,
                '","attributes":[{"trait_type":"Soulbound","value":"Yes"}]}'
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
                        '{"name":"Mintmarks","description":"Soulbound proof of event attendance via DKIM email + passport verification (non-transferable)"}'
                    )
                )
            )
        );
    }
}
