import React from 'react';
import payoutIcon from '../assets/icons/payout.svg';
import offeringIcon from '../assets/icons/offering.svg';
import blacklistIcon from '../assets/icons/blacklist.svg';
import './ActivityItem.css';

export interface ActivityItemProps {
  activity: {
    id?: string;
    type: 'payout' | 'offering' | 'blacklist';
    title: string;
    description: string;
    timestamp: string;
    isRead?: boolean;
  };
  onMarkRead?: (id: string) => void;
}

const iconMap: Record<string, string> = {
  payout: payoutIcon,
  offering: offeringIcon,
  blacklist: blacklistIcon,
};

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onMarkRead }) => {
  const { id = '', type, title, description, timestamp, isRead = true } = activity;
  const Icon = iconMap[type];
  const date = new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return (
    <div 
      className={`activity-item glass-card-interactive ${!isRead ? 'unread' : ''}`} 
      role="article"
      aria-current={!isRead ? 'true' : 'false'}
    >
      <div className="activity-item-indicator" aria-hidden="true">
        {!isRead && <span className="unread-dot" title="Unread" />}
      </div>
      <img src={Icon} alt="" aria-hidden="true" className="activity-icon" />
      <div className="activity-content">
        <h3 className="activity-title text-primary">{title}</h3>
        <p className="activity-description text-muted">{description}</p>
      </div>
      <div className="activity-meta">
        <time className="activity-time text-muted" dateTime={timestamp} aria-label={`Occurred at ${date}`}> {date} </time>
        {!isRead && onMarkRead && (
          <button 
            className="mark-read-btn" 
            onClick={() => onMarkRead(id)}
            aria-label="Mark item as read"
            title="Mark as read"
          >
            Mark read
          </button>
        )}
      </div>
    </div>
  );
};

export default ActivityItem;
