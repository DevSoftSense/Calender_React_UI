import React from "react";
import { useLocation } from "react-router-dom";
import classnames from "classnames";
import { ITEM_TABS, useItemsPageOptional } from "./ItemsPageContext";
import "./items.css";

const ItemsLeftPanel = () => {
  const location = useLocation();
  const ctx = useItemsPageOptional();

  if (!location.pathname.startsWith("/calendar-items") || !ctx) {
    return null;
  }

  const { tab, setTab, counts } = ctx;

  return (
    <div className="items-sidebar-filters">
      <div className="items-sidebar-heading">Filters</div>
      {ITEM_TABS.map((f) => {
        const count = counts[f.countKey] ?? 0;
        const active = tab === f.key;
        return (
          <button
            type="button"
            key={f.key}
            className={classnames("items-sidebar-filter", { active })}
            style={{ "--filter-color": f.color }}
            onClick={() => setTab(f.key)}
          >
            <span className="items-filter-dot" style={{ background: f.color }} />
            <span className="items-filter-label">{f.label}</span>
            <span className="items-filter-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ItemsLeftPanel;
