export const chateauCellarAbi = [
  {
    type: "error",
    name: "DuplicateVintagePreserve",
    inputs: [
      { name: "player", type: "address", internalType: "address" },
      { name: "batchHash", type: "bytes32", internalType: "bytes32" }
    ]
  },
  {
    type: "error",
    name: "EmptyMetadataUri",
    inputs: []
  },
  {
    type: "error",
    name: "VintageNotPreserved",
    inputs: [
      { name: "player", type: "address", internalType: "address" },
      { name: "batchHash", type: "bytes32", internalType: "bytes32" }
    ]
  },
  {
    type: "error",
    name: "ZeroBatchHash",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroChallengeId",
    inputs: []
  },
  {
    type: "event",
    name: "BasedWinemakerClaimed",
    anonymous: false,
    inputs: [
      { name: "player", type: "address", indexed: true, internalType: "address" },
      { name: "batchHash", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "metadataUri", type: "string", indexed: false, internalType: "string" },
      { name: "seasonKey", type: "string", indexed: false, internalType: "string" },
      { name: "timestamp", type: "uint64", indexed: false, internalType: "uint64" }
    ]
  },
  {
    type: "event",
    name: "ChallengeResultRecorded",
    anonymous: false,
    inputs: [
      { name: "player", type: "address", indexed: true, internalType: "address" },
      { name: "challengeId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "batchHash", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "metadataUri", type: "string", indexed: false, internalType: "string" },
      { name: "qualityLevel", type: "uint8", indexed: false, internalType: "uint8" },
      { name: "primaryMoment", type: "string", indexed: false, internalType: "string" },
      { name: "seasonKey", type: "string", indexed: false, internalType: "string" },
      { name: "score", type: "uint16", indexed: false, internalType: "uint16" },
      { name: "timestamp", type: "uint64", indexed: false, internalType: "uint64" }
    ]
  },
  {
    type: "event",
    name: "VintagePreserved",
    anonymous: false,
    inputs: [
      { name: "player", type: "address", indexed: true, internalType: "address" },
      { name: "batchHash", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "metadataUri", type: "string", indexed: false, internalType: "string" },
      { name: "qualityLevel", type: "uint8", indexed: false, internalType: "uint8" },
      { name: "primaryMoment", type: "string", indexed: false, internalType: "string" },
      { name: "seasonKey", type: "string", indexed: false, internalType: "string" },
      { name: "score", type: "uint16", indexed: false, internalType: "uint16" },
      { name: "timestamp", type: "uint64", indexed: false, internalType: "uint64" }
    ]
  },
  {
    type: "function",
    name: "claimBasedWinemakerStatus",
    stateMutability: "nonpayable",
    inputs: [
      { name: "batchHash", type: "bytes32", internalType: "bytes32" },
      { name: "metadataUri", type: "string", internalType: "string" },
      { name: "seasonKey", type: "string", internalType: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "isVintagePreserved",
    stateMutability: "view",
    inputs: [
      { name: "player", type: "address", internalType: "address" },
      { name: "batchHash", type: "bytes32", internalType: "bytes32" }
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }]
  },
  {
    type: "function",
    name: "preserveVintage",
    stateMutability: "nonpayable",
    inputs: [
      { name: "batchHash", type: "bytes32", internalType: "bytes32" },
      { name: "metadataUri", type: "string", internalType: "string" },
      { name: "qualityLevel", type: "uint8", internalType: "uint8" },
      { name: "primaryMoment", type: "string", internalType: "string" },
      { name: "seasonKey", type: "string", internalType: "string" },
      { name: "score", type: "uint16", internalType: "uint16" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "recordChallengeResult",
    stateMutability: "nonpayable",
    inputs: [
      { name: "challengeId", type: "bytes32", internalType: "bytes32" },
      { name: "batchHash", type: "bytes32", internalType: "bytes32" },
      { name: "metadataUri", type: "string", internalType: "string" },
      { name: "qualityLevel", type: "uint8", internalType: "uint8" },
      { name: "primaryMoment", type: "string", internalType: "string" },
      { name: "seasonKey", type: "string", internalType: "string" },
      { name: "score", type: "uint16", internalType: "uint16" }
    ],
    outputs: []
  }
] as const;
