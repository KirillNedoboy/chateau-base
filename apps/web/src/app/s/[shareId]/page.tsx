import { notFound } from "next/navigation";
import { ShareCard } from "../../../features/share/ShareCard";
import { ApiError, getShare, openChallenge } from "../../../lib/api";

export const dynamic = "force-dynamic";

type SharePageProps = {
  params: Promise<{
    shareId: string;
  }>;
};

function getServerApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_CHATEAU_API_BASE_URL ?? "http://127.0.0.1:4000";
}

export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = await params;
  const apiBaseUrl = getServerApiBaseUrl();

  try {
    const share = await getShare(shareId, { apiBaseUrl });

    try {
      await openChallenge({ shareId }, { apiBaseUrl });
    } catch {
      // Share display should not be blocked by attribution write failure.
    }

    return (
      <main className="shell share-page">
        <ShareCard share={share} />
      </main>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <main className="shell">
        <section className="panel error-panel" role="alert">
          <p className="section-label">Share unavailable</p>
          <p>Could not load this Chateau Base share link.</p>
        </section>
      </main>
    );
  }
}
