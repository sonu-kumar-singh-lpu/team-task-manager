import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast, parseISO } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />Loading dashboard…</div>;

  const { stats, overdueTasks } = data || {};

  const statCards = [
    { label: 'Projects', value: stats?.total_projects || 0, color: 'var(--accent)' },
    { label: 'Total tasks', value: stats?.total_tasks || 0, color: 'var(--blue)' },
    { label: 'In progress', value: stats?.in_progress || 0, color: 'var(--yellow)' },
    { label: 'Overdue', value: stats?.overdue || 0, color: 'var(--red)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good day, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-sub">Here's what's happening across your projects</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="card stat-card">
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Task status breakdown */}
      <div className="grid-2" style={{ marginBottom: 32 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Task status</h3>
          {[
            { key: 'todo', label: 'To do', val: stats?.todo || 0 },
            { key: 'in_progress', label: 'In progress', val: stats?.in_progress || 0 },
            { key: 'review', label: 'In review', val: stats?.review || 0 },
            { key: 'done', label: 'Done', val: stats?.done || 0 },
          ].map(({ key, label, val }) => {
            const total = parseInt(stats?.total_tasks) || 1;
            const pct = Math.round((val / total) * 100);
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span className={`badge badge-${key}`}>{label}</span>
                  <span style={{ color: 'var(--text2)' }}>{val} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, transition: 'width 0.6s', background: key === 'todo' ? 'var(--text3)' : key === 'in_progress' ? 'var(--blue)' : key === 'review' ? 'var(--yellow)' : 'var(--green)' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Overdue tasks */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600 }}>Overdue tasks</h3>
            {overdueTasks?.length > 0 && <span className="badge badge-overdue">{overdueTasks.length}</span>}
          </div>
          {overdueTasks?.length === 0 ? (
            <div style={{ color: 'var(--text2)', textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
              No overdue tasks!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {overdueTasks?.slice(0, 5).map(task => (
                <div key={task.id} style={{ padding: 12, background: 'var(--red-light)', borderRadius: 8, borderLeft: '3px solid var(--red)' }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{task.title}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 4 }}>
                    {task.project_name} · Due {format(parseISO(task.due_date), 'MMM d')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/projects" className="btn btn-primary">View all projects</Link>
        <Link to="/tasks" className="btn btn-ghost">My tasks</Link>
      </div>
    </div>
  );
}
