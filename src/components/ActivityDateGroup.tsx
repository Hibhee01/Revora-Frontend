import React from 'react';
import './ActivityDateGroup.css';

interface Props {
  date: string;
}

const ActivityDateGroup: React.FC<Props> = ({ date }) => (
  <li className="activity-date-group" role="separator" aria-label={`Activities on ${date}`}>
    <span className="date-label glass-card">{date}</span>
  </li>
);

export default ActivityDateGroup;
