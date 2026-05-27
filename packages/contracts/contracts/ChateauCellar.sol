// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ChateauCellar {
    error DuplicateVintagePreserve(address player, bytes32 batchHash);
    error EmptyMetadataUri();
    error ZeroBatchHash();
    error ZeroChallengeId();
    error VintageNotPreserved(address player, bytes32 batchHash);

    event VintagePreserved(
        address indexed player,
        bytes32 indexed batchHash,
        string metadataUri,
        uint8 qualityLevel,
        string primaryMoment,
        string seasonKey,
        uint16 score,
        uint64 timestamp
    );

    event ChallengeResultRecorded(
        address indexed player,
        bytes32 indexed challengeId,
        bytes32 indexed batchHash,
        string metadataUri,
        uint8 qualityLevel,
        string primaryMoment,
        string seasonKey,
        uint16 score,
        uint64 timestamp
    );

    event BasedWinemakerClaimed(
        address indexed player,
        bytes32 indexed batchHash,
        string metadataUri,
        string seasonKey,
        uint64 timestamp
    );

    mapping(address player => mapping(bytes32 batchHash => bool preserved))
        private preservedVintageByPlayerBatch;

    function preserveVintage(
        bytes32 batchHash,
        string calldata metadataUri,
        uint8 qualityLevel,
        string calldata primaryMoment,
        string calldata seasonKey,
        uint16 score
    ) external {
        _validateBatchHash(batchHash);
        _validateMetadataUri(metadataUri);

        if (preservedVintageByPlayerBatch[msg.sender][batchHash]) {
            revert DuplicateVintagePreserve(msg.sender, batchHash);
        }

        preservedVintageByPlayerBatch[msg.sender][batchHash] = true;

        emit VintagePreserved(
            msg.sender,
            batchHash,
            metadataUri,
            qualityLevel,
            primaryMoment,
            seasonKey,
            score,
            uint64(block.timestamp)
        );
    }

    function recordChallengeResult(
        bytes32 challengeId,
        bytes32 batchHash,
        string calldata metadataUri,
        uint8 qualityLevel,
        string calldata primaryMoment,
        string calldata seasonKey,
        uint16 score
    ) external {
        if (challengeId == bytes32(0)) {
            revert ZeroChallengeId();
        }

        _validateBatchHash(batchHash);
        _validateMetadataUri(metadataUri);

        emit ChallengeResultRecorded(
            msg.sender,
            challengeId,
            batchHash,
            metadataUri,
            qualityLevel,
            primaryMoment,
            seasonKey,
            score,
            uint64(block.timestamp)
        );
    }

    function claimBasedWinemakerStatus(
        bytes32 batchHash,
        string calldata metadataUri,
        string calldata seasonKey
    ) external {
        _validateBatchHash(batchHash);
        _validateMetadataUri(metadataUri);

        if (!preservedVintageByPlayerBatch[msg.sender][batchHash]) {
            revert VintageNotPreserved(msg.sender, batchHash);
        }

        emit BasedWinemakerClaimed(
            msg.sender,
            batchHash,
            metadataUri,
            seasonKey,
            uint64(block.timestamp)
        );
    }

    function isVintagePreserved(
        address player,
        bytes32 batchHash
    ) external view returns (bool) {
        return preservedVintageByPlayerBatch[player][batchHash];
    }

    function _validateBatchHash(bytes32 batchHash) private pure {
        if (batchHash == bytes32(0)) {
            revert ZeroBatchHash();
        }
    }

    function _validateMetadataUri(string calldata metadataUri) private pure {
        if (bytes(metadataUri).length == 0) {
            revert EmptyMetadataUri();
        }
    }
}
