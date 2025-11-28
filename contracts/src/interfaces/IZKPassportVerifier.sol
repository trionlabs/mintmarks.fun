// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

struct BoundData {
    address senderAddress;
    uint256 chainId;
    string customData;
}

struct ProofVerificationData {
    bytes32 vkeyHash;
    bytes proof;
    bytes32[] publicInputs;
}

struct ServiceConfig {
    uint256 validityPeriodInSeconds;
    string domain;
    string scope;
    bool devMode;
}

struct ProofVerificationParams {
    bytes32 version;
    ProofVerificationData proofVerificationData;
    bytes committedInputs;
    ServiceConfig serviceConfig;
}

interface IZKPassportVerifier {
    function verify(ProofVerificationParams calldata params)
        external
        returns (bool verified, bytes32 uniqueIdentifier, IZKPassportHelper helper);
}

interface IZKPassportHelper {
    function getBoundData(bytes calldata committedInputs)
        external view returns (BoundData memory);

    function verifyScopes(
        bytes32[] calldata publicInputs,
        string calldata domain,
        string calldata scope
    ) external view returns (bool);

    function isAgeAboveOrEqual(uint8 minAge, bytes calldata committedInputs)
        external view returns (bool);
}
