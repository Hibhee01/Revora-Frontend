import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { DensityProvider } from './components/DensityProvider';
import { RecentNetworksProvider } from './components/RecentNetworksProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <DensityProvider>
      <RecentNetworksProvider>
        <App />
      </RecentNetworksProvider>
    </DensityProvider>
  </React.StrictMode>
);
