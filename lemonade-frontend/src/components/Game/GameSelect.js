import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { getPlayerGames, resetGame } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import '../../styles/GameSelect.css';

function GameSelect() {
  const { user, logout } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadGames = useCallback(async () => {
    if (!user?.username) return;

    try {
      const response = await getPlayerGames(user.username);
      console.log('Loaded games:', response.data.games);
      setGames(response.data.games);
      setError('');
    } catch (error) {
      console.error('Failed to load games:', error);
      setError('Failed to load game slots');
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const selectGame = (gameId) => {
    localStorage.setItem('currentGameId', gameId);
    navigate('/home-office');
  };

  const handleClearGame = async (e, gameId, slotNumber) => {
    e.stopPropagation(); // Prevent triggering the game selection

    const confirmed = window.confirm(
      `Are you sure you want to clear Game Slot ${slotNumber}?\n\n` +
      `This will completely reset the game and all progress will be lost. This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await resetGame(gameId);
        // Reload the games list after successful reset
        await loadGames();
      } catch (error) {
        console.error('Failed to reset game:', error);
        setError('Failed to clear game. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="game-select-container">
        <div className="loading">Loading your games...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-select-container">
        <div className="error-message">
          {error}
          <br />
          <button onClick={loadGames} style={{ marginTop: '20px', padding: '10px 20px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-select-container">
      <div className="game-select-header">
        <div>
          <h1>Welcome back, {user?.name}!</h1>
          <p className="subtitle">Select a game slot to continue</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
      
      <div className="game-slots">
        {games.map((game) => (
          <div 
            key={game.game_id} 
            className="game-slot"
            onClick={() => selectGame(game.game_id)}
          >
            <div className="slot-header">
              <h3>Game Slot {game.slot_number}</h3>
              <span className="game-id">{game.game_id}</span>
            </div>
            
            <div className="slot-info">
              <div className="info-row">
                <span className="label">Money:</span>
                <span className="value money">${game.money?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="info-row">
                <span className="label">Day:</span>
                <span className="value">{game.day_count || 1}</span>
              </div>
              <div className="info-row">
                <span className="label">Last Played:</span>
                <span className="value date">{formatDate(game.updated_at)}</span>
              </div>
            </div>
            
            <div className="slot-footer">
              <span className="play-text">Click to Play →</span>
              <button
                className="btn-clear-game"
                onClick={(e) => handleClearGame(e, game.game_id, game.slot_number)}
              >
                Clear Game
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameSelect;