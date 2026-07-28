export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'active' | 'acknowledged' | 'assigned' | 'resolved';

export interface Alert {
  id: string;
  issuerId: string;
  issuerName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  createdAt: string; // ISO 8601 string
  assignedTo?: string;
}

export type GroupingStrategy = 'severity' | 'issuer' | 'time' | 'none';
