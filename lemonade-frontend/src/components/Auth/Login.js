import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import '../../styles/Auth.css';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);

    const result = await login(formData.username, formData.password);

    if (result.success) {
      navigate('/game-select');
    } else {
      // Display detailed error message from backend
      let errorMessage = result.error || 'Login failed';

      // Make error messages more user-friendly
      if (errorMessage.includes('Invalid username')) {
        errorMessage = 'Username not found. Please check your username or register a new account.';
      } else if (errorMessage.includes('password')) {
        errorMessage = 'Incorrect password. Please try again.';
      }

      setError(errorMessage);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="game-title">Finley's Fantastic Lemonade</h1>
        <h2>Welcome Back!</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <span className="link" onClick={() => navigate('/register')}>
            Register here
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;