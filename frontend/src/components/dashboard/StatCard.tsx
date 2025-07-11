
import React from 'react';
// A helper component to render the correct icon
const Icon: React.FC<{ type: string }> = ({ type }) => {
  const icons: { [key: string]: React.ReactNode } = {
    wallet: <svg viewBox="0 0 24 24"><path d="M20 12V8H6a2 2 0 0 1-2-2V4h12a2 2 0 0 0 2-2V1" strokeWidth="2"/><path d="M20 7V5c0-1.1-.9-2-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-2" strokeWidth="2"/></svg>,
    trend: <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    target: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    winrate: <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  };
  return <div className="stat-card-icon-wrapper">{icons[type]}</div>;
};

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  change?: string;
  changeType?: "positive" | "negative";
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeType }) => {
  return (
    <div className="dashboard-card stat-card">
      <Icon type={icon} />
      <div className="stat-card-info">
        <span className="stat-card-title">{title}</span>
        <span className="stat-card-value">{value}</span>
      </div>
      {change && <span className={`stat-card-change ${changeType}`}>{change}</span>}
    </div>
  );
};

export default StatCard;