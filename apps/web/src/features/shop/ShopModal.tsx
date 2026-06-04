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
      <p className="muted">Backend charges the authoritative cost after each click.</p>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <div className="shop-grid">
        {SHOP_ITEMS.map((item) => (
          <article className="shop-item" key={item.key}>
            <div>
              <h3>{item.label}</h3>
              <p>{item.description}</p>
            </div>
            <button type="button" disabled={busy} onClick={() => onBuy(item.key)}>
              Buy
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
