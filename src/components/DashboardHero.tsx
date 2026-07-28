import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle, ArrowRight, Wallet, AlertTriangle, Minus } from 'lucide-react';

export interface KPIData {
  value?: number | null;
  label: string;
  status: 'loading' | 'error' | 'empty' | 'success';
  type: 'currency' | 'number' | 'date';
  trend?: number; // percentage
  actionText?: string;
  actionLink?: string;
}

interface DashboardHeroProps {
  totalValue: KPIData;
  realizedGains: KPIData;
  upcomingPayouts: KPIData;
  pendingActions: KPIData;
  sparklineData?: number[];
  isNewInvestor?: boolean;
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const KpiTile: React.FC<{ data: KPIData, icon: React.ReactNode }> = ({ data, icon }) => {
  if (data.status === 'loading') {
    return (
      <div className="glass-card p-5 flex flex-col justify-center animate-pulse h-full min-h-[120px]">
        <div className="w-8 h-8 bg-slate-800 rounded-full mb-3"></div>
        <div className="h-4 bg-slate-800 rounded w-1/2 mb-2"></div>
        <div className="h-6 bg-slate-800 rounded w-3/4"></div>
      </div>
    );
  }

  if (data.status === 'error') {
    return (
      <div className="glass-card p-5 flex flex-col justify-center h-full min-h-[120px] border-red-500/20 bg-red-500/5">
        <div className="text-red-400 mb-2">
          <AlertTriangle size={24} aria-hidden="true" />
        </div>
        <div className="text-sm text-muted mb-1">{data.label}</div>
        <div className="text-sm font-medium text-red-400">Failed to load data</div>
      </div>
    );
  }

  if (data.status === 'empty' || data.value == null) {
    return (
      <div className="glass-card p-5 flex flex-col justify-center h-full min-h-[120px]">
        <div className="text-slate-500 mb-2">
          {icon}
        </div>
        <div className="text-sm text-muted mb-1">{data.label}</div>
        <div className="text-xl font-semibold text-slate-500 flex items-center gap-2">
          <Minus size={18} />
          <span className="text-sm font-normal">No data yet</span>
        </div>
      </div>
    );
  }

  const isPositiveTrend = data.trend !== undefined && data.trend >= 0;
  
  return (
    <div className="glass-card p-5 flex flex-col justify-between h-full min-h-[120px]">
      <div>
        <div className="flex items-center gap-2 text-muted mb-2">
          <div className="text-accent">{icon}</div>
          <span className="text-sm font-medium uppercase tracking-wide">{data.label}</span>
        </div>
        <div className="text-2xl lg:text-3xl font-bold text-main">
          {data.type === 'currency' ? formatCurrency(data.value) : data.value}
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        {data.trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositiveTrend ? 'text-green-400' : 'text-red-400'}`}>
            {isPositiveTrend ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{Math.abs(data.trend).toFixed(1)}%</span>
          </div>
        )}
        
        {data.actionText && data.actionLink && (
          <Link to={data.actionLink} className="text-sm text-primary hover:text-primary-hover hover:underline inline-flex items-center gap-1 focus-ring">
            {data.actionText} <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
};

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  totalValue,
  realizedGains,
  upcomingPayouts,
  pendingActions,
  sparklineData = [],
  isNewInvestor = false,
}) => {
  // A simple SVG sparkline
  const renderSparkline = () => {
    if (sparklineData.length < 2) return null;
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const height = 40;
    const width = 120;
    
    const points = sparklineData.map((val, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const isPositive = sparklineData[sparklineData.length - 1] >= sparklineData[0];
    const strokeColor = isPositive ? '#10b981' : '#ef4444'; // success or error colors

    return (
      <div className="ml-4 hidden sm:block opacity-70" aria-label="Portfolio performance sparkline">
        <svg width={width} height={height} viewBox={`0 -5 ${width} ${height + 10}`} preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };

  return (
    <section className="mb-8" aria-labelledby="hero-heading">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
        <div className="flex items-center">
          <div>
            <h1 id="hero-heading" className="text-3xl md:text-4xl font-bold tracking-tight text-main mb-2">
              {isNewInvestor ? 'Welcome to Revora' : 'Portfolio Overview'}
            </h1>
            <p className="text-muted text-base">
              {isNewInvestor 
                ? 'Discover high-yield revenue share offerings and start building your portfolio.' 
                : 'Track your personal returns and manage upcoming actions.'}
            </p>
          </div>
          {!isNewInvestor && renderSparkline()}
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/investor/portal" className="btn btn-primary whitespace-nowrap">
            Explore Offerings
          </Link>
          <Link to="/investor/settings" className="text-sm font-medium text-primary hover:text-primary-hover hover:underline whitespace-nowrap focus-ring">
            Account Settings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiTile data={totalValue} icon={<Wallet size={20} />} />
        <KpiTile data={realizedGains} icon={<DollarSign size={20} />} />
        <KpiTile data={upcomingPayouts} icon={<Calendar size={20} />} />
        <KpiTile data={pendingActions} icon={<AlertCircle size={20} />} />
      </div>
    </section>
  );
};
