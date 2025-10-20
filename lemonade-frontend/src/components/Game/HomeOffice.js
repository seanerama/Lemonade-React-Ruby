import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { getGame, updateGame } from '../../services/api';
import { lbsToGrams, formatSugarAmount, LOCATION_INFO, UPGRADES, calculateServeMultiplier, calculateMaxServed } from '../../constants/gameMultipliers';
import { generateAllEvents } from '../../utils/eventGenerator';
import { generateYearWeather, getWeatherForDay } from '../../utils/weatherGenerator';
import NewsFeed from './NewsFeed';
import WeatherForecast from './WeatherForecast';
import '../../styles/HomeOffice.css';

function HomeOffice() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
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
      console.log('Loaded game data:', response.data);
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

  const endGame = () => {
    localStorage.removeItem('currentGameId');
    navigate('/game-select');
  };

  const handleResetGame = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset this game? This will:\n' +
      '• Reset to Day 1\n' +
      '• Clear all inventory and permits\n' +
      '• Regenerate all events and weather\n' +
      '\nThis action cannot be undone!'
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      // Generate new events and weather for entire year
      const newEvents = generateAllEvents(2024);
      const heatwaves = newEvents.heatwave_events || [];
      const yearWeather = generateYearWeather(2024, heatwaves);

      // Get starting day weather (March 20)
      const startingDayWeather = yearWeather[0]; // First day is March 20

      // Create fresh game data
      const resetData = {
        money: 50.00,
        tip_jar: 0.00,
        day_count: 1,
        day_name: "Monday",
        month_name: "March",
        day_num: 20,
        month: 3,
        permits: {},
        events: newEvents,
        weather: {
          current_temp: startingDayWeather.temp,
          current_weather: startingDayWeather.weatherType,
          weather_data: yearWeather  // Store full year weather
        },
        inventory: {
          lemons: { normal: 0, sour: 0, sweet: 0 },
          sugar_lbs: 0.0,
          cups: { ten_oz: 0, sixteen_oz: 0, twentyfour_oz: 0 },
          containers: { one_gal: 0, five_gal: 0, barrel: 0, tanker: 0 },
          lemonade_batches: [],
          juicer_level: "hand"
        },
        upgrades: {
          glass_dispenser: false,
          cash_drawer: false,
          pos_system: false,
          frozen_machine: false,
          second_location: false
        },
        active_effects: {
          ad_campaign_active: false,
          ad_campaign_days_left: 0,
          ad_campaign_last_purchase_week: 0,
          second_location_uses_this_week: 0,
          second_location_week_reset_day: 0,
          sold_locations_today: []
        },
        reviews: {
          location_driveway: { rating: 0.0, count: 0 },
          location_localpark: { rating: 0.0, count: 0 },
          location_fleamarket: { rating: 0.0, count: 0 },
          location_downtownpark: { rating: 0.0, count: 0 },
          location_farmersmarket: { rating: 0.0, count: 0 },
          location_conventioncenter: { rating: 0.0, count: 0 },
          location_stadium: { rating: 0.0, count: 0 }
        },
        statistics: {
          total_spent_grocery: 0.0,
          total_spent_supplies: 0.0,
          total_spent_permits: 0.0,
          total_spent_ads: 0.0,
          total_earned: 0.0,
          total_earned_location: {
            location_driveway: 0.0,
            location_localpark: 0.0,
            location_fleamarket: 0.0,
            location_downtownpark: 0.0,
            location_farmersmarket: 0.0,
            location_conventioncenter: 0.0,
            location_stadium: 0.0
          },
          total_served: 0,
          total_served_location: {
            location_driveway: 0,
            location_localpark: 0,
            location_fleamarket: 0,
            location_downtownpark: 0,
            location_farmersmarket: 0,
            location_conventioncenter: 0,
            location_stadium: 0
          }
        }
      };

      await updateGame(gameData.game_id, resetData);
      await loadGame();
      alert('Game reset successfully!');
    } catch (error) {
      console.error('Failed to reset game:', error);
      alert('Failed to reset game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShutdownWeek = async () => {
    if (advancing) return;

    // Prompt user for number of days
    const daysInput = window.prompt(
      'How many days would you like to shutdown?\n\n' +
      'You will earn $2 per day.\n' +
      'Active effects (ad campaigns) will expire.',
      '7'
    );

    if (!daysInput) return; // User cancelled

    const numDays = parseInt(daysInput, 10);

    if (isNaN(numDays) || numDays < 1 || numDays > 365) {
      alert('Please enter a valid number of days between 1 and 365.');
      return;
    }

    const totalEarnings = numDays * 2;

    const confirmed = window.confirm(
      `Shutdown for ${numDays} day${numDays > 1 ? 's' : ''}?\n\n` +
      `• You will receive $${totalEarnings}\n` +
      `• ${numDays} day${numDays > 1 ? 's' : ''} will pass\n` +
      '• All lemonade batches will age\n' +
      '• Active effects (ad campaigns) will expire\n\n' +
      'This action cannot be undone!'
    );

    if (!confirmed) return;

    try {
      setAdvancing(true);
      const newGameData = { ...gameData.game_data };

      // Give player $2 per day
      newGameData.money += totalEarnings;

      // Move today's tips to savings first
      const tipJar = newGameData.tip_jar || 0;
      newGameData.tips_savings = (newGameData.tips_savings || 0) + tipJar;
      newGameData.tip_jar = 0;

      // Advance N days and apply compound interest
      for (let i = 0; i < numDays; i++) {
        // Apply daily interest to tips savings
        const currentSavings = newGameData.tips_savings || 0;
        const interest = calculateTipsInterest(currentSavings);
        newGameData.tips_savings = currentSavings + interest;

        newGameData.day_count += 1;

        // Calculate next day of week
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayIndex = daysOfWeek.indexOf(newGameData.day_name);
        newGameData.day_name = daysOfWeek[(currentDayIndex + 1) % 7];

        // Advance calendar day
        newGameData.day_num += 1;
        const currentMonth = Math.floor(newGameData.month);
        const daysInMonth = new Date(2024, currentMonth, 0).getDate();

        if (newGameData.day_num > daysInMonth) {
          newGameData.day_num = 1;
          newGameData.month += 1;

          if (newGameData.month > 10) {
            newGameData.month = 3; // Loop back to March
          }

          const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December'];
          newGameData.month_name = monthNames[Math.floor(newGameData.month)];
        }

        // Update weather from pre-generated data
        if (!newGameData.weather) newGameData.weather = {};
        const weatherData = newGameData.weather.weather_data || [];
        const todayWeather = getWeatherForDay(weatherData, Math.floor(newGameData.month), newGameData.day_num);

        if (todayWeather) {
          newGameData.weather.current_temp = todayWeather.temp;
          newGameData.weather.current_weather = todayWeather.weatherType;
        }
      }

      // Handle active effects expiration
      if (!newGameData.active_effects) {
        newGameData.active_effects = {};
      }

      newGameData.active_effects.ad_campaign_active = false;
      newGameData.active_effects.ad_campaign_days_left = 0;
      newGameData.active_effects.sold_locations_today = [];
      newGameData.active_effects.second_location_uses_this_week = 0;

      // Remove batches older than 3 days (lemonade goes bad)
      const MAX_BATCH_AGE = 3;
      if (newGameData.inventory?.lemonade_batches) {
        const beforeCount = newGameData.inventory.lemonade_batches.length;
        newGameData.inventory.lemonade_batches = newGameData.inventory.lemonade_batches.filter(batch => {
          const batchAge = newGameData.day_count - batch.created_on_day;
          return batchAge < MAX_BATCH_AGE;
        });
        const removedCount = beforeCount - newGameData.inventory.lemonade_batches.length;
        if (removedCount > 0) {
          console.log(`Removed ${removedCount} expired lemonade batch(es) during shutdown`);
        }
      }

      // Remove cider batches older than 3 days
      if (newGameData.inventory?.cider_batches) {
        const beforeCount = newGameData.inventory.cider_batches.length;
        newGameData.inventory.cider_batches = newGameData.inventory.cider_batches.filter(batch => {
          const batchAge = newGameData.day_count - batch.created_on_day;
          return batchAge < MAX_BATCH_AGE;
        });
        const removedCount = beforeCount - newGameData.inventory.cider_batches.length;
        if (removedCount > 0) {
          console.log(`Removed ${removedCount} expired cider batch(es) during shutdown`);
        }
      }

      // Update game
      await updateGame(gameData.game_id, newGameData);
      await loadGame();
      alert(`Shutdown complete! You received $${totalEarnings} for ${numDays} day${numDays > 1 ? 's' : ''}.`);
    } catch (error) {
      console.error('Failed to shutdown:', error);
      alert('Failed to shutdown. Please try again.');
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div className="home-office-container">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  const data = gameData?.game_data || {};

  // Apply daily interest to tips savings (2.5% per day)
  const calculateTipsInterest = (tipsSavings) => {
    return tipsSavings * 0.025; // 2.5% daily interest
  };

  const handleTransferTips = async () => {
    const tipsSavings = data.tips_savings || 0;

    if (tipsSavings <= 0) {
      alert('No money in tips savings account to transfer.');
      return;
    }

    const amountStr = window.prompt(
      `Tips Savings Account: $${tipsSavings.toFixed(2)}\n\n` +
      `How much would you like to transfer to your business account?`,
      tipsSavings.toFixed(2)
    );

    if (!amountStr) return; // User cancelled

    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (amount > tipsSavings) {
      alert(`You only have $${tipsSavings.toFixed(2)} in your tips savings account.`);
      return;
    }

    try {
      const newGameData = { ...data };
      newGameData.tips_savings = (newGameData.tips_savings || 0) - amount;
      newGameData.money += amount;

      await updateGame(gameData.game_id, newGameData);
      await loadGame();
      alert(`Successfully transferred $${amount.toFixed(2)} from tips savings to business account!`);
    } catch (error) {
      console.error('Failed to transfer tips:', error);
      alert('Failed to transfer. Please try again.');
    }
  };

  return (
    <div className="home-office-container">
      <div className="home-office-header">
        <div>
          <h1>{user?.name}'s Lemonade Stand</h1>
          <p className="game-id">Game: {gameData?.game_id}</p>
        </div>
        <button onClick={endGame} className="btn-end-game">
          End Game
        </button>
      </div>

      {/* Actions Bar - Horizontal at top */}
      <div className="actions-bar">
        <button onClick={() => navigate('/shopping')} className="btn-action">
          🛒 Go Shopping
        </button>
        <button onClick={() => navigate('/kitchen')} className="btn-action">
          🍋 Mix Lemonade
        </button>
        <button onClick={() => navigate('/permits')} className="btn-action">
          📋 City Permits
        </button>
        <button onClick={() => navigate('/choose-location')} className="btn-action">
          📍 Choose Location
        </button>
        <button
          onClick={handleShutdownWeek}
          disabled={advancing}
          className="btn-action shutdown-week-btn"
        >
          💤 {advancing ? 'Processing...' : 'Shutdown ($2/day)'}
        </button>
        <button onClick={() => navigate('/leaderboard')} className="btn-action leaderboard-btn">
          🏆 Leaderboard
        </button>
        <button onClick={() => navigate('/debug')} className="btn-action debug-btn">
          🐛 Debug
        </button>
        <button onClick={handleResetGame} className="btn-action reset-btn">
          🔄 Reset
        </button>
      </div>

      {/* News Feed - Full Width */}
      <div className="home-office-news">
        <NewsFeed gameData={gameData} />
      </div>

      {/* Weather Forecast - Full Width */}
      <div className="home-office-weather">
        <WeatherForecast gameData={gameData} />
      </div>

      <div className="home-office-content">
        <div className="info-panel">
          <h2>Game Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Business Money:</span>
              <span className="info-value money">${data.money?.toFixed(2)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Day:</span>
              <span className="info-value">{data.day_count} ({data.day_name})</span>
            </div>
            <div className="info-item">
              <span className="info-label">Date:</span>
              <span className="info-value">{data.month_name} {data.day_num}</span>
            </div>
          </div>

          {/* Tip Jar */}
          <div className="tip-jar-display">
            <div className="tip-jar-header">
              <h3>💰 Today's Tip Jar</h3>
            </div>
            <div className="tip-jar-amount">
              ${(data.tip_jar || 0).toFixed(2)}
            </div>
            <p className="tip-jar-note">Tips collected today (moved to savings at day end)</p>
          </div>

          {/* Tips Savings Account */}
          <div className="tips-savings-display">
            <div className="tips-savings-header">
              <h3>🏦 Tips Savings Account</h3>
              <span className="interest-rate">2.5% daily interest</span>
            </div>
            <div className="tips-savings-amount">
              ${(data.tips_savings || 0).toFixed(2)}
            </div>
            {(data.tips_savings || 0) > 0 && (
              <div className="interest-preview">
                <p>Tomorrow's interest: +${calculateTipsInterest(data.tips_savings || 0).toFixed(2)}</p>
                <p className="future-balance">Future balance: ${((data.tips_savings || 0) + calculateTipsInterest(data.tips_savings || 0)).toFixed(2)}</p>
              </div>
            )}
            <button
              onClick={handleTransferTips}
              disabled={!data.tips_savings || data.tips_savings <= 0}
              className="btn-transfer-tips"
            >
              💸 Transfer to Business
            </button>
            <p className="savings-note">⚠️ One-way transfer: Can't move money back to savings</p>
          </div>

          {/* Location Ratings */}
          <div className="location-ratings">
            <h3>⭐ Location Ratings</h3>
            <div className="ratings-list">
              {Object.keys(data.reviews || {}).map(locationKey => {
                const reviewData = data.reviews[locationKey];
                const locationInfo = LOCATION_INFO[locationKey];
                if (!reviewData || reviewData.count === 0) return null;

                return (
                  <div key={locationKey} className="rating-item">
                    <div className="rating-location">{locationInfo?.name || locationKey}</div>
                    <div className="rating-stars">
                      {'⭐'.repeat(Math.round(reviewData.rating))}
                    </div>
                    <div className="rating-value">
                      {reviewData.rating.toFixed(2)} ({reviewData.count} reviews)
                    </div>
                  </div>
                );
              })}
              {Object.values(data.reviews || {}).every(r => r.count === 0) && (
                <p className="no-ratings">No reviews yet. Start selling to get customer feedback!</p>
              )}
            </div>
          </div>
        </div>

        <div className="info-panel">
          <h2>Inventory</h2>
          <div className="inventory-section">
            <h3>Lemons</h3>
            <ul>
              <li>Normal: {data.inventory?.lemons?.normal || 0}</li>
              <li>Sour: {data.inventory?.lemons?.sour || 0}</li>
              <li>Sweet: {data.inventory?.lemons?.sweet || 0}</li>
            </ul>
          </div>
          <div className="inventory-section">
            <h3>Sugar</h3>
            <p>{(data.inventory?.sugar_lbs || 0).toFixed(1)} lbs ({Math.round(lbsToGrams(data.inventory?.sugar_lbs || 0))} g)</p>
          </div>
          {data.upgrades?.cider_maker && (
            <div className="inventory-section">
              <h3>🍎 Apples</h3>
              <p>{(data.inventory?.apples_lbs || 0).toFixed(1)} lbs</p>
            </div>
          )}
          <div className="inventory-section">
            <h3>Cups</h3>
            <ul>
              <li>10 oz: {data.inventory?.cups?.ten_oz || 0}</li>
              <li>16 oz: {data.inventory?.cups?.sixteen_oz || 0}</li>
              <li>24 oz: {data.inventory?.cups?.twentyfour_oz || 0}</li>
              {data.upgrades?.cider_maker && (
                <li>Mugs w/ Cinnamon: {data.inventory?.mugs_cinnamon || 0}</li>
              )}
            </ul>
          </div>
          <div className="inventory-section">
            <h3>Equipment</h3>
            <p>Juicer: {data.inventory?.juicer_level || 'none'}</p>
          </div>
          <div className="inventory-section">
            <h3>Batches</h3>
            <p>Lemonade: {data.inventory?.lemonade_batches?.length || 0}</p>
            {data.upgrades?.cider_maker && (
              <p>Cider: {data.inventory?.cider_batches?.length || 0}</p>
            )}
          </div>
          <div className="inventory-section">
            <h3>Permits Owned</h3>
            {data.permits && Object.keys(data.permits).length > 0 ? (
              <ul>
                <li>Driveway (Free) - ∞</li>
                {Object.keys(data.permits).map(locationKey => (
                  <li key={locationKey}>
                    {LOCATION_INFO[locationKey]?.name || locationKey} - {data.permits[locationKey].count}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Driveway only (Free)</p>
            )}
          </div>
          <div className="inventory-section">
            <h3>Upgrades</h3>
            {data.upgrades && Object.keys(data.upgrades).some(key => data.upgrades[key]) ? (
              <ul>
                {Object.keys(data.upgrades).map(upgradeKey => {
                  if (data.upgrades[upgradeKey] && UPGRADES[upgradeKey]) {
                    return (
                      <li key={upgradeKey}>✓ {UPGRADES[upgradeKey].name}</li>
                    );
                  }
                  return null;
                })}
              </ul>
            ) : (
              <p>No upgrades purchased</p>
            )}
            <p className="serve-capacity">
              Can serve: <strong>{calculateMaxServed(calculateServeMultiplier(data.upgrades || {}, data.active_effects || {}))}</strong> customers
            </p>
          </div>
        </div>

        {/* Lemonade Batches Panel */}
        {data.inventory?.lemonade_batches && data.inventory.lemonade_batches.length > 0 && (
          <div className="info-panel">
            <h2>Lemonade Inventory</h2>
            <div className="batches-summary">
              {data.inventory.lemonade_batches.map((batch, index) => (
                <div key={batch.id || index} className="batch-summary-card">
                  <div className="batch-summary-header">
                    <span className="batch-container">{batch.container_type.replace('_', ' ')}</span>
                    <span className="batch-quality-badge">Q: {batch.quality}/100</span>
                  </div>
                  <div className="batch-summary-details">
                    <div className="batch-detail">
                      <span className="detail-label">Volume:</span>
                      <span className="detail-value">{batch.remaining_oz} / {batch.capacity_oz} oz</span>
                    </div>
                    <div className="batch-detail">
                      <span className="detail-label">Day:</span>
                      <span className="detail-value">{batch.created_on_day}</span>
                    </div>
                    <div className="batch-detail">
                      <span className="detail-label">Uses:</span>
                      <span className="detail-value">{batch.container_uses || 1}/3</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeOffice;