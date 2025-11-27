// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

interface IVerifier {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool);
}

contract Mintmarks is ERC1155 {
    // Public inputs structure (from Noir circuit):
    // [0]: pubkey_hash
    // [1]: email_nullifier
    // [2-65]: date.storage (64 bytes)
    // [66]: date.len
    // [67-322]: event_name.storage (256 bytes)
    // [323]: event_name.len

    uint256 private constant NULLIFIER_INDEX = 1;
    uint256 private constant EVENT_NAME_START = 67;
    uint256 private constant EVENT_NAME_LEN_INDEX = 323;

    IVerifier public immutable verifier;

    mapping(bytes32 => bool) public nullifierUsed;
    mapping(uint256 => string) public tokenNames;

    error InvalidProof();
    error NullifierAlreadyUsed();
    error EventNameTooLong();

    event Minted(address indexed to, uint256 indexed tokenId, string eventName, bytes32 nullifier);

    constructor(address _verifier) ERC1155("") {
        verifier = IVerifier(_verifier);
    }

    function name() public pure returns (string memory) {
        return "Mintmarks";
    }

    function symbol() public pure returns (string memory) {
        return "MARK";
    }

    function contractURI() public pure returns (string memory) {
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        '{"name":"Mintmarks","description":"Proof of event attendance via DKIM email verification"}'
                    )
                )
            )
        );
    }

    function mint(bytes calldata proof, bytes32[] calldata publicInputs) external {
        // 1. Verify proof
        if (!verifier.verify(proof, publicInputs)) {
            revert InvalidProof();
        }

        // 2. Extract and check nullifier
        bytes32 nullifier = publicInputs[NULLIFIER_INDEX];
        if (nullifierUsed[nullifier]) {
            revert NullifierAlreadyUsed();
        }
        nullifierUsed[nullifier] = true;

        // 3. Extract event name
        string memory eventName = _extractEventName(publicInputs);

        // 4. Compute tokenId from event name
        uint256 tokenId = uint256(keccak256(bytes(eventName)));

        // 5. Store event name if new token
        if (bytes(tokenNames[tokenId]).length == 0) {
            tokenNames[tokenId] = eventName;
        }

        // 6. Mint
        _mint(msg.sender, tokenId, 1, "");

        emit Minted(msg.sender, tokenId, eventName, nullifier);
    }

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
                '","description":"Proof of attendance for ',
                eventName,
                '","image":"',
                imageURI,
                '"}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

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
                '<text x="200" y="350" text-anchor="middle" fill="#888888" font-family="Arial,sans-serif" font-size="12">Verified Attendance</text>',
                '</svg>'
            )
        );
    }

    function getTokenId(string calldata eventName) external pure returns (uint256) {
        return uint256(keccak256(bytes(eventName)));
    }
}
