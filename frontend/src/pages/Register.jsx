import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../api';

export default function Register() {
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.register(form);
      login(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-content">
          <h1>Join your society portal</h1>
          <p>Create a resident account to report maintenance issues and follow their progress in real time.</p>
          <ul className="auth-features">
            <li>Submit complaints in seconds</li>
            <li>Track status from Open to Resolved</li>
            <li>Never miss an important notice</li>
          </ul>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="card auth-card">
          <h2>Create account</h2>
          <p className="muted">Register as a resident</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <label>
              Full Name
              <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
            </label>
            <label>
              Email
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </label>
            <label>
              Password
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" minLength={6} required />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
          <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
