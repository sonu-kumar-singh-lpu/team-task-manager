import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import api from '../utils/api';
import { format, parseISO } from 'date-fns';

const STATUS_COLORS = {
  todo: '#5c6380',
  in_progress: '#3b82f6',
  review: '#eab308',
  done: '#22c55e',
};
const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#eab308',
  low: '#22c55e',
};

const SectionTitle = ({ children }) => (
  <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
    {children}
  </h2>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      {label && <div style={{ color: 'var(--text2)', marginBottom: 6 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const StatPill = ({ label, value, color, sub }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: color, borderRadius: '10px 0 0 10px' }} />
    <div style={{ fontSize: 30, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</div>
    {sub !== undefined && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{sub}</div>}
  </div>
);

const StatusDonut = ({ data }) => {
  const formatted = data.map(d => ({
    name: d.status.replace('_', ' '),
    value: parseInt(d.count),
    color: STATUS_COLORS[d.status] || '#888',
  }));
  const total = formatted.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card">
      <SectionTitle>📊 Task status breakdown</SectionTitle>
      {total === 0 ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>No tasks yet</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 200, height: 200, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={formatted} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {formatted.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{total}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>total</div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {formatted.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1, textTransform: 'capitalize', fontSize: 13 }}>{d.name}</span>
                <span style={{ fontWeight: 600 }}>{d.value}</span>
                <span style={{ color: 'var(--text3)', fontSize: 12, minWidth: 36, textAlign: 'right' }}>
                  {Math.round(d.value / total * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PriorityBar = ({ data }) => {
  const formatted = ['high', 'medium', 'low'].map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    count: parseInt(data.find(d => d.priority === p)?.count || 0),
    fill: PRIORITY_COLORS[p],
  }));

  return (
    <div className="card">
      <SectionTitle>🎯 Tasks by priority</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={formatted} barSize={40}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 13 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="count" name="Tasks" radius={[6, 6, 0, 0]}>
            {formatted.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const TasksTimeline = ({ data }) => {
  if (!data.length) return (
    <div className="card">
      <SectionTitle>📈 Tasks over time (last 14 days)</SectionTitle>
      <div className="empty-state" style={{ padding: '24px 0' }}>No data yet</div>
    </div>
  );

  const formatted = data.map(d => ({
    date: format(parseISO(d.date), 'MMM d'),
    Created: parseInt(d.created),
    Completed: parseInt(d.completed),
  }));

  return (
    <div className="card">
      <SectionTitle>📈 Tasks over time (last 14 days)</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 13, color: 'var(--text2)' }} />
          <Area type="monotone" dataKey="Created" stroke="#6c63ff" strokeWidth={2} fill="url(#gCreated)" dot={false} />
          <Area type="monotone" dataKey="Completed" stroke="#22c55e" strokeWidth={2} fill="url(#gCompleted)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const ProjectProgress = ({ data }) => (
  <div className="card">
    <SectionTitle>📁 Project progress</SectionTitle>
    {data.length === 0 ? (
      <div className="empty-state" style={{ padding: '24px 0' }}>No projects yet</div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.map(p => {
          const total = parseInt(p.total);
          const done = parseInt(p.done);
          const pct = total > 0 ? Math.round(done / total * 100) : 0;
          return (
            <div key={p.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{p.name}</span>
                <div style={{ display: 'flex', gap: 10, color: 'var(--text2)', flexShrink: 0 }}>
                  {parseInt(p.overdue) > 0 && <span style={{ color: 'var(--red)', fontSize: 12 }}>⚠ {p.overdue} overdue</span>}
                  <span style={{ color: pct === 100 ? 'var(--green)' : 'var(--text2)' }}>{pct}%</span>
                  <span>{done}/{total}</span>
                </div>
              </div>
              <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${pct}%`,
                  background: pct === 100 ? 'var(--green)' : pct > 60 ? '#6c63ff' : pct > 30 ? 'var(--yellow)' : 'var(--red)',
                  transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const TeamWorkload = ({ data }) => {
  if (!data.length) return (
    <div className="card">
      <SectionTitle>👥 Team workload</SectionTitle>
      <div className="empty-state" style={{ padding: '24px 0' }}>No assigned tasks yet</div>
    </div>
  );

  const formatted = data.map(d => ({
    name: d.name.split(' ')[0],
    'In progress': parseInt(d.in_progress),
    Done: parseInt(d.done),
    Overdue: parseInt(d.overdue),
  }));

  return (
    <div className="card">
      <SectionTitle>👥 Team workload</SectionTitle>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 46)}>
        <BarChart data={formatted} layout="vertical" barSize={14} barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 13 }} axisLine={false} tickLine={false} width={70} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text2)' }} />
          <Bar dataKey="In progress" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          <Bar dataKey="Done" fill="#22c55e" radius={[0, 4, 4, 0]} />
          <Bar dataKey="Overdue" fill="#ef4444" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics')
      .then(({ data }) => setData(data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />Loading analytics…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const { totals, statusBreakdown, priorityBreakdown, tasksOverTime, projectProgress, teamWorkload } = data;
  const completionRate = parseFloat(totals.completion_rate) || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-sub">Performance overview across all your projects</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatPill label="Total projects" value={totals.projects} color="var(--accent)" />
        <StatPill label="Total tasks" value={totals.tasks} color="var(--blue)" />
        <StatPill label="Completion rate" value={`${completionRate}%`} color={completionRate >= 70 ? 'var(--green)' : completionRate >= 40 ? 'var(--yellow)' : 'var(--red)'} sub={`${totals.completed} of ${totals.tasks} done`} />
        <StatPill label="Overdue tasks" value={totals.overdue} color={parseInt(totals.overdue) > 0 ? 'var(--red)' : 'var(--green)'} sub={parseInt(totals.overdue) === 0 ? 'All on track!' : 'Need attention'} />
      </div>

      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>Overall completion rate</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: completionRate >= 70 ? 'var(--green)' : 'var(--accent)' }}>{completionRate}%</span>
        </div>
        <div style={{ height: 12, background: 'var(--bg3)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 6,
            width: `${completionRate}%`,
            background: `linear-gradient(90deg, #6c63ff, ${completionRate >= 70 ? '#22c55e' : '#6c63ff'})`,
            transition: 'width 1s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text2)' }}>
          <span>{totals.completed} completed</span>
          <span>{parseInt(totals.tasks) - parseInt(totals.completed)} remaining</span>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <StatusDonut data={statusBreakdown} />
        <PriorityBar data={priorityBreakdown} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <TasksTimeline data={tasksOverTime} />
      </div>

      <div className="grid-2">
        <ProjectProgress data={projectProgress} />
        <TeamWorkload data={teamWorkload} />
      </div>
    </div>
  );
}