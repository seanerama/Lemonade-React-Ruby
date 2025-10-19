import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGame, updateGame } from '../../services/api';
import {
  LOCATION_INFO,
  CUP_SIZES,
  calculateServeMultiplier,
  calculateMaxServed
} from '../../constants/gameMultipliers';
import {
  generateDailyCustomers,
  determineCupSize,
  willCustomerBuy,
  willCustomerTipAdvanced,
  getRandomTip,
  generateReview
} from '../../utils/customerGenerator';
import '../../styles/Sell.css';

function Sell() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedBatches, setSelectedBatches] = useState([]); // Array of {id, type: 'lemonade'|'cider'}
  const [prices, setPrices] = useState({ small: 2.00, medium: 3.00, large: 4.50, cider: 3.50 });
  const [selling, setSelling] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [currentCustomerIndex, setCurrentCustomerIndex] = useState(0);
  const [salesData, setSalesData] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalTips: 0,
    reviews: [],
    cupsSold: { small: 0, medium: 0, large: 0, frozen: 0, cider: 0 },
    batchConsumption: {} // Track how much was consumed from each batch: { batchId: ozConsumed }
  });
  const salesDataRef = useRef(salesData); // Keep a ref to always have the latest salesData
  const [animationSpeed, setAnimationSpeed] = useState(1); // 1x, 2x, 5x, 10x, or 0 (instant)
  const [customerFeedback, setCustomerFeedback] = useState([]); // Array of recent customer feedback with emojis
  const [animatedCustomer, setAnimatedCustomer] = useState(null); // Current customer being animated {emoji, action}
  const navigate = useNavigate();

  // Keep ref in sync with state
  useEffect(() => {
    salesDataRef.current = salesData;
  }, [salesData]);

  const loadGame = useCallback(async () => {
    const gameId = localStorage.getItem('currentGameId');
    const locationKey = localStorage.getItem('selectedLocation');

    if (!gameId) {
      navigate('/game-select');
      return;
    }

    if (!locationKey) {
      navigate('/choose-location');
      return;
    }

    setSelectedLocation(locationKey);

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

  if (loading) {
    return (
      <div className="sell-container">
        <div className="loading">Setting up your stand...</div>
      </div>
    );
  }

  const data = gameData?.game_data || {};
  const location = LOCATION_INFO[selectedLocation];
  const dailyCustomers = generateDailyCustomers(data);
  const locationCustomers = dailyCustomers[selectedLocation];
  const lemonadeBatches = data.inventory?.lemonade_batches || [];
  const ciderBatches = data.inventory?.cider_batches || [];
  const customers = locationCustomers?.customers || [];
  const hasCiderMaker = data.upgrades?.cider_maker || false;
  const currentTemp = data.weather?.current_temp || 70;

  // Helper to toggle batch selection
  const toggleBatchSelection = (batchId, batchType) => {
    setSelectedBatches(prev => {
      const exists = prev.find(b => b.id === batchId);
      if (exists) {
        return prev.filter(b => b.id !== batchId);
      } else {
        return [...prev, { id: batchId, type: batchType }];
      }
    });
  };

  // Get actual batch objects from selected IDs with current remaining oz
  const getSelectedBatchObjects = () => {
    return selectedBatches.map(sb => {
      let batch;
      if (sb.type === 'lemonade') {
        batch = { ...lemonadeBatches.find(b => b.id === sb.id), type: 'lemonade' };
      } else {
        batch = { ...ciderBatches.find(b => b.id === sb.id), type: 'cider' };
      }

      // Adjust remaining_oz based on consumption so far (use ref to avoid stale closure)
      if (batch && batch.id) {
        const consumed = salesDataRef.current.batchConsumption[batch.id] || 0;
        batch.remaining_oz = Math.max(0, batch.remaining_oz - consumed);
        console.log(`Batch ${batch.id} check: original ${batch.remaining_oz + consumed}oz, consumed ${consumed}oz, remaining ${batch.remaining_oz}oz`);
      }

      return batch;
    }).filter(b => b && b.id); // Filter out any not found
  };

  // Calculate delay based on speed multiplier
  const getAnimationDelay = () => {
    if (animationSpeed === 0) return 0; // Instant
    return 100 / animationSpeed; // 100ms base: 1x=100ms, 2x=50ms, 5x=20ms, 10x=10ms
  };

  // Add customer feedback to the animation queue
  const addCustomerFeedback = (emoji, message, isPositive) => {
    const feedback = {
      id: Date.now() + Math.random(),
      emoji,
      message,
      isPositive,
      timestamp: Date.now()
    };
    setCustomerFeedback(prev => [...prev.slice(-4), feedback]); // Keep last 5

    // Trigger customer animation (skip if instant mode)
    if (animationSpeed !== 0) {
      setAnimatedCustomer({ emoji, action: isPositive ? 'buy' : 'leave' });
      setTimeout(() => setAnimatedCustomer(null), 1000 / animationSpeed);
    }
  };

  const handlePriceChange = (size, value) => {
    const price = parseFloat(value) || 0;
    setPrices(prev => ({ ...prev, [size]: price }));
  };

  const handleStartSelling = () => {
    if (selectedBatches.length === 0) {
      alert('Please select at least one batch to sell!');
      return;
    }

    // Check if we have lemonade batches selected
    const hasLemonade = selectedBatches.some(b => b.type === 'lemonade');
    const hasCider = selectedBatches.some(b => b.type === 'cider');

    if (hasLemonade && (prices.small <= 0 || prices.medium <= 0 || prices.large <= 0)) {
      alert('Please set valid prices for all lemonade cup sizes!');
      return;
    }
    if (hasCider && prices.cider <= 0) {
      alert('Please set a valid price for cider!');
      return;
    }

    // Reset sales data
    setSalesData({
      totalSales: 0,
      totalRevenue: 0,
      totalTips: 0,
      reviews: [],
      cupsSold: { small: 0, medium: 0, large: 0, frozen: 0, cider: 0 },
      batchConsumption: {}
    });
    setCustomerFeedback([]);
    setSelling(true);
    setCurrentCustomerIndex(0);

    // Start serving on next tick to ensure state is updated
    setTimeout(() => serveNextCustomer(0), 0);
  };

  const serveNextCustomer = (index) => {
    const upgrades = data.upgrades || {};
    const activeEffects = data.active_effects || {};
    const serveMultiplier = calculateServeMultiplier(upgrades, activeEffects);
    const maxServed = calculateMaxServed(serveMultiplier);

    // Check if we've processed enough customers (whether they bought or not)
    if (index >= maxServed) {
      finishSelling();
      return;
    }

    if (index >= customers.length) {
      finishSelling();
      return;
    }

    const customer = customers[index];
    const selectedBatchObjects = getSelectedBatchObjects();

    // Check if we have any batches left
    if (selectedBatchObjects.every(b => b.remaining_oz <= 0)) {
      alert('All batches are empty! Ending sales.');
      finishSelling();
      return;
    }

    // Determine what the customer wants (cider preference in cold weather)
    const hasCiderBatch = selectedBatchObjects.some(b => b.type === 'cider' && b.remaining_oz >= 8);
    const hasLemonadeBatch = selectedBatchObjects.some(b => b.type === 'lemonade' && b.remaining_oz > 0);

    let prefersCider = false;
    if (hasCiderBatch && currentTemp < 60) {
      // In cold weather, 70% chance to prefer cider if available
      prefersCider = Math.random() < 0.7;
    } else if (hasCiderBatch && currentTemp < 70) {
      // In mild weather, 30% chance to prefer cider
      prefersCider = Math.random() < 0.3;
    }

    // Try to serve cider if preferred/available
    if (prefersCider && hasCiderBatch) {
      return serveCider(index, customer, selectedBatchObjects);
    }

    // Try to serve lemonade if available
    if (hasLemonadeBatch) {
      return serveLemonade(index, customer, selectedBatchObjects, upgrades);
    }

    // If only cider available (and not preferred), try cider anyway
    if (hasCiderBatch) {
      return serveCider(index, customer, selectedBatchObjects);
    }

    // No product available
    alert('No batches with enough product! Ending sales.');
    finishSelling();
  };

  const serveCider = (index, customer, selectedBatchObjects) => {
    const basePrice = prices.cider;

    // Temperature-based pricing bonus for cider
    let ciderMultiplier = 1.0;
    if (currentTemp < 50) {
      ciderMultiplier = 2.0;
    } else if (currentTemp < 60) {
      ciderMultiplier = 1.5;
    }

    // Apply demand multiplier
    const adjustedMaxPrice = customer.max_price_per_oz * ciderMultiplier;
    const pricePerOz = basePrice / 8;

    if (pricePerOz > adjustedMaxPrice) {
      // Customer doesn't buy
      addCustomerFeedback('👎', 'Too expensive!', false);
      setTimeout(() => {
        setCurrentCustomerIndex(index + 1);
        serveNextCustomer(index + 1);
      }, getAnimationDelay());
      return;
    }

    // Find a cider batch with enough remaining
    const batch = selectedBatchObjects.find(b => b.type === 'cider' && b.remaining_oz >= 8);
    if (!batch) {
      // Try lemonade instead
      const hasLemonade = selectedBatchObjects.some(b => b.type === 'lemonade' && b.remaining_oz > 0);
      if (hasLemonade) {
        return serveLemonade(index, customer, selectedBatchObjects, data.upgrades || {});
      }
      // No product left
      setTimeout(() => {
        setCurrentCustomerIndex(index + 1);
        serveNextCustomer(index + 1);
      }, getAnimationDelay());
      return;
    }

    // Serve cider
    let tipAmount = 0;
    let review = null;

    if (currentTemp < 60) {
      if (Math.random() < 0.6) tipAmount = getRandomTip();
      if (Math.random() < 0.4) {
        review = { stars: 5, text: "Perfect warm cider on a cold day!" };
      }
    } else {
      if (Math.random() < 0.3) tipAmount = getRandomTip();
    }

    // Add visual feedback
    if (review) {
      addCustomerFeedback('⭐', 'Love it! 5 stars!', true);
    } else if (tipAmount > 0) {
      addCustomerFeedback('💵', `Tipped $${tipAmount.toFixed(2)}!`, true);
    } else {
      addCustomerFeedback('🍎', 'Bought cider', true);
    }

    setSalesData(prev => {
      const newData = {
        totalSales: prev.totalSales + 1,
        totalRevenue: prev.totalRevenue + basePrice,
        totalTips: prev.totalTips + tipAmount,
        reviews: review ? [...prev.reviews, review] : prev.reviews,
        cupsSold: {
          ...prev.cupsSold,
          cider: prev.cupsSold.cider + 1
        },
        batchConsumption: {
          ...prev.batchConsumption,
          [batch.id]: (prev.batchConsumption[batch.id] || 0) + 8
        }
      };
      console.log('Cider sale:', { basePrice, tipAmount, batchId: batch.id });
      console.log('Updated salesData:', newData);
      return newData;
    });

    setTimeout(() => {
      setCurrentCustomerIndex(index + 1);
      serveNextCustomer(index + 1);
    }, getAnimationDelay());
  };

  const serveLemonade = (index, customer, selectedBatchObjects, upgrades) => {
    const hasFrozenMachine = upgrades.frozen_machine;
    const wantsFrozen = hasFrozenMachine && Math.random() < 0.2;

    let cupSize, cupInfo, pricePerOz, salePrice;

    if (wantsFrozen) {
      cupSize = 'frozen';
      cupInfo = { name: '20 oz Frozen', size_oz: 20 };
      salePrice = prices.medium * 2;
      pricePerOz = salePrice / 20;
    } else {
      cupSize = determineCupSize(customer);
      cupInfo = CUP_SIZES[cupSize];
      pricePerOz = prices[cupSize] / cupInfo.size_oz;
      salePrice = prices[cupSize];
    }

    if (!willCustomerBuy(customer, pricePerOz)) {
      addCustomerFeedback('👎', 'Too pricey!', false);
      setTimeout(() => {
        setCurrentCustomerIndex(index + 1);
        serveNextCustomer(index + 1);
      }, getAnimationDelay());
      return;
    }

    // Find a lemonade batch with enough oz
    const batch = selectedBatchObjects.find(b => b.type === 'lemonade' && b.remaining_oz >= cupInfo.size_oz);

    if (!batch) {
      // Try cider as fallback if available
      const hasCider = selectedBatchObjects.some(b => b.type === 'cider' && b.remaining_oz >= 8);
      if (hasCider) {
        return serveCider(index, customer, selectedBatchObjects);
      }
      // No products available, skip to next customer
      setTimeout(() => {
        setCurrentCustomerIndex(index + 1);
        serveNextCustomer(index + 1);
      }, getAnimationDelay());
      return;
    }

    let tipAmount = 0;
    let review = null;

    if (wantsFrozen) {
      if (Math.random() < 0.5) {
        review = { stars: 5, text: "The frozen lemonade was amazing! So refreshing!" };
      }
      tipAmount = getRandomTip();
    } else {
      if (willCustomerTipAdvanced(customer, batch.quality, cupSize)) {
        tipAmount = getRandomTip();
      }
      review = generateReview(customer, batch.quality);
    }

    // Add visual feedback
    if (wantsFrozen) {
      addCustomerFeedback('🧊', 'Frozen lemonade!', true);
    } else if (review && review.stars >= 4) {
      addCustomerFeedback('⭐', `${review.stars} stars!`, true);
    } else if (tipAmount > 0) {
      addCustomerFeedback('💵', `Tipped $${tipAmount.toFixed(2)}!`, true);
    } else {
      addCustomerFeedback('🍋', 'Bought lemonade', true);
    }

    setSalesData(prev => {
      const newData = {
        totalSales: prev.totalSales + 1,
        totalRevenue: prev.totalRevenue + salePrice,
        totalTips: prev.totalTips + tipAmount,
        reviews: review ? [...prev.reviews, review] : prev.reviews,
        cupsSold: {
          ...prev.cupsSold,
          [cupSize]: prev.cupsSold[cupSize] + 1
        },
        batchConsumption: {
          ...prev.batchConsumption,
          [batch.id]: (prev.batchConsumption[batch.id] || 0) + cupInfo.size_oz
        }
      };
      console.log('Lemonade sale:', { cupSize, salePrice, tipAmount, ozConsumed: cupInfo.size_oz, batchId: batch.id });
      console.log('Updated salesData:', newData);
      return newData;
    });

    setTimeout(() => {
      setCurrentCustomerIndex(index + 1);
      serveNextCustomer(index + 1);
    }, getAnimationDelay());
  };

  // Check if day should advance (no second location OR already sold at 2 locations)
  const shouldAdvanceDay = () => {
    const hasSecondLocation = data.upgrades?.second_location || false;
    const locationsSoldToday = data.active_effects?.sold_locations_today || [];

    // If no second location upgrade, always advance
    if (!hasSecondLocation) return true;

    // If has second location and already sold at 2 locations, advance
    return locationsSoldToday.length >= 2;
  };

  // Handle advancing to next day
  const advanceDay = async (currentData) => {
    const updatedData = { ...currentData };

    // Move tip jar to savings and apply 2.5% interest
    const tipJar = updatedData.tip_jar || 0;
    const currentSavings = updatedData.tips_savings || 0;
    const interest = currentSavings * 0.025; // 2.5% daily interest

    updatedData.tips_savings = currentSavings + interest + tipJar;
    updatedData.tip_jar = 0;

    // Clear daily effects
    updatedData.active_effects.sold_locations_today = [];

    // Decrement ad campaign
    if (updatedData.active_effects.ad_campaign_active) {
      updatedData.active_effects.ad_campaign_days_left -= 1;
      if (updatedData.active_effects.ad_campaign_days_left <= 0) {
        updatedData.active_effects.ad_campaign_active = false;
        updatedData.active_effects.ad_campaign_days_left = 0;
      }
    }

    // Advance day count
    updatedData.day_count += 1;

    // Remove batches older than 3 days (lemonade goes bad)
    const MAX_BATCH_AGE = 3;
    if (updatedData.inventory?.lemonade_batches) {
      const beforeCount = updatedData.inventory.lemonade_batches.length;
      updatedData.inventory.lemonade_batches = updatedData.inventory.lemonade_batches.filter(batch => {
        const batchAge = updatedData.day_count - batch.created_on_day;
        return batchAge < MAX_BATCH_AGE;
      });
      const removedCount = beforeCount - updatedData.inventory.lemonade_batches.length;
      if (removedCount > 0) {
        console.log(`Removed ${removedCount} expired lemonade batch(es)`);
      }
    }

    // Remove cider batches older than 3 days
    if (updatedData.inventory?.cider_batches) {
      const beforeCount = updatedData.inventory.cider_batches.length;
      updatedData.inventory.cider_batches = updatedData.inventory.cider_batches.filter(batch => {
        const batchAge = updatedData.day_count - batch.created_on_day;
        return batchAge < MAX_BATCH_AGE;
      });
      const removedCount = beforeCount - updatedData.inventory.cider_batches.length;
      if (removedCount > 0) {
        console.log(`Removed ${removedCount} expired cider batch(es)`);
      }
    }

    // Advance date (simple increment, wrapping months)
    updatedData.day_num += 1;
    const daysInMonth = new Date(2024, updatedData.month, 0).getDate();
    if (updatedData.day_num > daysInMonth) {
      updatedData.day_num = 1;
      updatedData.month += 1;
      if (updatedData.month > 10) {
        updatedData.month = 3; // Loop back to March
      }
      // Update month name
      const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
      updatedData.month_name = monthNames[updatedData.month];
    }

    // Advance day of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayIndex = daysOfWeek.indexOf(updatedData.day_name);
    updatedData.day_name = daysOfWeek[(currentDayIndex + 1) % 7];

    // Update weather for new day
    const weatherData = updatedData.weather?.weather_data || [];
    const newDayWeather = weatherData.find(w => w.month === updatedData.month && w.day === updatedData.day_num);
    if (newDayWeather) {
      updatedData.weather.current_temp = newDayWeather.temp;
      updatedData.weather.current_weather = newDayWeather.weatherType;
    }

    // Reset weekly counter on Monday
    if (updatedData.day_name === 'Monday') {
      updatedData.active_effects.second_location_uses_this_week = 0;
    }

    return updatedData;
  };

  const handleReturnHome = async () => {
    if (shouldAdvanceDay()) {
      // Advance the day before returning home
      const advancedData = await advanceDay(gameData.game_data);
      try {
        await updateGame(gameData.game_id, advancedData);
        navigate('/home-office');
      } catch (error) {
        console.error('Failed to advance day:', error);
        alert('Failed to advance day');
      }
    } else {
      // Just return home without advancing day
      navigate('/home-office');
    }
  };

  const finishSelling = async () => {
    setSelling(false);

    // Get the latest salesData from ref (not subject to closure issues)
    const latestSalesData = salesDataRef.current;

    console.log('Latest Sales Data:', latestSalesData);

    // Update game data with results
    const updatedData = { ...gameData.game_data };

    console.log('Before update:', { money: updatedData.money, tip_jar: updatedData.tip_jar });
    console.log('Adding:', { revenue: latestSalesData.totalRevenue, tips: latestSalesData.totalTips });

    updatedData.money += latestSalesData.totalRevenue;
    updatedData.tip_jar += latestSalesData.totalTips;

    console.log('After update:', { money: updatedData.money, tip_jar: updatedData.tip_jar });

    // Track this location as sold today
    if (!updatedData.active_effects) {
      updatedData.active_effects = {};
    }
    if (!updatedData.active_effects.sold_locations_today) {
      updatedData.active_effects.sold_locations_today = [];
    }

    // If this is a second location sale today, increment weekly counter
    if (updatedData.active_effects.sold_locations_today.length >= 1) {
      updatedData.active_effects.second_location_uses_this_week =
        (updatedData.active_effects.second_location_uses_this_week || 0) + 1;
    }

    if (!updatedData.active_effects.sold_locations_today.includes(selectedLocation)) {
      updatedData.active_effects.sold_locations_today.push(selectedLocation);
    }

    // Apply batch consumption to inventory and remove empty batches
    console.log('Batch consumption to apply:', latestSalesData.batchConsumption);
    Object.keys(latestSalesData.batchConsumption).forEach(batchId => {
      const ozConsumed = latestSalesData.batchConsumption[batchId];

      // Check lemonade batches
      const lemonadeBatchIndex = updatedData.inventory.lemonade_batches.findIndex(
        b => b.id === batchId
      );
      if (lemonadeBatchIndex !== -1) {
        const before = updatedData.inventory.lemonade_batches[lemonadeBatchIndex].remaining_oz;
        const after = Math.max(0, before - ozConsumed);

        if (after <= 0) {
          // Remove empty batch
          updatedData.inventory.lemonade_batches.splice(lemonadeBatchIndex, 1);
          console.log(`Lemonade batch ${batchId}: ${before}oz -> 0oz (consumed ${ozConsumed}oz) - REMOVED`);
        } else {
          // Update remaining oz
          updatedData.inventory.lemonade_batches[lemonadeBatchIndex].remaining_oz = after;
          console.log(`Lemonade batch ${batchId}: ${before}oz -> ${after}oz (consumed ${ozConsumed}oz)`);
        }
        return;
      }

      // Check cider batches
      const ciderBatchIndex = updatedData.inventory.cider_batches.findIndex(
        b => b.id === batchId
      );
      if (ciderBatchIndex !== -1) {
        const before = updatedData.inventory.cider_batches[ciderBatchIndex].remaining_oz;
        const after = Math.max(0, before - ozConsumed);

        if (after <= 0) {
          // Remove empty batch
          updatedData.inventory.cider_batches.splice(ciderBatchIndex, 1);
          console.log(`Cider batch ${batchId}: ${before}oz -> 0oz (consumed ${ozConsumed}oz) - REMOVED`);
        } else {
          // Update remaining oz
          updatedData.inventory.cider_batches[ciderBatchIndex].remaining_oz = after;
          console.log(`Cider batch ${batchId}: ${before}oz -> ${after}oz (consumed ${ozConsumed}oz)`);
        }
      }
    });

    // Update location reviews if there are any
    if (latestSalesData.reviews.length > 0) {
      const currentReviews = updatedData.reviews[selectedLocation] || { rating: 0, count: 0 };
      const totalRating = currentReviews.rating * currentReviews.count;
      const newRatings = latestSalesData.reviews.reduce((sum, r) => sum + r.stars, 0);
      const newCount = currentReviews.count + latestSalesData.reviews.length;

      updatedData.reviews[selectedLocation] = {
        rating: (totalRating + newRatings) / newCount,
        count: newCount
      };
    }

    // Update statistics
    updatedData.statistics.total_earned += latestSalesData.totalRevenue;
    updatedData.statistics.total_earned_location[selectedLocation] += latestSalesData.totalRevenue;
    updatedData.statistics.total_served += latestSalesData.totalSales;
    updatedData.statistics.total_served_location[selectedLocation] += latestSalesData.totalSales;

    try {
      await updateGame(gameData.game_id, updatedData);
      setGameData({ ...gameData, game_data: updatedData });
      setShowSummary(true);
    } catch (error) {
      console.error('Failed to save game:', error);
      alert('Failed to save game progress');
    }
  };

  if (showSummary) {
    return (
      <div className="sell-container">
        <div className="summary-overlay">
          <div className="summary-card">
            <h1>📊 End of Day Summary</h1>
            <h2>{location?.name} • Day {data.day_count} • {data.day_name}, {data.month_name} {data.day_num}</h2>

            <div className="summary-stats">
              <div className="summary-stat-large">
                <div className="summary-stat-label">Total Sales</div>
                <div className="summary-stat-value">{salesData.totalSales} cups</div>
              </div>

              <div className="summary-stat-row">
                <div className="summary-stat">
                  <div className="summary-stat-label">Revenue</div>
                  <div className="summary-stat-value">${salesData.totalRevenue.toFixed(2)}</div>
                </div>
                <div className="summary-stat">
                  <div className="summary-stat-label">Tips</div>
                  <div className="summary-stat-value">${salesData.totalTips.toFixed(2)}</div>
                </div>
              </div>

              <div className="cups-breakdown">
                <h3>Cups Sold</h3>
                <div className="cups-grid">
                  <div className="cup-stat">
                    <span>Small</span>
                    <span>{salesData.cupsSold.small}</span>
                  </div>
                  <div className="cup-stat">
                    <span>Medium</span>
                    <span>{salesData.cupsSold.medium}</span>
                  </div>
                  <div className="cup-stat">
                    <span>Large</span>
                    <span>{salesData.cupsSold.large}</span>
                  </div>
                  {salesData.cupsSold.frozen > 0 && (
                    <div className="cup-stat frozen-stat">
                      <span>❄️ Frozen</span>
                      <span>{salesData.cupsSold.frozen}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {salesData.reviews.length > 0 && (
              <div className="summary-reviews">
                <h3>⭐ Customer Reviews ({salesData.reviews.length})</h3>
                <div className="reviews-list">
                  {salesData.reviews.map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-stars">
                        {'⭐'.repeat(review.stars)}
                      </div>
                      <div className="review-text">{review.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="summary-actions">
              <button onClick={handleReturnHome} className="btn-return-home">
                🏠 {shouldAdvanceDay() ? 'End Day & Return Home' : 'Return Home (Can sell at another location today)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sell-container">
      {/* Header */}
      <div className="sell-header">
        <div className="header-top">
          <div className="location-title">
            <h1>🍋 {location?.name}</h1>
            <p className="location-subtitle">Day {data.day_count} • {data.day_name}, {data.month_name} {data.day_num}</p>
          </div>
          <button onClick={() => navigate('/choose-location')} className="btn-change-location" disabled={selling}>
            ← Change Location
          </button>
        </div>

        <div className="header-stats-bar">
          <div className="stat-box">
            <div className="stat-icon">🌡️</div>
            <div className="stat-info">
              <div className="stat-label">Weather</div>
              <div className="stat-value">{data.weather?.current_temp}°F {data.weather?.current_weather}</div>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-label">Potential Customers</div>
              <div className="stat-value">{locationCustomers?.total_count || 0}</div>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-icon">⚡</div>
            <div className="stat-info">
              <div className="stat-label">Can Serve</div>
              <div className="stat-value">{calculateMaxServed(calculateServeMultiplier(data.upgrades || {}))}</div>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <div className="stat-label">Traffic Multiplier</div>
              <div className="stat-value">{locationCustomers?.traffic_multiplier.toFixed(2)}x</div>
            </div>
          </div>

          <div className="stat-box money-box">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <div className="stat-label">Cash on Hand</div>
              <div className="stat-value">${data.money?.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sell-content">
        {/* Selling Interface */}
        {!selling ? (
          <>
            {/* Multi-Batch Selection */}
            <div className="section-card batch-selection-section">
              <div className="section-header">
                <h2>Step 1: Select Batches to Sell</h2>
                {selectedBatches.length > 0 && (
                  <span className="selection-count">{selectedBatches.length} batch{selectedBatches.length !== 1 ? 'es' : ''} selected</span>
                )}
              </div>
              {currentTemp < 60 && hasCiderMaker && ciderBatches.length > 0 && (
                <div className="weather-pricing-tip">
                  ❄️ Cold weather! Customers prefer cider ({currentTemp < 50 ? '2x' : '1.5x'} multiplier)
                </div>
              )}

              {lemonadeBatches.length > 0 && (
                <div className="batch-category">
                  <h3>🍋 Lemonade Batches</h3>
                  <div className="batches-selection">
                    {lemonadeBatches.map((batch, index) => (
                      <div
                        key={batch.id || index}
                        className={`batch-select-item ${selectedBatches.some(b => b.id === batch.id) ? 'selected' : ''}`}
                        onClick={() => toggleBatchSelection(batch.id, 'lemonade')}
                      >
                        <div className="batch-select-header">
                          <span className="batch-type">{batch.container_type.replace('_', ' ')}</span>
                          <span className="batch-quality">Quality: {batch.quality}/100</span>
                        </div>
                        <div className="batch-select-details">
                          <span>Available: {batch.remaining_oz} oz</span>
                          <span>Day {batch.created_on_day}</span>
                        </div>
                        {selectedBatches.some(b => b.id === batch.id) && (
                          <div className="batch-selected-indicator">✓ Selected</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasCiderMaker && ciderBatches.length > 0 && (
                <div className="batch-category">
                  <h3>🍎 Cider Batches</h3>
                  <div className="batches-selection">
                    {ciderBatches.map((batch, index) => (
                      <div
                        key={batch.id || index}
                        className={`batch-select-item ${selectedBatches.some(b => b.id === batch.id) ? 'selected' : ''}`}
                        onClick={() => toggleBatchSelection(batch.id, 'cider')}
                      >
                        <div className="batch-select-header">
                          <span className="batch-type">{batch.container_type.replace('_', ' ')}</span>
                          <span className="batch-quality">🍎 Cider</span>
                        </div>
                        <div className="batch-select-details">
                          <span>Available: {batch.remaining_oz} oz</span>
                          <span>Day {batch.created_on_day}</span>
                        </div>
                        {selectedBatches.some(b => b.id === batch.id) && (
                          <div className="batch-selected-indicator">✓ Selected</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lemonadeBatches.length === 0 && ciderBatches.length === 0 && (
                <div className="empty-state">
                  <p>⚠️ No batches available!</p>
                  <button onClick={() => navigate('/kitchen')} className="btn-action">
                    Go to Kitchen
                  </button>
                </div>
              )}
            </div>

            <div className="section-card pricing-section-card">
              <div className="section-header">
                <h2>Step 2: Set Your Prices</h2>
                <p className="section-subtitle">Adjust prices based on quality, weather, and competition</p>
              </div>

              {selectedBatches.some(b => b.type === 'lemonade') && (
                <div className="pricing-category">
                  <h3>🍋 Lemonade Prices</h3>
                  <div className="pricing-grid">
                    <div className="price-input-group">
                      <label>Small (10 oz)</label>
                      <div className="price-input-wrapper">
                        <span className="currency">$</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={prices.small}
                          onChange={(e) => handlePriceChange('small', e.target.value)}
                          className="price-input"
                        />
                      </div>
                      <span className="per-oz">${(prices.small / 10).toFixed(2)}/oz</span>
                    </div>

                    <div className="price-input-group">
                      <label>Medium (16 oz)</label>
                      <div className="price-input-wrapper">
                        <span className="currency">$</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={prices.medium}
                          onChange={(e) => handlePriceChange('medium', e.target.value)}
                          className="price-input"
                        />
                      </div>
                      <span className="per-oz">${(prices.medium / 16).toFixed(2)}/oz</span>
                    </div>

                    <div className="price-input-group">
                      <label>Large (24 oz)</label>
                      <div className="price-input-wrapper">
                        <span className="currency">$</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={prices.large}
                          onChange={(e) => handlePriceChange('large', e.target.value)}
                          className="price-input"
                        />
                      </div>
                      <span className="per-oz">${(prices.large / 24).toFixed(2)}/oz</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedBatches.some(b => b.type === 'cider') && (
                <div className="pricing-section">
                  <h3>🍎 Cider Prices</h3>
                  <div className="pricing-grid">
                    <div className="price-input-group cider-pricing">
                      <label>🍎 Cider Mug (8 oz)</label>
                      <div className="price-input-wrapper">
                        <span className="currency">$</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={prices.cider}
                          onChange={(e) => handlePriceChange('cider', e.target.value)}
                          className="price-input"
                        />
                      </div>
                      <span className="per-oz">${(prices.cider / 8).toFixed(2)}/oz</span>
                    </div>
                    {currentTemp < 60 && (
                      <div className="weather-pricing-tip">
                        ❄️ Cold weather! Customers are {currentTemp < 50 ? '2x' : '1.5x'} more likely to buy cider!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Speed Control */}
            <div className="info-card speed-control">
              <h2>⚡ Animation Speed</h2>
              <div className="speed-buttons">
                <button
                  className={`speed-btn ${animationSpeed === 1 ? 'active' : ''}`}
                  onClick={() => setAnimationSpeed(1)}
                >
                  1x
                </button>
                <button
                  className={`speed-btn ${animationSpeed === 2 ? 'active' : ''}`}
                  onClick={() => setAnimationSpeed(2)}
                >
                  2x
                </button>
                <button
                  className={`speed-btn ${animationSpeed === 5 ? 'active' : ''}`}
                  onClick={() => setAnimationSpeed(5)}
                >
                  5x
                </button>
                <button
                  className={`speed-btn ${animationSpeed === 10 ? 'active' : ''}`}
                  onClick={() => setAnimationSpeed(10)}
                >
                  10x
                </button>
                <button
                  className={`speed-btn ${animationSpeed === 0 ? 'active' : ''}`}
                  onClick={() => setAnimationSpeed(0)}
                >
                  ⚡ Instant
                </button>
              </div>
            </div>

            <div className="section-card start-selling-card">
              <div className="start-selling-summary">
                <h3>Ready to Sell?</h3>
                {selectedBatches.length > 0 ? (
                  <div className="ready-summary">
                    <p>✓ {selectedBatches.length} batch{selectedBatches.length !== 1 ? 'es' : ''} selected</p>
                    <p>✓ Prices configured</p>
                    <p>✓ {locationCustomers?.total_count || 0} customers waiting</p>
                  </div>
                ) : (
                  <p className="warning-text">⚠️ Select at least one batch to begin selling</p>
                )}
              </div>
              <button
                onClick={handleStartSelling}
                className="btn-start-selling"
                disabled={selectedBatches.length === 0}
              >
                🚀 Start Selling
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="info-card selling-progress">
              <h2>🎯 Selling in Progress...</h2>

              {/* Speed Control (during sale) */}
              <div className="speed-control-inline">
                <label>Speed:</label>
                <div className="speed-buttons-inline">
                  <button
                    className={`speed-btn-small ${animationSpeed === 1 ? 'active' : ''}`}
                    onClick={() => setAnimationSpeed(1)}
                  >
                    1x
                  </button>
                  <button
                    className={`speed-btn-small ${animationSpeed === 2 ? 'active' : ''}`}
                    onClick={() => setAnimationSpeed(2)}
                  >
                    2x
                  </button>
                  <button
                    className={`speed-btn-small ${animationSpeed === 5 ? 'active' : ''}`}
                    onClick={() => setAnimationSpeed(5)}
                  >
                    5x
                  </button>
                  <button
                    className={`speed-btn-small ${animationSpeed === 10 ? 'active' : ''}`}
                    onClick={() => setAnimationSpeed(10)}
                  >
                    10x
                  </button>
                  <button
                    className={`speed-btn-small ${animationSpeed === 0 ? 'active' : ''}`}
                    onClick={() => setAnimationSpeed(0)}
                  >
                    ⚡
                  </button>
                </div>
              </div>

              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${(currentCustomerIndex / calculateMaxServed(calculateServeMultiplier(data.upgrades || {}, data.active_effects || {}))) * 100}%` }}
                />
              </div>
              <p className="progress-text">
                {calculateMaxServed(calculateServeMultiplier(data.upgrades || {}, data.active_effects || {})) - currentCustomerIndex} customers remaining ({currentCustomerIndex} processed, {salesData.totalSales} sales)
              </p>

              {/* Customer Animation Lane */}
              <div className="customer-lane">
                <div className="stand-icon">🏪</div>
                {animatedCustomer && (
                  <div className={`animated-customer ${animatedCustomer.action}`}>
                    {animatedCustomer.emoji}
                  </div>
                )}
              </div>

              {/* Customer Feedback Animation */}
              <div className="customer-feedback-container">
                {customerFeedback.slice(-5).map(feedback => (
                  <div
                    key={feedback.id}
                    className={`customer-feedback ${feedback.isPositive ? 'positive' : 'negative'}`}
                  >
                    <span className="feedback-emoji">{feedback.emoji}</span>
                    <span className="feedback-message">{feedback.message}</span>
                  </div>
                ))}
              </div>

              <div className="live-stats">
              <div className="live-stat">
                <span className="live-stat-label">Sales</span>
                <span className="live-stat-value">{salesData.totalSales}</span>
              </div>
              <div className="live-stat">
                <span className="live-stat-label">Revenue</span>
                <span className="live-stat-value">${salesData.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="live-stat">
                <span className="live-stat-label">Tips</span>
                <span className="live-stat-value">${salesData.totalTips.toFixed(2)}</span>
              </div>
              <div className="live-stat">
                <span className="live-stat-label">Reviews</span>
                <span className="live-stat-value">{salesData.reviews.length}</span>
              </div>
            </div>
          </div>
          </>
        )}

        {/* Customer Preview */}
        <div className="info-card">
          <h2>👥 Customer Preview</h2>
          {locationCustomers && locationCustomers.customers.length > 0 ? (
            <>
              <p className="preview-text">
                Today you have {locationCustomers.total_count} customers waiting!
              </p>
              <div className="customer-ranges">
                <div className="range-item">
                  <span className="range-label">Thirst Levels:</span>
                  <span className="range-value">
                    {Math.min(...locationCustomers.customers.map(c => c.thirst_level))} -
                    {Math.max(...locationCustomers.customers.map(c => c.thirst_level))}
                  </span>
                </div>
                <div className="range-item">
                  <span className="range-label">Quality Expectations:</span>
                  <span className="range-value">
                    {Math.min(...locationCustomers.customers.map(c => c.desired_quality))} -
                    {Math.max(...locationCustomers.customers.map(c => c.desired_quality))}
                  </span>
                </div>
                <div className="range-item">
                  <span className="range-label">Price Willingness:</span>
                  <span className="range-value">
                    ${Math.min(...locationCustomers.customers.map(c => c.max_price_per_oz)).toFixed(2)} -
                    ${Math.max(...locationCustomers.customers.map(c => c.max_price_per_oz)).toFixed(2)} per oz
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p>No customer data available.</p>
          )}
        </div>
      </div>

      <div className="action-footer">
        <button onClick={() => navigate('/home-office')} className="btn-end-day">
          🏠 End Day & Return Home
        </button>
      </div>
    </div>
  );
}

export default Sell;
