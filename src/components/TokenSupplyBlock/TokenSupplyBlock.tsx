import React, { useState, useMemo } from 'react';
import './TokenSupplyBlock.css';

interface TokenSupplyBlockProps {
  initialTotalSupply?: number;
  initialTreasuryAllocation?: number;
  initialPublicOffering?: number;
}

export const TokenSupplyBlock: React.FC<TokenSupplyBlockProps> = ({
  initialTotalSupply = 10000000,
  initialTreasuryAllocation = 2000000,
  initialPublicOffering = 5000000,
}) => {
  const [totalSupply, setTotalSupply] = useState<string>(initialTotalSupply.toString());
  const [treasuryAllocation, setTreasuryAllocation] = useState<string>(initialTreasuryAllocation.toString());
  const [publicOffering, setPublicOffering] = useState<string>(initialPublicOffering.toString());

  const parsedTotal = parseFloat(totalSupply) || 0;
  const parsedTreasury = parseFloat(treasuryAllocation) || 0;
  const parsedPublic = parseFloat(publicOffering) || 0;
  
  const totalAllocated = parsedTreasury + parsedPublic;
  const remainingAllocation = Math.max(0, parsedTotal - totalAllocated);
  const isOverAllocated = totalAllocated > parsedTotal;

  const treasuryPct = parsedTotal > 0 ? (parsedTreasury / parsedTotal) * 100 : 0;
  const publicPct = parsedTotal > 0 ? (parsedPublic / parsedTotal) * 100 : 0;
  const remainingPct = parsedTotal > 0 ? (remainingAllocation / parsedTotal) * 100 : 0;

  return (
    <div className="token-supply-block glass-card p-6" data-testid="token-supply-block">
      <h2 className="text-xl font-semibold mb-4">Token Supply & Allocation</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label htmlFor="totalSupply" className="block text-sm font-medium mb-1">
              Total Supply
            </label>
            <input
              id="totalSupply"
              type="number"
              min="0"
              value={totalSupply}
              onChange={(e) => setTotalSupply(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
              aria-describedby="totalSupply-desc"
            />
            <p id="totalSupply-desc" className="text-xs text-muted mt-1">Total tokens to be minted.</p>
          </div>

          <div>
            <label htmlFor="treasuryAllocation" className="block text-sm font-medium mb-1">
              Treasury Allocation
            </label>
            <input
              id="treasuryAllocation"
              type="number"
              min="0"
              value={treasuryAllocation}
              onChange={(e) => setTreasuryAllocation(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
            />
          </div>

          <div>
            <label htmlFor="publicOffering" className="block text-sm font-medium mb-1">
              Public Offering
            </label>
            <input
              id="publicOffering"
              type="number"
              min="0"
              value={publicOffering}
              onChange={(e) => setPublicOffering(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
            />
          </div>
          
          {isOverAllocated && (
            <div className="text-red-400 text-sm p-3 bg-red-900/20 border border-red-500/50 rounded" role="alert">
              Error: Total allocated ({totalAllocated.toLocaleString()}) exceeds total supply ({parsedTotal.toLocaleString()}).
            </div>
          )}
        </div>

        {/* Visualization */}
        <div className="flex flex-col justify-center">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Allocation Preview</h3>
            
            {parsedTotal === 0 ? (
              <div className="text-muted text-sm italic" data-testid="empty-state">
                Please enter a total supply greater than 0 to view the allocation preview.
              </div>
            ) : (
              <>
                {/* SVG Patterns for accessibility */}
                <svg width="0" height="0" className="absolute pointer-events-none">
                  <defs>
                    <pattern id="pattern-treasury" width="8" height="8" patternUnits="userSpaceOnUse">
                      <path d="M0,0 L8,8 M8,0 L0,8" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    </pattern>
                    <pattern id="pattern-public" width="8" height="8" patternUnits="userSpaceOnUse">
                      <circle cx="4" cy="4" r="2" fill="rgba(255,255,255,0.3)" />
                    </pattern>
                    <pattern id="pattern-unallocated" width="8" height="8" patternUnits="userSpaceOnUse">
                      <path d="M0,8 L8,0" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    </pattern>
                  </defs>
                </svg>

                {/* Stacked Bar */}
                <div 
                  className={`h-12 w-full flex rounded overflow-hidden shadow-inner ${isOverAllocated ? 'ring-2 ring-red-500' : 'ring-1 ring-slate-700'}`}
                  role="img"
                  aria-label="Token allocation distribution bar chart"
                >
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300 relative flex items-center justify-center overflow-hidden" 
                    style={{ width: `${Math.min(100, treasuryPct)}%` }}
                    title={`Treasury: ${treasuryPct.toFixed(1)}%`}
                  >
                    <div className="absolute inset-0" style={{ fill: 'url(#pattern-treasury)' }}>
                      <svg width="100%" height="100%"><rect width="100%" height="100%" fill="url(#pattern-treasury)"/></svg>
                    </div>
                    {treasuryPct > 10 && <span className="relative z-10 text-xs font-bold text-white drop-shadow-md">Treasury</span>}
                  </div>
                  
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300 relative flex items-center justify-center overflow-hidden" 
                    style={{ width: `${Math.min(100 - treasuryPct, publicPct)}%` }}
                    title={`Public: ${publicPct.toFixed(1)}%`}
                  >
                    <div className="absolute inset-0" style={{ fill: 'url(#pattern-public)' }}>
                      <svg width="100%" height="100%"><rect width="100%" height="100%" fill="url(#pattern-public)"/></svg>
                    </div>
                    {publicPct > 10 && <span className="relative z-10 text-xs font-bold text-white drop-shadow-md">Public</span>}
                  </div>
                  
                  {!isOverAllocated && remainingPct > 0 && (
                    <div 
                      className="h-full bg-slate-700 transition-all duration-300 relative flex items-center justify-center overflow-hidden" 
                      style={{ width: `${remainingPct}%` }}
                      title={`Unallocated: ${remainingPct.toFixed(1)}%`}
                    >
                      <div className="absolute inset-0" style={{ fill: 'url(#pattern-unallocated)' }}>
                        <svg width="100%" height="100%"><rect width="100%" height="100%" fill="url(#pattern-unallocated)"/></svg>
                      </div>
                      {remainingPct > 10 && <span className="relative z-10 text-xs font-bold text-slate-300">Unallocated</span>}
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm" aria-label="Allocation legend">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-blue-600 relative border border-slate-700 overflow-hidden shrink-0">
                      <svg width="100%" height="100%" className="absolute inset-0"><rect width="100%" height="100%" fill="url(#pattern-treasury)"/></svg>
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">Treasury</div>
                      <div className="text-muted text-xs">{treasuryPct.toFixed(1)}% ({parsedTreasury.toLocaleString()})</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-emerald-500 relative border border-slate-700 overflow-hidden shrink-0">
                      <svg width="100%" height="100%" className="absolute inset-0"><rect width="100%" height="100%" fill="url(#pattern-public)"/></svg>
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">Public</div>
                      <div className="text-muted text-xs">{publicPct.toFixed(1)}% ({parsedPublic.toLocaleString()})</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-slate-700 relative border border-slate-600 overflow-hidden shrink-0">
                      <svg width="100%" height="100%" className="absolute inset-0"><rect width="100%" height="100%" fill="url(#pattern-unallocated)"/></svg>
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">Unallocated</div>
                      <div className="text-muted text-xs">{isOverAllocated ? '0.0%' : `${remainingPct.toFixed(1)}%`} ({isOverAllocated ? '0' : remainingAllocation.toLocaleString()})</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
