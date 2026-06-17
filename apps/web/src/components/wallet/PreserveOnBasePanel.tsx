import { useState } from "react";
import type { PreserveConfirmResponse, WineCraftResponse } from "../../lib/api";
import {
  confirmPreserve,
  createClientIdempotencyKey,
  linkWallet,
  preparePreserve
} from "../../lib/api";
import {
  isSupportedBaseChainId,
  normalizeWalletAddress,
  parseWalletChainId
} from "../../lib/web3/base";
import {
  sendPreserveVintageTransaction,
  type EthereumProvider
} from "../../lib/web3/chateauCellar";

type PreserveOnBasePanelProps = {
  userId: string;
  result: WineCraftResponse;
  onPreserveSubmitted?: (confirmation: PreserveConfirmResponse) => void;
};

type PreserveState =
  | {
      status: "idle" | "busy";
      message: string | null;
      error: null;
    }
  | {
      status: "error";
      message: null;
      error: string;
    }
  | {
      status: "submitted";
      message: string;
      error: null;
    };

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Preserve failed";
}

export function PreserveOnBasePanel({
  userId,
  result,
  onPreserveSubmitted
}: PreserveOnBasePanelProps) {
  const [state, setState] = useState<PreserveState>({
    status: "idle",
    message: null,
    error: null
  });

  if (!result.onchainEligible) {
    return null;
  }

  const handlePreserve = async () => {
    const provider = window.ethereum;
    if (!provider) {
      setState({
        status: "error",
        message: null,
        error: "Base wallet not found"
      });
      return;
    }

    setState({
      status: "busy",
      message: "Connecting wallet",
      error: null
    });

    try {
      const accounts = await provider.request<string[]>({
        method: "eth_requestAccounts"
      });
      const walletAddress = normalizeWalletAddress(accounts[0] ?? "");
      const walletChainId = parseWalletChainId(
        await provider.request<string>({ method: "eth_chainId" })
      );

      if (!isSupportedBaseChainId(walletChainId)) {
        throw new Error("Switch wallet to Base or Base Sepolia");
      }

      await linkWallet({
        userId,
        walletAddress,
        chainId: walletChainId,
        idempotencyKey: createClientIdempotencyKey()
      });

      setState({
        status: "busy",
        message: "Preparing preserve payload",
        error: null
      });
      const payload = await preparePreserve({
        userId,
        batchId: result.id,
        chainId: walletChainId
      });

      setState({
        status: "busy",
        message: "Waiting for wallet transaction",
        error: null
      });
      const txHash = await sendPreserveVintageTransaction({
        provider,
        from: walletAddress,
        payload
      });

      const confirmation = await confirmPreserve({
        userId,
        batchId: result.id,
        chainId: walletChainId,
        txHash,
        idempotencyKey: createClientIdempotencyKey()
      });

      setState({
        status: "submitted",
        message: "Preserve submitted. Pending confirmation.",
        error: null
      });
      onPreserveSubmitted?.(confirmation);
    } catch (error) {
      setState({
        status: "error",
        message: null,
        error: getErrorMessage(error)
      });
    }
  };

  return (
    <section className="mini-panel preserve-panel">
      <div className="panel-heading">
        <div>
          <p className="section-label">Base Preserve</p>
          <p className="prompt-text">Optional proof for meaningful vintages.</p>
          <p className="muted">
            Submitted transactions stay pending until a future receipt check confirms them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handlePreserve()}
          disabled={state.status === "busy" || state.status === "submitted"}
        >
          {state.status === "busy"
            ? "Preserving"
            : state.status === "submitted"
              ? "Pending"
              : "Preserve on Base"}
        </button>
      </div>
      {state.message ? <p className="state-banner form-success">{state.message}</p> : null}
      {state.error ? <p className="state-banner form-error">{state.error}</p> : null}
    </section>
  );
}
