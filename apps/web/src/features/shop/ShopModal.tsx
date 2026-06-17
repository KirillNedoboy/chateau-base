import type { ShopItemKey } from "@chateau/shared";
import { SHOP_ITEMS } from "../game-ui/viewModels";

type ShopModalProps = {
  busy: boolean;
  error: string | null;
  message: string | null;
  onBuy: (itemKey: ShopItemKey) => void;
  onClose: () => void;
};

export function ShopModal({ busy, error, message, onBuy, onClose }: ShopModalProps) {
  return (
    <section className="panel modal-panel" role="dialog" aria-labelledby="shop-title">
      <div className="panel-heading">
        <div>
          <p className="section-label">Shop</p>
          <h2 id="shop-title">Buy Supplies</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="muted">
        Supplies are priced and applied by the backend. Buy one item per tap.
      </p>

      {error ? <p className="state-banner form-error">{error}</p> : null}
      {message ? <p className="state-banner form-success">{message}</p> : null}

      <div className="shop-grid">
        {SHOP_ITEMS.map((item) => (
          <article className={`shop-item shop-item-${item.tone}`} key={item.key}>
            <div>
              <div className="item-title-row">
                <h3>{item.label}</h3>
                <span className="tag-chip">{item.badge}</span>
              </div>
              <p>{item.description}</p>
            </div>
            <button type="button" disabled={busy} onClick={() => onBuy(item.key)}>
              {busy ? "Buying" : item.actionLabel}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
