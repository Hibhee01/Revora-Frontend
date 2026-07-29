import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Rocket,
  TrendingUp,
  Percent,
  Calendar,
  Target,
  CheckCircle,
} from "lucide-react";
import { PayoutSettingsTab } from "./PayoutSettingsTab";
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

// Mock data - replace with API call
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

export const OfferingDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id = "1" } = useParams<{ id: string }>();
  const offering = mockOfferings[id] || mockOfferings["1"];
  const [isInvesting, setIsInvesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'payouts' | 'general'>('overview');

  const handleSaveGeneral = (data: any) => {
    console.log('Saving general settings:', data);
  };
  
  const handleInvest = () => {};
  const handleBack = () => {};

  const fundingPercentage = (offering.fundedAmount / offering.targetAmount) * 100;
  const fundingRemaining = offering.targetAmount - offering.fundedAmount;

  return (
    <div className="p-6">
      <button onClick={handleBack} className="flex items-center gap-2 text-muted hover:text-white mb-6">
        <ArrowLeft size={16} /> Back
      </button>
      
      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-800 mb-6">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'overview' ? 'text-primary' : 'text-muted hover:text-main'}`}
        >
          Overview
          {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('payouts')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'payouts' ? 'text-primary' : 'text-muted hover:text-main'}`}
        >
          Payouts
          {activeTab === 'payouts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'general' ? 'text-primary' : 'text-muted hover:text-main'}`}
        >
          General
          {activeTab === 'general' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
      </div>

      {activeTab === 'compliance' ? (
        <ComplianceSettingsTab />
      ) : activeTab === 'payouts' ? (
        <PayoutSettingsTab />
      ) : activeTab === 'general' ? (
        <OfferingSettingsGeneralTab 
          initialData={{ name: offering.name, description: offering.description }}
          onSave={handleSaveGeneral}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Offering Overview */}
          <div className="lg:col-span-2 space-y-6">
          {/* Offering Header Card */}
          <div className="glass-card p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                <Rocket size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h2 className="text-lg font-semibold">{offering.category}</h2>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      offering.riskLevel === "low"
                        ? "bg-green-500/20 text-green-300"
                        : offering.riskLevel === "medium"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                    }`}
                    aria-label={`Risk level: ${offering.riskLevel}`}
                  >
                    {offering.riskLevel.charAt(0).toUpperCase() +
                      offering.riskLevel.slice(1)}{" "}
                    Risk
                  </span>
                </div>
                <p className="text-muted text-sm">{offering.description}</p>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="glass-card p-6 space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <Percent size={18} />
                <span className="text-xs text-muted uppercase tracking-wide">
                  Revenue Share
                </span>
              </div>
              <div className="text-3xl font-bold">{offering.revenueShare}%</div>
            </div>

            <div className="glass-card p-6 space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <Calendar size={18} />
                <span className="text-xs text-muted uppercase tracking-wide">
                  Term Length
                </span>
              </div>
              <div className="text-3xl font-bold">
                {offering.termLength}
                <span className="text-lg font-normal text-muted"> mo</span>
              </div>
            </div>

            <div className="glass-card p-6 space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <Target size={18} />
                <span className="text-xs text-muted uppercase tracking-wide">
                  Min Investment
                </span>
              </div>
              <div className="text-3xl font-bold">
                ${(offering.minInvestment / 1000).toFixed(0)}k
              </div>
            </div>
          </div>

          {/* Funding Progress */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp size={18} className="text-accent" />
                Funding Progress
              </h3>
              <span className="text-sm text-muted">
                {fundingPercentage.toFixed(0)}% funded
              </span>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${fundingPercentage}%` }}
                  role="progressbar"
                  aria-valuenow={Math.round(fundingPercentage)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Funding progress: ${fundingPercentage.toFixed(0)}% of $${offering.targetAmount.toLocaleString()} raised`}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>
                  ${offering.fundedAmount.toLocaleString()} raised
                </span>
                <span>
                  ${fundingRemaining.toLocaleString()} remaining
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700">
              <div>
                <span className="text-xs text-muted uppercase tracking-wide">
                  Target Amount
                </span>
                <div className="text-lg font-semibold">
                  ${offering.targetAmount.toLocaleString()} USDC
                </div>
              </div>
              <div>
                <span className="text-xs text-muted uppercase tracking-wide">
                  Currency
                </span>
                <div className="text-lg font-semibold">Stellar (USDC)</div>
              </div>
            </div>
          </div>

          {/* Terms & Highlights */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle size={18} className="text-accent" />
              Why Invest
            </h3>
            <ul className="space-y-3">
              {offering.highlights.map((highlight, idx) => (
                <li key={idx} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0 mt-2"></div>
                  <span className="text-muted">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="glass-card p-4 bg-slate-900/50 border-slate-700">
            <p className="text-xs text-muted leading-relaxed">
              <strong>Risk Disclosure:</strong> Revenue-share investments carry
              risk. Returns depend on company performance and are distributed
              automatically via Soroban smart contracts. Past performance does
              not guarantee future results. Please review the full prospectus
              before investing.
            </p>
          </div>
        </div>

        {/* Right Column: Investment Card */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 space-y-6 sticky top-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Ready to Invest?</h3>
              <p className="text-sm text-muted">
                Secure your share of {offering.revenueShare}% revenue from{" "}
                {offering.name}.
              </p>
            </div>

            <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Investment amount</span>
                <span className="font-semibold">
                  ${(offering.minInvestment / 1000).toFixed(0)}k+ USDC
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Annual return*</span>
                <span className="font-semibold text-accent">
                  {offering.revenueShare}% pro-rata
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Lock-up period</span>
                <span className="font-semibold">
                  {offering.termLength} months
                </span>
              </div>
            </div>

            <button
              onClick={handleInvest}
              disabled={isInvesting}
              className="btn-primary py-3 text-base font-semibold"
              aria-label={`Invest $${offering.minInvestment / 1000}k or more in ${offering.name}`}
            >
              {isInvesting ? "Processing..." : "Invest Now"}
            </button>

            <button
              onClick={handleBack}
              className="btn-secondary py-2 text-sm"
              aria-label={`Back to discover more offerings`}
            >
              Back to Discovery
            </button>

            <p className="text-xs text-muted text-center leading-relaxed">
              *Returns distributed monthly via automated smart contracts.
              Subject to company revenue.
            </p>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
