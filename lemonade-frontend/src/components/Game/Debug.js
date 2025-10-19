import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGame, updateGame } from '../../services/api';
import {
  LOCATION_INFO,
  getLocationTraffic,
  BASE_LOCATION_TRAFFIC,
  DAY_OF_WEEK_MULTIPLIERS,
  EVENT_MULTIPLIERS
} from '../../constants/gameMultipliers';
import { formatEventNews } from '../../utils/eventGenerator';
import { generateDailyCustomers } from '../../utils/customerGenerator';
import '../../styles/Debug.css';

function Debug() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(3); // March
  const [moneyAmount, setMoneyAmount] = useState(100);
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

  const handleAddMoney = async () => {
    if (!moneyAmount || moneyAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const newGameData = { ...gameData.game_data };
      newGameData.money = (newGameData.money || 0) + moneyAmount;

      await updateGame(gameData.game_id, newGameData);
      await loadGame();
      alert(`Added $${moneyAmount.toFixed(2)} to wallet!`);
    } catch (error) {
      console.error('Failed to add money:', error);
      alert('Failed to add money. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="debug-container">
        <div className="loading">Loading debug data...</div>
      </div>
    );
  }

  const data = gameData?.game_data || {};
  const events = data.events || {};
  const currentMonth = selectedMonth;
  const currentDayName = data.day_name || 'Monday';
  const currentDay = data.day_num || 20;

  // Get all events for the selected month
  const monthEvents = {
    convention: events.convention_events?.filter(e => e.month === currentMonth) || [],
    stadium: events.stadium_events?.filter(e => e.month === currentMonth) || [],
    downtown: events.downtown_events?.filter(e => e.month === currentMonth) || []
  };

  // Get owned permits
  const ownedPermits = data.permits || {};
  const permitsList = Object.keys(ownedPermits).map(key => ({
    key,
    name: LOCATION_INFO[key]?.name || key,
    ...ownedPermits[key]
  }));

  // Calculate current multipliers for each location
  const locations = Object.keys(LOCATION_INFO);
  const currentMultipliers = locations.map(locationKey => {
    const traffic = getLocationTraffic(
      locationKey,
      currentDayName,
      events,
      Math.floor(currentMonth),
      currentDay
    );

    return {
      key: locationKey,
      name: LOCATION_INFO[locationKey].name,
      baseTraffic: BASE_LOCATION_TRAFFIC[locationKey],
      dayMultiplier: DAY_OF_WEEK_MULTIPLIERS[locationKey]?.[currentDayName] || 1.0,
      currentTraffic: traffic
    };
  });

  const months = [
    { num: 3, name: 'March' },
    { num: 4, name: 'April' },
    { num: 5, name: 'May' },
    { num: 6, name: 'June' },
    { num: 7, name: 'July' },
    { num: 8, name: 'August' },
    { num: 9, name: 'September' },
    { num: 10, name: 'October' }
  ];

  return (
    <div className="debug-container">
      <div className="debug-header">
        <div>
          <h1>🐛 Debug Window</h1>
          <p className="subtitle">Game development & testing information</p>
        </div>
        <button onClick={() => navigate('/home-office')} className="btn-back">
          Back to Home Office
        </button>
      </div>

      <div className="debug-content">
        {/* Current Game State */}
        <div className="debug-card">
          <h2>📅 Current Game State</h2>
          <div className="debug-info">
            <div className="info-row">
              <span className="label">Day:</span>
              <span className="value">{data.day_count} ({data.day_name})</span>
            </div>
            <div className="info-row">
              <span className="label">Date:</span>
              <span className="value">{data.month_name} {data.day_num}, 2024</span>
            </div>
            <div className="info-row">
              <span className="label">Money:</span>
              <span className="value">${data.money?.toFixed(2)}</span>
            </div>
          </div>

          {/* Add Money Tool */}
          <div className="debug-tool">
            <h3>💰 Add Money</h3>
            <div className="money-tool">
              <input
                type="number"
                value={moneyAmount}
                onChange={(e) => setMoneyAmount(parseFloat(e.target.value) || 0)}
                min="0"
                step="10"
                className="money-input"
              />
              <button onClick={handleAddMoney} className="btn-add-money">
                Add ${moneyAmount.toFixed(2)}
              </button>
            </div>
            <div className="quick-money-buttons">
              <button onClick={() => { setMoneyAmount(100); }} className="btn-quick-money">$100</button>
              <button onClick={() => { setMoneyAmount(500); }} className="btn-quick-money">$500</button>
              <button onClick={() => { setMoneyAmount(1000); }} className="btn-quick-money">$1000</button>
            </div>
          </div>
        </div>

        {/* Owned Permits */}
        <div className="debug-card">
          <h2>📋 Owned Permits</h2>
          {permitsList.length > 0 ? (
            <div className="permits-list">
              <div className="permit-item">
                <span className="permit-name">Your Driveway</span>
                <span className="permit-status free">Free (Always Available)</span>
              </div>
              {permitsList.map(permit => (
                <div key={permit.key} className="permit-item">
                  <span className="permit-name">{permit.name}</span>
                  <span className="permit-status owned">
                    Day {permit.purchased_on_day} - ${permit.cost?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">Only Driveway available (No permits purchased)</p>
          )}
        </div>

        {/* Current Traffic Multipliers */}
        <div className="debug-card">
          <h2>📊 Traffic Multipliers (Current: {currentDayName})</h2>
          <div className="multipliers-grid">
            {currentMultipliers.map(loc => (
              <div key={loc.key} className="multiplier-card">
                <h3>{loc.name}</h3>
                <div className="multiplier-breakdown">
                  <div className="mult-row">
                    <span>Base:</span>
                    <span>{loc.baseTraffic.toFixed(2)}x</span>
                  </div>
                  <div className="mult-row">
                    <span>{currentDayName}:</span>
                    <span>{loc.dayMultiplier.toFixed(2)}x</span>
                  </div>
                  <div className="mult-row total">
                    <span>Current:</span>
                    <span className="highlight">{loc.currentTraffic.toFixed(2)}x</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Calendar */}
        <div className="debug-card">
          <h2>📆 Event Calendar</h2>
          <div className="month-selector">
            {months.map(month => (
              <button
                key={month.num}
                className={`month-btn ${selectedMonth === month.num ? 'active' : ''}`}
                onClick={() => setSelectedMonth(month.num)}
              >
                {month.name}
              </button>
            ))}
          </div>

          <div className="events-section">
            {/* Convention Center Events */}
            <div className="event-category">
              <h3>🏢 Convention Center Events</h3>
              {monthEvents.convention.length > 0 ? (
                <ul className="event-list">
                  {monthEvents.convention.map((event, idx) => (
                    <li key={idx} className="event-item convention">
                      <span className="event-date">Day {event.day}</span>
                      <span className="event-name">{event.name}</span>
                      <span className="event-mult">5x traffic</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-events">No events this month</p>
              )}
            </div>

            {/* Stadium Events */}
            <div className="event-category">
              <h3>🏟️ Stadium Events</h3>
              {monthEvents.stadium.length > 0 ? (
                <ul className="event-list">
                  {monthEvents.stadium.map((event, idx) => (
                    <li key={idx} className="event-item stadium">
                      <span className="event-date">Day {event.day}</span>
                      <span className="event-name">{event.name}</span>
                      <span className="event-mult">15x traffic</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-events">No events this month</p>
              )}
            </div>

            {/* Downtown Park Events */}
            <div className="event-category">
              <h3>🌳 Downtown Park Events</h3>
              {monthEvents.downtown.length > 0 ? (
                <ul className="event-list">
                  {monthEvents.downtown.map((event, idx) => (
                    <li key={idx} className="event-item downtown">
                      <span className="event-date">Day {event.day}</span>
                      <span className="event-name">{event.name}</span>
                      <span className="event-mult">5x traffic</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-events">No events this month</p>
              )}
            </div>
          </div>
        </div>

        {/* Event Multipliers Reference */}
        <div className="debug-card">
          <h2>🎯 Event Multiplier Reference</h2>
          <div className="reference-grid">
            <div className="ref-item">
              <strong>Convention Center:</strong>
              <p>Base 0.5x × Event 10x = <span className="highlight">5x traffic</span></p>
              <p className="small">3-day events in April-July</p>
            </div>
            <div className="ref-item">
              <strong>Stadium:</strong>
              <p>Base 0.5x × Event 30x = <span className="highlight">15x traffic</span></p>
              <p className="small">2-day games in May-October (4 per month)</p>
            </div>
            <div className="ref-item">
              <strong>Downtown Park:</strong>
              <p>Base 1.0x × Event 5x = <span className="highlight">5x traffic</span></p>
              <p className="small">Weekly events in March-October</p>
            </div>
            <div className="ref-item">
              <strong>Flea Market:</strong>
              <p>Base 0.3x × Sunday 10x = <span className="highlight">3x traffic</span></p>
              <p className="small">Only busy on Sundays</p>
            </div>
            <div className="ref-item">
              <strong>Farmer's Market:</strong>
              <p>Base 1.0x × Saturday 4x = <span className="highlight">4x traffic</span></p>
              <p className="small">Only busy on Saturdays</p>
            </div>
            <div className="ref-item">
              <strong>Local Park:</strong>
              <p>Base 1.5x × Weekend 2.5x = <span className="highlight">3.75x traffic</span></p>
              <p className="small">Busy on weekends</p>
            </div>
          </div>
        </div>

        {/* Customer Debug Info */}
        <div className="debug-card">
          <h2>👥 Today's Customers</h2>
          <p className="subtitle">Generated customers for each location on the current day</p>
          {(() => {
            const dailyCustomers = generateDailyCustomers(data);
            return (
              <div className="customers-section">
                {Object.keys(dailyCustomers).map(locationKey => {
                  const locationData = dailyCustomers[locationKey];
                  const locationInfo = LOCATION_INFO[locationKey];

                  return (
                    <div key={locationKey} className="customer-location-card">
                      <h3>{locationInfo.name}</h3>
                      <div className="customer-stats">
                        <div className="stat-row">
                          <span className="stat-label">Base Customers:</span>
                          <span className="stat-value">{locationData.base_count}</span>
                        </div>
                        <div className="stat-row">
                          <span className="stat-label">Traffic Multiplier:</span>
                          <span className="stat-value">{locationData.traffic_multiplier.toFixed(2)}x</span>
                        </div>
                        <div className="stat-row highlight">
                          <span className="stat-label">Total Customers:</span>
                          <span className="stat-value">{locationData.total_count}</span>
                        </div>
                        <div className="stat-row">
                          <span className="stat-label">Temp Modifier:</span>
                          <span className="stat-value">
                            Thirst {locationData.temp_modifier.thirst_modifier >= 0 ? '+' : ''}
                            {locationData.temp_modifier.thirst_modifier.toFixed(2)},
                            Quality {locationData.temp_modifier.quality_min_increase >= 0 ? '+' : ''}
                            {locationData.temp_modifier.quality_min_increase}
                          </span>
                        </div>
                        <div className="stat-row">
                          <span className="stat-label">Weather Modifier:</span>
                          <span className="stat-value">
                            Thirst {locationData.weather_thirst_mod >= 0 ? '+' : ''}
                            {locationData.weather_thirst_mod.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Sample Customers */}
                      <div className="sample-customers">
                        <h4>Sample Customers (first 5):</h4>
                        {locationData.customers.slice(0, 5).map((customer, idx) => (
                          <div key={customer.id} className="customer-card">
                            <div className="customer-row">
                              <span className="label">Customer #{idx + 1}</span>
                            </div>
                            <div className="customer-row">
                              <span className="label">Thirst Level:</span>
                              <span className="value">{customer.thirst_level}</span>
                            </div>
                            <div className="customer-row">
                              <span className="label">Quality Expectation:</span>
                              <span className="value">{customer.desired_quality}/100</span>
                            </div>
                            <div className="customer-row">
                              <span className="label">Max Price/oz:</span>
                              <span className="value">${customer.max_price_per_oz.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                        {locationData.customers.length > 5 && (
                          <p className="more-customers">
                            ... and {locationData.customers.length - 5} more customers
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Weather Forecast (Full Year) */}
        <div className="debug-panel">
          <h2>🌤️ Full Year Weather Forecast</h2>
          <p className="subtitle">Pre-generated weather for the entire game (March 20 - October 31)</p>
          <div className="weather-forecast-section">
            {(() => {
              const weatherData = data.weather?.weather_data || [];
              const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

              return (
                <div className="weather-table-container">
                  <table className="weather-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Temp (°F)</th>
                        <th>Weather</th>
                        <th>Heatwave</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weatherData.map((dayWeather, index) => (
                        <tr
                          key={index}
                          className={dayWeather.month === data.month && dayWeather.day === data.day_num ? 'current-day' : ''}
                        >
                          <td>{monthNames[dayWeather.month]} {dayWeather.day}</td>
                          <td>{dayWeather.temp}°F</td>
                          <td>
                            {dayWeather.weather?.icon} {dayWeather.weather?.name}
                          </td>
                          <td>{dayWeather.isHeatwave ? '🔥 Yes' : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {weatherData.length === 0 && (
                    <p className="no-data">No weather data generated. Reset the game to generate weather.</p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Debug;
