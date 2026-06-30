import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../api';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ email, password });
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
          <h1>Manage society maintenance with clarity</h1>
          <p>Track complaints, stay updated on progress, and keep everyone informed through a modern notice board.</p>
          <ul className="auth-features">
            <li>Raise complaints with photo attachments</li>
            <li>Full status history on every issue</li>
            <li>Email alerts for updates & notices</li>
          </ul>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="card auth-card">
          <h2>Welcome back</h2>
          <p className="muted">Sign in to your account</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </label>
            <button type="submit" className="btn btn-primary full-width" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="auth-footer">No account? <Link to="/register">Register as resident</Link></p>
          <p className="hint">Demo admin: admin@society.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
