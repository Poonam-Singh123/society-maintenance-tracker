import { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { api } from '../api';

export default function Notices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', is_important: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getNotices();
      setNotices(data.notices);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.createNotice(form);
      setForm({ title: '', content: '', is_important: false });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Notice Board</h1>
        <p>Society announcements and important updates</p>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      {user.role === 'admin' && (
        <div className="card">
          <h2><span className="card-icon">📢</span> Post Notice</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="full-width">
              Title
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notice title" required />
            </label>
            <label className="full-width">
              Content
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Write your notice here..." required />
            </label>
            <label className="checkbox-label full-width">
              <input type="checkbox" checked={form.is_important} onChange={(e) => setForm({ ...form, is_important: e.target.checked })} />
              Mark as important (pinned to top + email all residents)
            </label>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Notice'}
            </button>
          </form>
        </div>
      )}

      <div className="notice-list">
        {loading ? (
          <div className="loading" style={{ minHeight: '120px' }}><div className="spinner" /></div>
        ) : notices.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">📌</div>
            <p>No notices posted yet.</p>
          </div>
        ) : notices.map((n) => (
          <div key={n.id} className={`card notice-card ${n.is_important ? 'important' : ''}`}>
            {n.is_important && <span className="pin-badge">📌 Important</span>}
            <h3>{n.title}</h3>
            <p className="notice-meta">{new Date(n.created_at).toLocaleString()} — {n.author_name}</p>
            <p>{n.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
