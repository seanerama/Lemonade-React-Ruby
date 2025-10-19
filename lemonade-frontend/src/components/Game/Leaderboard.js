import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../../services/api';
import '../../styles/Leaderboard.css';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await getLeaderboard();
        setLeaderboard(response.data.leaderboard);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        alert('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="loading">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <button onClick={() => navigate('/home-office')} className="btn-back">
          ← Back to Home
        </button>
      </div>

      <div className="leaderboard-content">
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Total Revenue</th>
                <th>Current Money</th>
                <th>Days Played</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr key={entry.game_id} className={index < 3 ? `rank-${index + 1}` : ''}>
                  <td className="rank-cell">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </td>
                  <td className="player-cell">{entry.player_name}</td>
                  <td className="revenue-cell">${entry.total_revenue.toFixed(2)}</td>
                  <td className="money-cell">${entry.money.toFixed(2)}</td>
                  <td className="days-cell">{entry.day_count}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {leaderboard.length === 0 && (
            <div className="empty-leaderboard">
              <p>No games found yet!</p>
              <p>Be the first to start playing and earn revenue!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
