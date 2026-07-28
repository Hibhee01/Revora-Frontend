import { useContext } from 'react';
import { RecentNetworksContext } from '../components/RecentNetworksProvider/RecentNetworksProvider';

export function useRecentNetworks() {
  const ctx = useContext(RecentNetworksContext);
  if (!ctx) {
    throw new Error('useRecentNetworks must be used inside <RecentNetworksProvider>');
  }
  return ctx;
}
