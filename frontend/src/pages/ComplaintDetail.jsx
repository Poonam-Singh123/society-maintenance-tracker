import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

const statusClass = { Open: 'badge-open', 'In Progress': 'badge-progress', Resolved: 'badge-resolved' };

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getComplaint(id)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="page">
      <div className="loading"><div className="spinner" /><span>Loading complaint...</span></div>
    </div>
  );
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!data) return null;

  const { complaint, history } = data;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Complaint #{complaint.id}</h1>
        <p>{complaint.category} · {new Date(complaint.created_at).toLocaleDateString()}</p>
      </div>

      <div className="card">
        <div className="detail-grid">
          <div className="detail-item">
            <strong>Category</strong>
            {complaint.category}
          </div>
          <div className="detail-item">
            <strong>Status</strong>
            <span className={`badge ${statusClass[complaint.status]}`}>{complaint.status}</span>
          </div>
          <div className="detail-item">
            <strong>Priority</strong>
            <span className={`badge priority-${complaint.priority.toLowerCase()}`}>{complaint.priority}</span>
          </div>
          {user.role === 'admin' && (
            <div className="detail-item">
              <strong>Resident</strong>
              {complaint.resident_name}
            </div>
          )}
          <div className="detail-item">
            <strong>Created</strong>
            {new Date(complaint.created_at).toLocaleString()}
          </div>
          {complaint.is_overdue ? (
            <div className="detail-item">
              <strong>Alert</strong>
              <span className="overdue-label">⚠ Overdue</span>
            </div>
          ) : null}
        </div>
        <p className="description">{complaint.description}</p>
        {complaint.photo_path && (
          <div className="photo-wrap">
            <img src={complaint.photo_path} alt="Complaint attachment" />
          </div>
        )}
      </div>

      <div className="card">
        <h2><span className="card-icon">🕐</span> Status History</h2>
        {history.length === 0 ? (
          <div className="empty-state"><p className="muted">No history yet.</p></div>
        ) : (
          <ul className="timeline">
            {history.map((h) => (
              <li key={h.id}>
                <div className="timeline-meta">{new Date(h.created_at).toLocaleString()} — {h.actor_name}</div>
                <div><span className={`badge ${statusClass[h.status]}`}>{h.status}</span></div>
                {h.note && <p>{h.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link to={user.role === 'admin' ? '/admin' : '/'} className="btn btn-secondary">← Back</Link>
    </div>
  );
}
