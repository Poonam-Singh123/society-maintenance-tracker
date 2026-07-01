import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const statusClass = { Open: 'badge-open', 'In Progress': 'badge-progress', Resolved: 'badge-resolved' };
const priorityClass = { Low: 'priority-low', Medium: 'priority-medium', High: 'priority-high' };

export default function ResidentHome() {
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category: '', description: '', photo: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [cData, catData] = await Promise.all([api.getComplaints(), api.getCategories()]);
      setComplaints(cData.complaints);
      setCategories(catData.categories);
      if (catData.categories.length && !form.category) {
        setForm((f) => ({ ...f, category: catData.categories[0] }));
      }
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
      const fd = new FormData();
      fd.append('category', form.category);
      fd.append('description', form.description);
      if (form.photo) fd.append('photo', form.photo);
      await api.createComplaint(fd);
      setForm({ category: categories[0] || '', description: '', photo: null });
      e.target.reset();
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
        <h1>My Complaints</h1>
        <p>Report issues and track their progress in one place</p>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h2><span className="card-icon">📝</span> Raise a Complaint</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="full-width">
            Description
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the issue in detail..." required />
          </label>
          <label className="full-width file-input-wrap">
            📷 Photo (optional)
            <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, photo: e.target.files[0] })} />
          </label>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2><span className="card-icon">📋</span> Your Complaints</h2>
        {loading ? (
          <div className="loading" style={{ minHeight: '120px' }}><div className="spinner" /></div>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>No complaints yet. Submit your first one above!</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>ID</th><th>Category</th><th>Status</th><th>Priority</th><th>Created</th><th></th></tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td><strong>#{c.id}</strong></td>
                    <td>{c.category}</td>
                    <td><span className={`badge ${statusClass[c.status]}`}>{c.status}</span></td>
                    <td><span className={`badge ${priorityClass[c.priority]}`}>{c.priority}</span></td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td><Link to={`/complaints/${c.id}`} className="link-btn">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
