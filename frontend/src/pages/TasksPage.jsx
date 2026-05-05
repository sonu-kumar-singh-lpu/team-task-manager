import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { format, isPast, parseISO } from 'date-fns';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/tasks/my')
      .then(({ data }) => setTasks(data.tasks))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (taskId, status) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data.task } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filter ? tasks.filter(t => t.status === filter) : tasks;
  const overdue = tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'done');

  if (loading) return <div className="loading"><div className="spinner" />Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-sub">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          ⚠ You have {overdue.length} overdue task{overdue.length !== 1 ? 's' : ''}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'todo', 'in_progress', 'review', 'done'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}>
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="icon">✓</div>
          <h3>{filter ? `No ${filter.replace('_', ' ')} tasks` : 'No tasks assigned to you'}</h3>
          <p>Tasks assigned to you will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(task => {
            const overdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done';
            return (
              <div key={task.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderColor: overdue ? 'var(--red)' : undefined }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, fontSize: 15 }}>{task.title}</span>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {overdue && <span className="badge badge-overdue">Overdue</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text2)' }}>
                    <Link to={`/projects/${task.project_id}`} style={{ color: 'var(--accent)' }}>{task.project_name}</Link>
                    {task.due_date && <span style={{ color: overdue ? 'var(--red)' : undefined }}>Due {format(parseISO(task.due_date), 'MMM d, yyyy')}</span>}
                  </div>
                </div>
                <select
                  value={task.status}
                  onChange={e => handleStatusChange(task.id, e.target.value)}
                  style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}>
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
