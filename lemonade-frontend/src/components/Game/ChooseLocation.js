import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGame } from '../../services/api';
import { LOCATION_INFO, getLocationTraffic } from '../../constants/gameMultipliers';
import { generateDailyCustomers } from '../../utils/customerGenerator';
import '../../styles/ChooseLocation.css';

function ChooseLocation() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const navigate = useNavigate();

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

  const handleSelectLocation = (locationKey) => {
    const data = gameData?.game_data || {};
    const activeEffects = data.active_effects || {};
    const upgrades = data.upgrades || {};
    const soldToday = activeEffects.sold_locations_today || [];

    // Check if this location was already sold today
    if (soldToday.includes(locationKey)) {
      alert('You already sold at this location today!');
      return;
    }

    // Check if trying to sell at second location
    if (soldToday.length >= 1) {
      if (!upgrades.second_location) {
        alert('You need the Second Location upgrade to sell at multiple locations per day!');
        return;
      }

      // Check weekly limit
      const usesThisWeek = activeEffects.second_location_uses_this_week || 0;
      if (usesThisWeek >= 2) {
        alert('You\'ve already used Second Location twice this week! Resets on Monday.');
        return;
      }
    }

    setSelectedLocation(locationKey);
  };

  const handleGoSell = () => {
    if (!selectedLocation) {
      alert('Please select a location first!');
      return;
    }

    // Store selected location and navigate to sell page
    localStorage.setItem('selectedLocation', selectedLocation);
    navigate('/sell');
  };

  if (loading) {
    return (
      <div className="choose-location-container">
        <div className="loading">Loading locations...</div>
      </div>
    );
  }

  const data = gameData?.game_data || {};
  const ownedPermits = data.permits || {};
  const dayName = data.day_name || 'Monday';
  const events = data.events || {};
  const month = Math.floor(data.month || 3);
  const day = data.day_num || 20;
  const temperature = data.weather?.current_temp || 80;
  const weatherType = data.weather?.current_weather || 'sunny';

  // Generate customer data for all locations
  const dailyCustomers = generateDailyCustomers(data);

  // Get available locations (driveway + owned permits)
  const availableLocations = ['location_driveway', ...Object.keys(ownedPermits).filter(
    key => ownedPermits[key].count > 0
  )];

  return (
    <div className="choose-location-container">
      <div className="choose-location-header">
        <div>
          <h1>📍 Choose Your Location</h1>
          <p className="subtitle">Select where you want to sell lemonade today</p>
          <div className="current-conditions">
            <span>🌡️ {temperature}°F</span>
            <span>{data.weather?.current_weather}</span>
            <span>📅 {dayName}, {data.month_name} {day}</span>
          </div>
        </div>
        <button onClick={() => navigate('/home-office')} className="btn-back">
          Back to Home Office
        </button>
      </div>

      <div className="locations-grid">
        {availableLocations.map(locationKey => {
          const location = LOCATION_INFO[locationKey];
          const customerData = dailyCustomers[locationKey];
          const traffic = getLocationTraffic(locationKey, dayName, events, month, day);
          const isSelected = selectedLocation === locationKey;

          return (
            <div
              key={locationKey}
              className={`location-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelectLocation(locationKey)}
            >
              <div className="location-card-header">
                <h3>{location.name}</h3>
                {isSelected && <span className="selected-badge">✓ Selected</span>}
              </div>

              <p className="location-description">{location.description}</p>

              <div className="location-stats">
                <div className="stat-item">
                  <span className="stat-label">Expected Customers:</span>
                  <span className="stat-value">{customerData?.total_count || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Traffic Multiplier:</span>
                  <span className="stat-value">{traffic.toFixed(2)}x</span>
                </div>
                {locationKey !== 'location_driveway' && (
                  <div className="stat-item">
                    <span className="stat-label">Permits Available:</span>
                    <span className="stat-value">{ownedPermits[locationKey]?.count || 0}</span>
                  </div>
                )}
              </div>

              <div className="customer-preview">
                <h4>Sample Customer Range:</h4>
                {customerData && customerData.customers.length > 0 && (
                  <>
                    <div className="preview-row">
                      <span>Thirst Level:</span>
                      <span>
                        {Math.min(...customerData.customers.map(c => c.thirst_level))} -
                        {Math.max(...customerData.customers.map(c => c.thirst_level))}
                      </span>
                    </div>
                    <div className="preview-row">
                      <span>Quality Expectations:</span>
                      <span>
                        {Math.min(...customerData.customers.map(c => c.desired_quality))} -
                        {Math.max(...customerData.customers.map(c => c.desired_quality))}
                      </span>
                    </div>
                    <div className="preview-row">
                      <span>Max Price/oz:</span>
                      <span>
                        ${Math.min(...customerData.customers.map(c => c.max_price_per_oz)).toFixed(2)} -
                        ${Math.max(...customerData.customers.map(c => c.max_price_per_oz)).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {availableLocations.length === 1 && (
        <div className="info-message">
          💡 Purchase more permits at the City Permits Office to unlock additional locations!
        </div>
      )}

      <div className="action-footer">
        <button
          onClick={handleGoSell}
          disabled={!selectedLocation}
          className="btn-go-sell"
        >
          {selectedLocation ? `🍋 Start Selling at ${LOCATION_INFO[selectedLocation].name}` : '🍋 Select a Location First'}
        </button>
      </div>
    </div>
  );
}

export default ChooseLocation;
