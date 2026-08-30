import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  FileText,
  Landmark,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { OfferingSettingsGeneralTab } from "./OfferingSettingsGeneralTab";

interface OfferingData {
  id: string;
  name: string;
  category: string;
  revenueShare: number;
  targetAmount: number;
  fundedAmount: number;
  termLength: number;
  description: string;
  highlights: string[];
  riskLevel: "low" | "medium" | "high";
  minInvestment: number;
}

const mockOfferings: Record<string, OfferingData> = {
  "1": {
    id: "1",
    name: "TechFlow AI",
    category: "Enterprise SaaS",
    revenueShare: 15,
    targetAmount: 250000,
    fundedAmount: 112500,
    termLength: 36,
    description:
      "TechFlow AI is an enterprise SaaS platform providing AI-driven workflow automation for Fortune 500 companies. The platform has achieved $2.1M ARR with a 92% retention rate.",
    highlights: [
      "92% customer retention rate",
      "$2.1M annual recurring revenue",
      "Expanding into EU market",
      "Series A investors include Accel Partners",
    ],
    riskLevel: "low",
    minInvestment: 1000,
  },
};

type SettingsTabId = "general" | "distributions" | "compliance" | "documents" | "danger";

const SETTINGS_TABS: Array<{ id: SettingsTabId; label: string; description: string }> = [
  { id: "general", label: "General", description: "Basics and profile metadata" },
  { id: "distributions", label: "Distributions", description: "Payout cadence and treasury" },
  { id: "compliance", label: "Compliance", description: "Verification and sanctions" },
  { id: "documents", label: "Documents", description: "Investor materials and files" },
  { id: "danger", label: "Danger zone", description: "Sensitive operational actions" },
];

const getTabFromHash = (): SettingsTabId => {
  if (typeof window === "undefined") {
    return "general";
  }

  const hashValue = window.location.hash.replace("#", "").trim().toLowerCase();
  if (SETTINGS_TABS.some((tab) => tab.id === hashValue)) {
    return hashValue as SettingsTabId;
  }

  return "general";
};

export const OfferingDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id = "1" } = useParams<{ id: string }>();
  const offering = mockOfferings[id] || mockOfferings["1"];
  const [activeTab, setActiveTab] = useState<SettingsTabId>(getTabFromHash);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );
  const [dangerInput, setDangerInput] = useState("");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    window.history.replaceState(null, "", `#${tabId}`);
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, tabIndex: number) => {
    const keyMap: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: 1,
      ArrowUp: -1,
    };

    const nextDirection = keyMap[event.key];
    if (!nextDirection) {
      return;
    }

    event.preventDefault();
    const nextIndex = (tabIndex + nextDirection + SETTINGS_TABS.length) % SETTINGS_TABS.length;
    const nextTab = SETTINGS_TABS[nextIndex].id;
    handleTabChange(nextTab);
    tabRefs.current[nextIndex]?.focus();
  };

  const handleSaveGeneral = (data: Record<string, unknown>) => {
    console.log("Saving general settings:", data);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const canDeleteOffering = dangerInput.trim().toLowerCase() === "delete";

  const handleDeleteOffering = () => {
    if (!canDeleteOffering) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${offering.name}? This will remove the offering from issuer settings and cannot be undone.`,
    );

    if (confirmed) {
      console.warn(`Offering ${offering.id} deleted by issuer admin.`);
    }
  };

  const renderPanelContent = (tabId: SettingsTabId) => {
    if (tabId === "general") {
      return (
        <OfferingSettingsGeneralTab
          initialData={{
            name: offering.name,
            description: offering.description,
            metadata: "Series A",
          }}
          onSave={handleSaveGeneral}
        />
      );
    }

    if (tabId === "distributions") {
      return (
        <div className="space-y-5">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Distribution schedule</p>
                <h3 className="mt-2 text-xl font-semibold text-main">Quarterly payout cadence</h3>
              </div>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Active
              </span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Next payout</p>
                <p className="mt-2 text-2xl font-bold text-main">$58,400</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Treasury wallet</p>
                <p className="mt-2 text-lg font-semibold text-main">USDC Vault A</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Approval flow</p>
                <p className="mt-2 text-lg font-semibold text-main">Dual approval</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 text-main">
              <Landmark className="text-primary" size={18} />
              <h3 className="text-lg font-semibold">Distribution controls</h3>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>• Payouts are scheduled on the last business day of each quarter.</li>
              <li>• Treasury settlement is routed through the configured USDC wallet.</li>
              <li>• Post-distribution notifications are sent to all relevant stakeholders.</li>
            </ul>
          </div>
        </div>
      );
    }

    if (tabId === "compliance") {
      return (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 text-main">
            <ShieldAlert className="text-primary" size={18} />
            <h3 className="text-lg font-semibold">Compliance controls</h3>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">KYC status</p>
              <p className="mt-2 text-xl font-semibold text-main">Verified</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Sanctions review</p>
              <p className="mt-2 text-xl font-semibold text-main">Clear</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/8 p-4 text-sm text-amber-200">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={16} />
              Review required before entering restricted geographies.
            </div>
          </div>
        </div>
      );
    }

    if (tabId === "documents") {
      return (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 text-main">
            <FileText className="text-primary" size={18} />
            <h3 className="text-lg font-semibold">Offering documents</h3>
          </div>
          <div className="mt-5 space-y-3">
            {[
              ["Prospectus", "Signed and published"],
              ["Operating agreement", "Reviewed"],
              ["Investor deck", "Needs final approval"],
            ].map(([name, status]) => (
              <div key={name} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <span className="font-medium text-main">{name}</span>
                <span className="text-sm text-muted">{status}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="glass-card border border-red-500/30 bg-red-500/5 p-6">
        <div className="flex items-center gap-3 text-red-200">
          <Trash2 size={18} />
          <h3 className="text-lg font-semibold">Danger zone</h3>
        </div>

        <div className="mt-6 space-y-4 rounded-xl border border-red-500/30 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-main">Suspend raises</p>
              <p className="text-sm text-muted">Temporarily pause investment onboarding.</p>
            </div>
            <button type="button" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200">
              Suspend raises
            </button>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <p className="font-semibold text-main">Delete offering</p>
            <p className="mt-1 text-sm text-muted">
              This permanently removes the offering from the issuer dashboard and related investor access.
            </p>

            <label htmlFor="danger-confirmation" className="mt-4 block text-sm font-medium text-main">
              Type DELETE to confirm
            </label>
            <input
              id="danger-confirmation"
              type="text"
              value={dangerInput}
              onChange={(event) => setDangerInput(event.target.value)}
              placeholder="DELETE"
              aria-label="Type DELETE to confirm"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-main placeholder:text-muted focus:border-red-400 focus:outline-none"
            />

            <button
              type="button"
              onClick={handleDeleteOffering}
              disabled={!canDeleteOffering}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-900/60 disabled:text-red-200/70"
              aria-label="Delete offering"
            >
              <Trash2 size={16} />
              Delete offering
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <button
        type="button"
        onClick={handleBack}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-main"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Offering</p>
          <h1 className="mt-2 text-3xl font-bold text-main">{offering.name}</h1>
        </div>
        <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Issuer admin
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-3" role="tablist" aria-label="Offering settings">
          {SETTINGS_TABS.map((tab, index) => {
            const isSelected = activeTab === tab.id;
            return (
              <div key={tab.id} className="glass-card overflow-hidden">
                <button
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left ${
                    isSelected ? "text-primary" : "text-main"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <SlidersHorizontal size={16} />
                    <span className="font-semibold">{tab.label}</span>
                  </span>
                  <ChevronDown className={`transition ${isSelected ? "rotate-180" : ""}`} size={16} />
                </button>
                {isSelected && (
                  <div id={`panel-${tab.id}`} role="tabpanel" aria-labelledby={`tab-${tab.id}`} className="border-t border-slate-700 px-4 py-4">
                    {renderPanelContent(tab.id)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav aria-label="Offering settings" role="tablist" className="glass-card flex flex-col p-3" aria-orientation="vertical">
            {SETTINGS_TABS.map((tab, index) => {
              const isSelected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => handleTabChange(tab.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`rounded-xl px-4 py-3 text-left transition ${
                    isSelected
                      ? "border border-primary/50 bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(59,130,246,0.25)]"
                      : "border border-transparent text-muted hover:border-slate-700 hover:bg-slate-900/50 hover:text-main"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold">{tab.label}</span>
                    <SlidersHorizontal size={16} className={isSelected ? "text-primary" : "text-muted"} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{tab.description}</p>
                </button>
              );
            })}
          </nav>

          <main>
            {SETTINGS_TABS.map((tab) =>
              activeTab === tab.id ? (
                <div key={tab.id} id={`panel-${tab.id}`} role="tabpanel" aria-labelledby={`tab-${tab.id}`}>
                  {renderPanelContent(tab.id)}
                </div>
              ) : null,
            )}
          </main>
        </div>
      )}
    </div>
  );
};
