import React, { useState } from 'react';
import { Info, AlertTriangle } from 'lucide-react';

interface RedemptionBannerProps {
  totalCapacity: number;
  currentSubscription: number;
}

export const RedemptionBanner: React.FC<RedemptionBannerProps> = ({ totalCapacity, currentSubscription }) => {
  const [showPopover, setShowPopover] = useState(false);
  const subscriptionPercentage = totalCapacity > 0 ? (currentSubscription / totalCapacity) * 100 : 0;
  const isOversubscribed = subscriptionPercentage > 100;
  const cappedPercentage = Math.min(subscriptionPercentage, 100);

  return (
    <section className="glass-card animate-fade-in redemption-banner" aria-labelledby="redemption-banner-title">
      <div className="banner-header">
        <div>
          <h2 id="redemption-banner-title" className="banner-title">
            Redemption Window In Progress
          </h2>
          <p className="banner-subtitle">
            {currentSubscription.toLocaleString()} of {totalCapacity.toLocaleString()} tokens subscribed
          </p>
        </div>
        {isOversubscribed && (
          <div role="alert" className="banner-alert">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>Oversubscribed</span>
          </div>
        )}
      </div>

      <div className="progress-container">
        <div
          className={`progress-fill ${isOversubscribed ? 'pattern-warning oversubscribed' : ''}`}
          style={{ width: `${cappedPercentage}%` }}
          role="progressbar"
          aria-valuenow={subscriptionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Subscription capacity: ${Math.round(subscriptionPercentage)}%`}
        >
          {cappedPercentage >= 10 && (
            <span className="progress-text">
              {Math.round(subscriptionPercentage)}%
            </span>
          )}
        </div>
      </div>

      <div className="banner-footer">
        <div className="popover-container">
          <button
            onClick={() => setShowPopover(!showPopover)}
            className="popover-trigger focus-ring"
            aria-expanded={showPopover}
            aria-controls="pro-rata-explainer"
          >
            <Info size={14} aria-hidden="true" />
            How does pro-rata allocation work?
          </button>
          
          {showPopover && (
            <div
              id="pro-rata-explainer"
              className="glass-card popover-content animate-fade-in"
              role="region"
              aria-label="Pro-rata explainer"
            >
              When a redemption window is oversubscribed (above 100%), available capacity is distributed proportionally among all requests. For example, if total requests are double the capacity, each investor receives 50% of their requested redemption.
              <div className="popover-actions">
                <button
                  onClick={() => setShowPopover(false)}
                  className="popover-close focus-ring"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
