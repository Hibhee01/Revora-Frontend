import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Moon, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import ActivityItem from './ActivityItem';
import ActivityDateGroup from './ActivityDateGroup';
import { EmptyState } from './designSystem/EmptyState';
import './ActivityFeed.css';

// Mock data type
export interface Activity {
  id: string;
  type: 'payout' | 'offering' | 'blacklist';
  timestamp: string; // ISO string
  title: string;
  description: string;
  isRead?: boolean;
}

// Helper to group by date relative categories
const groupByDate = (items: Activity[]) => {
  const groups: Record<string, Activity[]> = {};
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  items.forEach(item => {
    const itemDate = new Date(item.timestamp);
    itemDate.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - itemDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let groupKey = '';
    if (diffDays === 0) {
      groupKey = 'Today';
    } else if (diffDays === 1) {
      groupKey = 'Yesterday';
    } else if (diffDays <= 7) {
      groupKey = 'This Week';
    } else {
      // For older items, use the actual date string
      groupKey = new Date(item.timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
  });
  return groups;
};

const EmptyDayDivider: React.FC<{ count: number }> = ({ count }) => (
  <div className="empty-day-divider" role="separator" aria-label={`${count} ${count === 1 ? 'day' : 'days'} with no activity`}>
    <div className="divider-line" aria-hidden="true" />
    <div className="divider-content">
      <Calendar size={14} aria-hidden="true" />
      <span>{count} {count === 1 ? 'day' : 'days'} with no activity</span>
    </div>
    <div className="divider-line" aria-hidden="true" />
  </div>
);

const QuietWeekSummaryCard: React.FC = () => (
  <div className="quiet-week-card glass-card" role="region" aria-label="Quiet week summary">
    <div className="icon-wrapper" aria-hidden="true">
      <Moon size={24} />
    </div>
    <h3>It's been a quiet week</h3>
    <p>There was no activity to report during this period. You're all caught up!</p>
    <Link to="/settings/notifications" className="btn btn-secondary">
      <Bell size={16} aria-hidden="true" />
      <span>Manage Notification Settings</span>
    </Link>
  </div>
);

const PAGE_SIZE = 10;

const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const previousActivitiesRef = useRef<Activity[]>([]);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate fetching data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // In a real app replace with API call
      const mock: Activity[] = Array.from({ length: 35 }, (_, i) => {
        const types = ['payout', 'offering', 'blacklist'] as const;
        const type = types[i % types.length];
        const now = new Date();
        
        // Generate simulated gaps
        let daysAgo = 0;
        if (i < 5) daysAgo = i; // continuous
        else if (i < 10) daysAgo = i + 2; // gap of 2 days
        else if (i < 15) daysAgo = i + 10; // gap of 8 days
        else daysAgo = i + 15; // continuous
        
        now.setDate(now.getDate() - daysAgo);
        return {
          id: `act-${i}`,
          type,
          timestamp: now.toISOString(),
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Event ${i}`,
          description: `Description for ${type} event ${i}`,
          isRead: i > 4, // First 5 items are unread
        };
      });
      // Simulate network latency
      await new Promise(r => setTimeout(r, 500));
      setActivities(mock);
      setLoading(false);
    };
    fetchData();
    
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const grouped = groupByDate(activities.slice(0, page * PAGE_SIZE));
  const dates = Object.keys(grouped);

  const loadMore = () => setPage(prev => prev + 1);

  const hasUnread = activities.some(a => !a.isRead);

  const handleMarkAllRead = () => {
    previousActivitiesRef.current = activities;
    setActivities(activities.map(a => ({ ...a, isRead: true })));
    setShowUndo(true);
    setAnnouncement('All activities marked as read.');
    
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndo(false);
    }, 10000);
  };

  const handleUndo = () => {
    if (previousActivitiesRef.current.length > 0) {
      setActivities(previousActivitiesRef.current);
      setShowUndo(false);
      setAnnouncement('Mark all read undone.');
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  const handleMarkRead = (id: string) => {
    setActivities(acts => acts.map(a => a.id === id ? { ...a, isRead: true } : a));
    setAnnouncement('Activity marked as read.');
    setShowUndo(false);
  };

  if (loading) {
    return <div className="activity-feed-loading" aria-live="polite">Loading activity feed…</div>;
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        variant="audit-trail"
        title="No audit trail entries"
        description="Activity logs will appear here as transactions and events occur on the platform."
        primaryAction={{
          label: 'Refresh',
          onClick: () => window.location.reload(),
        }}
        size={80}
      />
    );
  }

  return (
    <section className="activity-feed" aria-label="In‑app activity feed">
      <ul role="list" className="activity-list" style={{ listStyle: 'none', padding: 0 }}>
        {dates.map((date, index) => {
          let emptyState = null;
          if (index < dates.length - 1) {
            const currentDateObj = new Date(grouped[date][0].timestamp);
            const nextDateObj = new Date(grouped[dates[index + 1]][0].timestamp);
            
            currentDateObj.setHours(0, 0, 0, 0);
            nextDateObj.setHours(0, 0, 0, 0);
            
            const diffTime = Math.abs(currentDateObj.getTime() - nextDateObj.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const emptyDaysCount = diffDays - 1;

            if (emptyDaysCount >= 7) {
              emptyState = <QuietWeekSummaryCard />;
            } else if (emptyDaysCount > 0) {
              emptyState = <EmptyDayDivider count={emptyDaysCount} />;
            }
          }

          return (
            <React.Fragment key={date}>
              <ActivityDateGroup date={date} />
              {grouped[date].map(item => (
                <li role="listitem" key={item.id}>
                  <ActivityItem activity={item} />
                </li>
              ))}
              {emptyState && (
                <li role="listitem">
                  {emptyState}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ul>
      {page * PAGE_SIZE < activities.length && (
        <button className="btn btn-primary load-more" onClick={loadMore} style={{ marginTop: 'var(--spacing-md)' }}>Load more</button>
      )}
    </section>
  );
};

export default ActivityFeed;
