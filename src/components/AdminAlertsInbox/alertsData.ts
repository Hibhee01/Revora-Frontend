import { Alert } from './types';

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    issuerId: 'iss-1',
    issuerName: 'Stellar Tech',
    severity: 'critical',
    status: 'active',
    title: 'Missed Revenue Payment',
    description: 'Stellar Tech has missed the scheduled monthly revenue share payment by 3 days.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'alert-2',
    issuerId: 'iss-2',
    issuerName: 'Nebula Corp',
    severity: 'high',
    status: 'assigned',
    title: 'Abnormal Trading Volume',
    description: 'Spike in trading volume detected for Nebula Corp tokens outside expected metrics.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    assignedTo: 'admin-1'
  },
  {
    id: 'alert-3',
    issuerId: 'iss-3',
    issuerName: 'Galactic Ventures',
    severity: 'medium',
    status: 'acknowledged',
    title: 'KYC Expiry Upcoming',
    description: 'Key principals for Galactic Ventures have KYC documentation expiring in 5 days.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
  {
    id: 'alert-4',
    issuerId: 'iss-1',
    issuerName: 'Stellar Tech',
    severity: 'low',
    status: 'active',
    title: 'Quarterly Report Due',
    description: 'Quarterly financial report is due in 7 days.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  },
  {
    id: 'alert-5',
    issuerId: 'iss-4',
    issuerName: 'Orion Holdings',
    severity: 'critical',
    status: 'resolved',
    title: 'Compliance Hold Lifted',
    description: 'The regulatory hold on Orion Holdings has been successfully resolved.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
  },
];
