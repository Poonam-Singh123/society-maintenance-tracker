import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const statusClass = { Open: 'badge-open', 'In Progress': 'badge-progress', Resolved: 'badge-resolved' };
const priorityClass = { Low: 'priority-low', Medium: 'priority-medium', High: 'priority-high' };

export default function AdminHome() {
  const [dashboard, setDashboard] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: '', status: '', from: '', to: '' });
  const [overdueDays, setOverdueDays] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const [dash, comp, cat, settings] = await Promise.all([
        api.getDashboard(),
        api.getComplaints(params),
        api.getCategories(),
        api.getOverdueDays(),
      ]);
      setDashboard(dash);
      setComplaints(comp.complaints);
      setCategories(cat.categories);
      setOverdueDays(String(settings.overdueDays));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const applyFilters = (e) => {
    e.preventDefault();
    load();
  };

  const saveOverdueDays = async () => {
    try {
      await api.setOverdueDays(parseInt(overdueDays, 10));
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateStatus = async (id, status) => {
    const note = window.prompt('Optional note for this status change:') ?? '';
    try {
      await api.updateStatus(id, { status, note: note || undefined });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const updatePriority = async (id, priority) => {
    try {
      await api.updatePriority(id, { priority });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const flagOverdue = async (id) => {
    try {
      await api.flagOverdue(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of all society maintenance complaints</p>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      {dashboard && (
        <div className="stats-grid">
          <div className="stat-card"><span>Total Complaints</span><strong>{dashboard.total}</strong></div>
          <div className="stat-card overdue"><span>Overdue</span><strong>{dashboard.overdueCount}</strong></div>
          {Object.entries(dashboard.byStatus).map(([k, v]) => (
            <div key={k} className="stat-card"><span>{k}</span><strong>{v}</strong></div>
          ))}
        </div>
      )}

      {dashboard && (
        <div className="card">
          <h2><span className="card-icon">📊</span> By Category</h2>
          <div className="chip-row">
            {Object.entries(dashboard.byCategory).map(([k, v]) => (
              <span key={k} className="chip">{k}: {v}</span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2><span className="card-icon">⏱️</span> Overdue Threshold</h2>
        <div className="inline-form">
          <input type="number" min="1" value={overdueDays} onChange={(e) => setOverdueDays(e.target.value)} />
          <span className="muted">days</span>
          <button type="button" className="btn btn-secondary" onClick={saveOverdueDays}>Save Settings</button>
        </div>
      </div>

      <div className="card">
        <h2><span className="card-icon">🔧</span> All Complaints</h2>
        <form onSubmit={applyFilters} className="filter-row">
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
          <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          <button type="submit" className="btn btn-secondary">Filter</button>
        </form>

        {loading ? (
          <div className="loading" style={{ minHeight: '120px' }}><div className="spinner" /></div>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✨</div>
            <p>No complaints match your filters.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Resident</th><th>Category</th><th>Status</th><th>Priority</th><th>Overdue</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id} className={c.is_overdue ? 'row-overdue' : ''}>
                    <td><Link to={`/complaints/${c.id}`} className="link-btn">#{c.id}</Link></td>
                    <td>{c.resident_name}</td>
                    <td>{c.category}</td>
                    <td><span className={`badge ${statusClass[c.status]}`}>{c.status}</span></td>
                    <td>
                      <select value={c.priority} onChange={(e) => updatePriority(c.id, e.target.value)} disabled={c.status === 'Resolved'}>
                        <option>Low</option><option>Medium</option><option>High</option>
                      </select>
                    </td>
                    <td>{c.is_overdue ? <span className="badge badge-progress">Yes</span> : <span className="muted">No</span>}</td>
                    <td className="actions">
                      {c.status !== 'Resolved' && (
                        <>
                          {c.status !== 'Open' && <button type="button" className="btn btn-sm" onClick={() => updateStatus(c.id, 'Open')}>Open</button>}
                          {c.status !== 'In Progress' && <button type="button" className="btn btn-sm" onClick={() => updateStatus(c.id, 'In Progress')}>In Progress</button>}
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => updateStatus(c.id, 'Resolved')}>Resolve</button>
                          {!c.is_overdue && <button type="button" className="btn btn-sm btn-warning" onClick={() => flagOverdue(c.id)}>Flag Overdue</button>}
                        </>
                      )}
                    </td>
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
