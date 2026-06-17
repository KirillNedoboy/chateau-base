import { notFound } from "next/navigation";
import { formatKey } from "../../../features/game-ui/viewModels";
import { ApiError, getPublicChateauProfile } from "../../../lib/api";

export const dynamic = "force-dynamic";

type ChateauPageProps = {
  params: Promise<{
    wallet: string;
  }>;
};

function getServerApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_CHATEAU_API_BASE_URL ?? "http://127.0.0.1:4000";
}

export default async function ChateauProfilePage({ params }: ChateauPageProps) {
  const { wallet } = await params;
  const apiBaseUrl = getServerApiBaseUrl();

  try {
    const profile = await getPublicChateauProfile(wallet, { apiBaseUrl });

    return (
      <main className="shell">
        <section className="hero-band game-surface" aria-labelledby="profile-title">
          <div className="hero-copy-block">
            <p className="eyebrow">Chateau profile</p>
            <h1 id="profile-title" className="wallet-heading">
              {profile.shortWallet}
            </h1>
            <p className="hero-copy">
              {profile.basedWinemaker ? "Based Winemaker" : "Winemaker"}
            </p>
          </div>
          <div className="hero-status-grid">
            <article className="stat-card stat-card-gold">
              <span>Preserved</span>
              <strong>{profile.preservedVintagesCount}</strong>
              <small>Confirmed vintages</small>
            </article>
            <article className="stat-card stat-card-green">
              <span>Pending</span>
              <strong>{profile.pendingPreserveCount}</strong>
              <small>Awaiting confirmation</small>
            </article>
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="panel">
            <p className="section-label">Genesis Harvest</p>
            <dl className="summary-list">
              <div>
                <dt>Total</dt>
                <dd>{profile.genesisHarvest.totalBatches}</dd>
              </div>
              <div>
                <dt>Premium</dt>
                <dd>{profile.genesisHarvest.premium}</dd>
              </div>
              <div>
                <dt>Grand Cru</dt>
                <dd>{profile.genesisHarvest.grandCru}</dd>
              </div>
              <div>
                <dt>Legendary</dt>
                <dd>{profile.genesisHarvest.legendary}</dd>
              </div>
              <div>
                <dt>Almost Legendary</dt>
                <dd>{profile.genesisHarvest.almostLegendaryFumbles}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <p className="section-label">Best Wine</p>
            {profile.bestWine ? (
              <div className="season-block">
                <h2>{profile.bestWine.labelName}</h2>
                <p>
                  {formatKey(profile.bestWine.qualityLevel)} / {profile.bestWine.score}
                  /100
                </p>
              </div>
            ) : (
              <p className="muted">No public wine yet.</p>
            )}
          </section>

          <section className="panel">
            <p className="section-label">Worst Shame</p>
            {profile.worstShame ? (
              <div className="season-block">
                <h2>{profile.worstShame.moment ? formatKey(profile.worstShame.moment) : "No shame"}</h2>
                <p>{profile.worstShame.score}/100</p>
              </div>
            ) : (
              <p className="muted">No shame recorded.</p>
            )}
          </section>
        </div>

        <section className="panel">
          <p className="section-label">Public Cellar</p>
          {profile.publicCellar.length > 0 ? (
            <ul className="inventory-list">
              {profile.publicCellar.map((batch) => (
                <li key={batch.batchId}>
                  <span>
                    {batch.labelName} / {formatKey(batch.qualityLevel)}
                  </span>
                  <strong>
                    {batch.preserveStatus === "confirmed"
                      ? "Preserved"
                      : batch.preserveStatus === "pending"
                        ? "Pending confirmation"
                        : `${batch.score}/100`}
                  </strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Public cellar opens after the first preserved vintage.</p>
          )}
        </section>
      </main>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <main className="shell">
        <section className="panel error-panel" role="alert">
          <p className="section-label">Profile unavailable</p>
          <p>Could not load this Chateau Base profile.</p>
        </section>
      </main>
    );
  }
}
