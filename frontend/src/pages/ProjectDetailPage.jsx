import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast, parseISO } from 'date-fns';

function TaskModal({ projectId, members, task, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignee_id: task?.assignee_id || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    due_date: task?.due_date ? task.due_date.slice(0, 10) : '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, assignee_id: form.assignee_id || null, due_date: form.due_date || null };
      if (isEdit) {
        const { data } = await api.put(`/tasks/${task.id}`, payload);
        onSaved(data.task);
      } else {
        const { data } = await api.post(`/projects/${projectId}/tasks`, payload);
        onSaved(data.task);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit task' : 'New task'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Title *</label>
            <input placeholder="Task title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea placeholder="Details…" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Assignee</label>
              <select value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(`/projects/${projectId}/members`, { email, role });
      onAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add team member</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" placeholder="colleague@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Project role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding…' : 'Add member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');
  const [taskModal, setTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [memberModal, setMemberModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
      ]);
      setProject(projectRes.data.project);
      setMembers(projectRes.data.members);
      setTasks(tasksRes.data.tasks);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/projects/${projectId}/members/${userId}`);
    setMembers(prev => prev.filter(m => m.id !== userId));
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this entire project and all its tasks?')) return;
    await api.delete(`/projects/${projectId}`);
    navigate('/projects');
  };

  const isAdmin = user?.role === 'admin' || members.find(m => m.id === user?.id)?.role === 'admin';

  const filteredTasks = statusFilter ? tasks.filter(t => t.status === statusFilter) : tasks;

  if (loading) return <div className="loading"><div className="spinner" />Loading…</div>;
  if (!project) return null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 12 }}>← Back</button>
        <div className="page-header">
          <div>
            <h1 className="page-title">{project.name}</h1>
            {project.description && <p className="page-sub">{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {isAdmin && (
              <>
                <button className="btn btn-primary btn-sm" onClick={() => setTaskModal(true)}>+ Task</button>
                <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete project</button>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text2)' }}>
          <span>Owner: {project.owner_name}</span>
          <span className={`badge badge-${project.status}`}>{project.status}</span>
          <span>{tasks.length} tasks · {members.length} members</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {['tasks', 'members'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 18px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t ? 'var(--accent)' : 'var(--text2)', fontWeight: tab === t ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {/* Tasks tab */}
      {tab === 'tasks' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {['', 'todo', 'in_progress', 'review', 'done'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}>
                {s ? s.replace('_', ' ') : 'All'}
              </button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="empty-state card">
              <div className="icon">✓</div>
              <h3>No tasks yet</h3>
              {isAdmin && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setTaskModal(true)}>+ Create first task</button>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredTasks.map(task => {
                const overdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done';
                return (
                  <div key={task.id} className="task-row" style={overdue ? { borderColor: 'var(--red)' } : {}}>
                    <div style={{ flex: 1 }}>
                      <div className="task-title" style={task.status === 'done' ? { textDecoration: 'line-through', color: 'var(--text2)' } : {}}>{task.title}</div>
                      <div className="task-meta" style={{ marginTop: 4 }}>
                        <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        {task.assignee_name && <span>→ {task.assignee_name}</span>}
                        {task.due_date && <span style={{ color: overdue ? 'var(--red)' : 'var(--text2)' }}>{overdue ? '⚠ ' : ''}Due {format(parseISO(task.due_date), 'MMM d')}</span>}
                      </div>
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditTask(task); setTaskModal(true); }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task.id)}>×</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Members tab */}
      {tab === 'members' && (
        <div>
          {isAdmin && (
            <div style={{ marginBottom: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setMemberModal(true)}>+ Add member</button>
            </div>
          )}
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{m.name?.charAt(0).toUpperCase()}</div>
                      {m.name}
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{m.email}</td>
                    <td><span className={`badge badge-${m.role}`}>{m.role}</span></td>
                    <td style={{ color: 'var(--text2)' }}>{m.joined_at ? format(new Date(m.joined_at), 'MMM d, yyyy') : '—'}</td>
                    {isAdmin && (
                      <td>
                        {m.id !== user?.id && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.id)}>Remove</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {taskModal && (
        <TaskModal
          projectId={projectId}
          members={members}
          task={editTask}
          onClose={() => { setTaskModal(false); setEditTask(null); }}
          onSaved={(savedTask) => {
            if (editTask) setTasks(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));
            else setTasks(prev => [savedTask, ...prev]);
          }}
        />
      )}

      {memberModal && (
        <AddMemberModal projectId={projectId} onClose={() => setMemberModal(false)} onAdded={fetchData} />
      )}
    </div>
  );
}
