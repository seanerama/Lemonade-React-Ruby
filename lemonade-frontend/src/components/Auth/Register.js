import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../services/api';
import '../../styles/Auth.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

    // Validation
    if (!formData.name || !formData.username || !formData.password) {
      setError('Name, username, and password are required');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await register(formData.name, formData.username, formData.email, formData.password);

      if (response.data.message) {
        alert(`Registration successful! Your game slots: ${response.data.player.game_slots.join(', ')}`);
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', err.response?.data);

      // Parse error messages from backend
      let errorMessage = 'Registration failed';

      if (err.response?.data?.errors) {
        // Backend returns array of error messages
        const errors = err.response.data.errors;
        if (Array.isArray(errors)) {
          errorMessage = errors.join('. ');
        } else {
          errorMessage = errors;
        }
      } else if (err.response?.data?.error) {
        // Single error message
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 422) {
        errorMessage = 'Validation failed - please check your information';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error - please try again later';
      } else if (!err.response) {
        errorMessage = 'Network error - please check your connection';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="game-title">Finley's Fantastic Lemonade</h1>
        <h2>Create Your Account</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username (letters, numbers, _ only)"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Email (Optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email (optional)"
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
              placeholder="At least 6 characters"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <span className="link" onClick={() => navigate('/login')}>
            Login here
          </span>
        </div>
      </div>
    </div>
  );
}

export default Register;