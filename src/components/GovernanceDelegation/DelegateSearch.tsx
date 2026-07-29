import React, { useState } from 'react';
import './GovernanceDelegation.css';

interface DelegateSearchProps {
  onSelectDelegate: (delegateId: string) => void;
}

export const DelegateSearch: React.FC<DelegateSearchProps> = ({ onSelectDelegate }) => {
  const [query, setQuery] = useState('');

  // Mock data for search
  const mockDelegates = [
    { id: 'del-1', name: 'Alice Voter', address: '0x1234...5678' },
    { id: 'del-2', name: 'Bob Stake', address: '0x8765...4321' },
    { id: 'del-3', name: 'Charlie Node', address: '0xABCD...EF01' },
  ];

  const filteredDelegates = mockDelegates.filter(
    (d) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.address.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="delegate-search" data-testid="delegate-search">
      <label htmlFor="delegate-search-input" className="sr-only">Search Delegates</label>
      <input
        id="delegate-search-input"
        type="text"
        placeholder="Search by name or address..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
        aria-label="Search Delegates"
      />
      {query && (
        <ul className="search-results" role="listbox">
          {filteredDelegates.length > 0 ? (
            filteredDelegates.map((delegate) => (
              <li
                key={delegate.id}
                role="option"
                aria-selected="false"
                onClick={() => {
                  onSelectDelegate(delegate.id);
                  setQuery('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectDelegate(delegate.id);
                    setQuery('');
                  }
                }}
                tabIndex={0}
                className="search-result-item"
              >
                <span className="delegate-name">{delegate.name}</span>
                <span className="delegate-address">{delegate.address}</span>
              </li>
            ))
          ) : (
            <li className="search-result-empty" role="presentation">No delegates found</li>
          )}
        </ul>
      )}
    </div>
  );
};
