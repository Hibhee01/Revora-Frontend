import React, { useState } from "react";
import { Globe, DollarSign, Settings as SettingsIcon } from "lucide-react";
import { I18nFormatterPreview } from "../components/I18nFormatterPreview";
import { PayoutSettingsTab } from "../components/PayoutSettingsTab";

export type SettingsTab = "i18n" | "payouts";

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("i18n");

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main flex items-center gap-3">
            <SettingsIcon className="text-primary" size={28} />
            <span>Account & Application Settings</span>
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage your regional preferences, number formatting, and payout distribution configurations.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2" role="tablist" aria-label="Settings tabs">
        <button
          type="button"
          role="tab"
          id="tab-i18n"
          aria-selected={activeTab === "i18n"}
          aria-controls="panel-i18n"
          onClick={() => setActiveTab("i18n")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "i18n"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-main"
          }`}
        >
          <Globe size={18} />
          <span>Localization & Formatting</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-payouts"
          aria-selected={activeTab === "payouts"}
          aria-controls="panel-payouts"
          onClick={() => setActiveTab("payouts")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "payouts"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-main"
          }`}
        >
          <DollarSign size={18} />
          <span>Payout Settings</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="tab-content">
        {activeTab === "i18n" && (
          <div id="panel-i18n" role="tabpanel" aria-labelledby="tab-i18n">
            <I18nFormatterPreview />
          </div>
        )}

        {activeTab === "payouts" && (
          <div id="panel-payouts" role="tabpanel" aria-labelledby="tab-payouts">
            <PayoutSettingsTab />
          </div>
        )}
      </div>
    </div>
  );
};
