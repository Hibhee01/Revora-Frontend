import React, { useState, useMemo } from 'react';
import { Alert, GroupingStrategy } from './types';
import { AlertRow } from './AlertRow';
import { EmptyState } from '../designSystem/EmptyState';
import { Button } from '../Button';
import { LayoutGrid, Users, Clock, AlertTriangle, Search, Filter } from 'lucide-react';

interface AlertsInboxTableProps {
  alerts: Alert[];
  onAction: (id: string, action: 'acknowledge' | 'assign' | 'resolve') => void;
  onBulkAction: (ids: string[], action: 'acknowledge' | 'assign' | 'resolve') => void;
}

export const AlertsInboxTable: React.FC<AlertsInboxTableProps> = ({
  alerts,
  onAction,
  onBulkAction
}) => {
  const [grouping, setGrouping] = useState<GroupingStrategy>('none');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = useMemo(() => {
    if (!searchQuery) return alerts;
    const lowerQ = searchQuery.toLowerCase();
    return alerts.filter(a => 
      a.title.toLowerCase().includes(lowerQ) || 
      a.issuerName.toLowerCase().includes(lowerQ) ||
      a.description.toLowerCase().includes(lowerQ)
    );
  }, [alerts, searchQuery]);

  const groupedAlerts = useMemo(() => {
    if (grouping === 'none') {
      return { 'All Alerts': filteredAlerts };
    }

    const groups: Record<string, Alert[]> = {};
    
    filteredAlerts.forEach(alert => {
      let key = 'Other';
      if (grouping === 'severity') {
        key = alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1) + ' Priority';
      } else if (grouping === 'issuer') {
        key = alert.issuerName;
      } else if (grouping === 'time') {
        const date = new Date(alert.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 0) key = 'Today';
        else if (diffDays === 1) key = 'Yesterday';
        else if (diffDays < 7) key = 'Last 7 Days';
        else key = 'Older';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(alert);
    });

    return groups;
  }, [filteredAlerts, grouping]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredAlerts.map(a => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const performBulkAction = (action: 'acknowledge' | 'assign' | 'resolve') => {
    onBulkAction(Array.from(selectedIds), action);
    setSelectedIds(new Set());
  };

  if (alerts.length === 0) {
    return (
      <EmptyState
        variant="distribution-dashboard" // Reusing available variant for now
        title="No alerts"
        description="Your inbox is empty. We will notify you when action is required."
        primaryAction={{
          label: 'Refresh',
          href: '#',
          onClick: () => window.location.reload()
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900/50 p-4 rounded-xl border border-white/10">
        
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            aria-label="Search alerts"
          />
        </div>

        {/* Grouping toggles */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar">
          <span className="text-sm text-gray-400 flex items-center gap-1 mr-2">
            <Filter className="w-4 h-4" /> Group by:
          </span>
          <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
            <button
              onClick={() => setGrouping('none')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${grouping === 'none' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" /> None
            </button>
            <button
              onClick={() => setGrouping('severity')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${grouping === 'severity' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <AlertTriangle className="w-4 h-4" /> Severity
            </button>
            <button
              onClick={() => setGrouping('issuer')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${grouping === 'issuer' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Users className="w-4 h-4" /> Issuer
            </button>
            <button
              onClick={() => setGrouping('time')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${grouping === 'time' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Clock className="w-4 h-4" /> Time
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4 animate-fade-in">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} alert{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => performBulkAction('acknowledge')}>
              Acknowledge All
            </Button>
            <Button variant="secondary" size="sm" onClick={() => performBulkAction('assign')}>
              Assign All
            </Button>
            <Button variant="primary" size="sm" onClick={() => performBulkAction('resolve')}>
              Resolve All
            </Button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-800/50 border-b border-white/10 p-4 flex items-center gap-4">
          <input 
            type="checkbox" 
            checked={filteredAlerts.length > 0 && selectedIds.size === filteredAlerts.length}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary focus:ring-offset-gray-900"
            aria-label="Select all alerts"
          />
          <span className="text-sm font-medium text-gray-400">Alerts ({filteredAlerts.length})</span>
        </div>

        {/* Grouped Rows */}
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No alerts match your search.</div>
        ) : (
          Object.entries(groupedAlerts).map(([groupName, groupAlerts]) => (
            <div key={groupName} className="mb-2 last:mb-0">
              {grouping !== 'none' && (
                <div className="bg-gray-800/80 px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider border-b border-white/5">
                  {groupName} ({groupAlerts.length})
                </div>
              )}
              <div>
                {groupAlerts.map(alert => (
                  <AlertRow 
                    key={alert.id}
                    alert={alert}
                    isSelected={selectedIds.has(alert.id)}
                    onSelect={handleSelect}
                    onAction={onAction}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
