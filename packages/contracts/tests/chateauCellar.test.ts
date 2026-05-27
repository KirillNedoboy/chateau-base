import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BrowserProvider, ContractFactory, Interface, id } from "ethers";
import type {
  ContractTransactionResponse,
  Eip1193Provider,
  InterfaceAbi,
  TransactionReceipt
} from "ethers";
import ganache from "ganache";
import solc from "solc";
import { describe, expect, it } from "vitest";
import { chateauCellarAbi } from "../src/abi/chateauCellarAbi.js";

type SolcError = {
  severity: string;
  formattedMessage: string;
};

type SolcContractArtifact = {
  abi: InterfaceAbi;
  evm: {
    bytecode: {
      object: string;
    };
  };
};

type SolcOutput = {
  contracts?: Record<string, Record<string, SolcContractArtifact>>;
  errors?: SolcError[];
};

type ChateauCellarContract = {
  preserveVintage: (
    batchHash: string,
    metadataUri: string,
    qualityLevel: number,
    primaryMoment: string,
    seasonKey: string,
    score: number
  ) => Promise<ContractTransactionResponse>;
  recordChallengeResult: (
    challengeId: string,
    batchHash: string,
    metadataUri: string,
    qualityLevel: number,
    primaryMoment: string,
    seasonKey: string,
    score: number
  ) => Promise<ContractTransactionResponse>;
  claimBasedWinemakerStatus: (
    batchHash: string,
    metadataUri: string,
    seasonKey: string
  ) => Promise<ContractTransactionResponse>;
  isVintagePreserved: (player: string, batchHash: string) => Promise<boolean>;
  waitForDeployment: () => Promise<unknown>;
};

function compileChateauCellar(): SolcContractArtifact {
  const contractPath = resolve("contracts", "ChateauCellar.sol");
  const source = readFileSync(contractPath, "utf8");

  const compilerInput = {
    language: "Solidity",
    sources: {
      "ChateauCellar.sol": {
        content: source
      }
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"]
        }
      }
    }
  };

  const output = JSON.parse(
    solc.compile(JSON.stringify(compilerInput))
  ) as SolcOutput;

  const compileErrors =
    output.errors?.filter((error) => error.severity === "error") ?? [];
  if (compileErrors.length > 0) {
    throw new Error(compileErrors.map((error) => error.formattedMessage).join("\n"));
  }

  const artifact = output.contracts?.["ChateauCellar.sol"]?.["ChateauCellar"];
  if (!artifact) {
    throw new Error("ChateauCellar artifact was not produced by solc.");
  }

  if (!artifact.evm.bytecode.object) {
    throw new Error("ChateauCellar bytecode is empty.");
  }

  return artifact;
}

async function deployChateauCellar(): Promise<{
  contract: ChateauCellarContract;
  playerAddress: string;
}> {
  const artifact = compileChateauCellar();
  const provider = new BrowserProvider(
    ganache.provider({ logging: { quiet: true } }) as unknown as Eip1193Provider
  );
  const signer = await provider.getSigner();
  const playerAddress = await signer.getAddress();
  const factory = new ContractFactory(
    artifact.abi,
    `0x${artifact.evm.bytecode.object}`,
    signer
  );
  const contract = (await factory.deploy()) as unknown as ChateauCellarContract;
  await contract.waitForDeployment();
  return { contract, playerAddress };
}

function parseEvent(receipt: TransactionReceipt, eventName: string) {
  const parser = new Interface(chateauCellarAbi);
  for (const log of receipt.logs) {
    try {
      const parsed = parser.parseLog({
        data: log.data,
        topics: log.topics
      });
      if (parsed?.name === eventName) {
        return parsed;
      }
    } catch {
      continue;
    }
  }
  return null;
}

describe("ChateauCellar contract", () => {
  it("exposes required functions and events in exported ABI", () => {
    const eventNames = chateauCellarAbi
      .filter((entry) => entry.type === "event")
      .map((entry) => entry.name);
    const functionNames = chateauCellarAbi
      .filter((entry) => entry.type === "function")
      .map((entry) => entry.name);

    expect(eventNames).toEqual(
      expect.arrayContaining([
        "VintagePreserved",
        "ChallengeResultRecorded",
        "BasedWinemakerClaimed"
      ])
    );
    expect(functionNames).toEqual(
      expect.arrayContaining([
        "preserveVintage",
        "recordChallengeResult",
        "claimBasedWinemakerStatus"
      ])
    );
  });

  it("preserves vintage, emits event, and prevents duplicate preserve by player+batchHash", async () => {
    const { contract, playerAddress } = await deployChateauCellar();
    const batchHash = id("batch-001");
    const metadataUri = "ipfs://chateau/vintage/1";

    const firstTx = await contract.preserveVintage(
      batchHash,
      metadataUri,
      4,
      "almost_legendary",
      "genesis_harvest",
      91
    );
    const firstReceipt = await firstTx.wait();
    if (!firstReceipt) {
      throw new Error("Missing receipt for preserveVintage.");
    }

    const preservedEvent = parseEvent(firstReceipt, "VintagePreserved");
    expect(preservedEvent).not.toBeNull();
    expect(preservedEvent?.args.player.toLowerCase()).toBe(playerAddress.toLowerCase());
    expect(preservedEvent?.args.batchHash).toBe(batchHash);
    expect(preservedEvent?.args.metadataUri).toBe(metadataUri);
    expect(preservedEvent?.args.qualityLevel).toBe(4n);

    const isPreserved = await contract.isVintagePreserved(playerAddress, batchHash);
    expect(isPreserved).toBe(true);

    const duplicatePreserveTx = contract
      .preserveVintage(
        batchHash,
        metadataUri,
        4,
        "almost_legendary",
        "genesis_harvest",
        91
      )
      .then((tx) => tx.wait());
    await expect(duplicatePreserveTx).rejects.toThrow(
      /DuplicateVintagePreserve|revert/i
    );
  });

  it("records challenge result with challengeId and batch context", async () => {
    const { contract, playerAddress } = await deployChateauCellar();
    const challengeId = id("challenge-2026-05-27");
    const batchHash = id("batch-2026-05-27");

    const tx = await contract.recordChallengeResult(
      challengeId,
      batchHash,
      "ipfs://chateau/challenge/1",
      3,
      "corkfather",
      "genesis_harvest",
      78
    );
    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Missing receipt for recordChallengeResult.");
    }

    const eventRecord = parseEvent(receipt, "ChallengeResultRecorded");
    expect(eventRecord).not.toBeNull();
    expect(eventRecord?.args.player.toLowerCase()).toBe(playerAddress.toLowerCase());
    expect(eventRecord?.args.challengeId).toBe(challengeId);
    expect(eventRecord?.args.batchHash).toBe(batchHash);
    expect(eventRecord?.args.score).toBe(78n);
  });

  it("claims based winemaker status only for preserved vintage", async () => {
    const { contract, playerAddress } = await deployChateauCellar();
    const batchHash = id("batch-based-1");

    const preserveTx = await contract.preserveVintage(
      batchHash,
      "ipfs://chateau/vintage/based",
      4,
      "based_vintage",
      "genesis_harvest",
      88
    );
    await preserveTx.wait();
    const preserved = await contract.isVintagePreserved(playerAddress, batchHash);
    expect(preserved).toBe(true);

    const claimTx = await contract.claimBasedWinemakerStatus(
      batchHash,
      "ipfs://chateau/based/1",
      "genesis_harvest"
    );
    const claimReceipt = await claimTx.wait();
    if (!claimReceipt) {
      throw new Error("Missing receipt for claimBasedWinemakerStatus.");
    }

    const claimEvent = parseEvent(claimReceipt, "BasedWinemakerClaimed");
    expect(claimEvent).not.toBeNull();
    expect(claimEvent?.args.batchHash).toBe(batchHash);
  });

  it("does not include ERC-20, NFT mint, or marketplace-style code paths", () => {
    const source = readFileSync(resolve("contracts", "ChateauCellar.sol"), "utf8");
    const forbiddenPatterns = [
      /erc20/i,
      /token/i,
      /mint/i,
      /marketplace/i,
      /stake/i,
      /bet/i,
      /withdraw/i
    ];

    for (const pattern of forbiddenPatterns) {
      expect(source).not.toMatch(pattern);
    }
  });
});
