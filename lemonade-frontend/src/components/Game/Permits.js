import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { getGame, updateGame } from '../../services/api';
import {
  PERMIT_COSTS,
  LOCATION_INFO,
  LOCATION_TRAFFIC,
  PRICE_SENSITIVITY,
  QUALITY_SENSITIVITY
} from '../../constants/gameMultipliers';
import '../../styles/Permits.css';

function Permits() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const loadGame = useCallback(async () => {
    const gameId = localStorage.getItem('currentGameId');

    if (!gameId) {
      navigate('/game-select');
      return;
    }

    try {
      const response = await getGame(gameId);
      setGameData(response.data);
    } catch (error) {
      console.error('Failed to load game:', error);
      alert('Failed to load game');
      navigate('/game-select');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  const handlePurchasePermit = async (locationKey) => {
    const cost = PERMIT_COSTS[locationKey];
    const currentMoney = gameData?.game_data?.money || 0;

    if (cost > currentMoney) {
      alert('Not enough money to purchase this permit!');
      return;
    }

    setPurchasing(true);
    try {
      const newGameData = { ...gameData.game_data };

      // Deduct money
      newGameData.money -= cost;

      // Add or increment permit count
      if (!newGameData.permits) {
        newGameData.permits = {};
      }
      if (!newGameData.permits[locationKey]) {
        newGameData.permits[locationKey] = {
          count: 0,
          first_purchased_day: newGameData.day_count,
          total_spent: 0
        };
      }
      newGameData.permits[locationKey].count += 1;
      newGameData.permits[locationKey].total_spent += cost;
      newGameData.permits[locationKey].last_purchased_day = newGameData.day_count;

      // Update statistics
      if (!newGameData.statistics.total_spent_permits) {
        newGameData.statistics.total_spent_permits = 0;
      }
      newGameData.statistics.total_spent_permits += cost;

      // Update game on server
      await updateGame(gameData.game_id, newGameData);

      // Reload game data
      await loadGame();

      alert(`Successfully purchased ${LOCATION_INFO[locationKey].name} permit for $${cost.toFixed(2)}!`);
    } catch (error) {
      console.error('Failed to purchase permit:', error);
      alert('Failed to purchase permit. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="permits-container">
        <div className="loading">Loading permits...</div>
      </div>
    );
  }

  const currentMoney = gameData?.game_data?.money || 0;
  const ownedPermits = gameData?.game_data?.permits || {};

  // Get all locations except driveway
  const availableLocations = Object.keys(LOCATION_INFO).filter(
    key => LOCATION_INFO[key].permit_required
  );

  return (
    <div className="permits-container">
      <div className="permits-header">
        <div>
          <h1>📋 City Permits Office</h1>
          <p className="subtitle">Purchase permits to sell at premium locations</p>
          <p className="money-display">Available: ${currentMoney.toFixed(2)}</p>
        </div>
        <button onClick={() => navigate('/home-office')} className="btn-back">
          Back to Home Office
        </button>
      </div>

      <div className="permits-content">
        {/* Free Location (Driveway) */}
        <div className="info-card">
          <h2>🏠 Free Location</h2>
          <div className="location-card free-location">
            <div className="location-header">
              <h3>{LOCATION_INFO.location_driveway.name}</h3>
              <span className="location-badge free">Always Available</span>
            </div>
            <p className="location-description">{LOCATION_INFO.location_driveway.description}</p>
          </div>
        </div>

        {/* Permit Locations */}
        <div className="info-card">
          <h2>🎫 Available Permits</h2>
          <p className="permits-note">💡 Traffic patterns vary by day of week and special events. Check the news for big event days!</p>
          <div className="permits-grid">
            {availableLocations.map(locationKey => {
              const location = LOCATION_INFO[locationKey];
              const cost = PERMIT_COSTS[locationKey];
              const permitData = ownedPermits[locationKey];
              const owned = !!permitData;
              const canAfford = cost <= currentMoney;

              return (
                <div key={locationKey} className={`location-card ${owned ? 'owned' : ''}`}>
                  <div className="location-header">
                    <h3>{location.name}</h3>
                    {owned ? (
                      <span className="location-badge owned">Owned ({permitData.count})</span>
                    ) : (
                      <span className="location-badge price">${cost.toFixed(2)}</span>
                    )}
                  </div>

                  <p className="location-description">{location.description}</p>

                  {owned && (
                    <div className="permit-info">
                      <p className="owned-info">
                        ✓ First purchased on Day {permitData.first_purchased_day}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handlePurchasePermit(locationKey)}
                    disabled={!canAfford || purchasing}
                    className="btn-purchase-permit"
                  >
                    {!canAfford ? 'Cannot Afford' : purchasing ? 'Processing...' : `Purchase for $${cost.toFixed(2)}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Permits;
