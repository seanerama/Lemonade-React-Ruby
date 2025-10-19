import {
  TEMP_RANGES,
  HEATWAVE_TEMP,
  TEMP_CHANGE_OPTIONS,
  WEATHER_TYPES,
  WEATHER_PROBABILITIES
} from '../constants/gameMultipliers';

/**
 * Generate heatwave events for June, July, and August
 * @param {number} year - The year to generate heatwaves for
 * @returns {Array} Array of heatwave events with start and end dates
 */
export const generateHeatwaves = (year = 2024) => {
  const heatwaves = [];
  const months = [6, 7, 8]; // June, July, August

  months.forEach(month => {
    // 1-2 heatwaves per month, 2-4 days each
    const numHeatwaves = Math.random() < 0.6 ? 1 : 2;

    const daysInMonth = new Date(year, month, 0).getDate();
    const usedDays = new Set();

    for (let i = 0; i < numHeatwaves; i++) {
      const duration = Math.floor(Math.random() * 3) + 2; // 2-4 days
      let startDay;
      let attempts = 0;

      // Find a start day that doesn't overlap with existing heatwaves
      do {
        startDay = Math.floor(Math.random() * (daysInMonth - duration - 1)) + 1;
        attempts++;
      } while (
        attempts < 20 &&
        Array.from({ length: duration }, (_, i) => startDay + i).some(day => usedDays.has(day))
      );

      if (attempts >= 20) continue; // Skip if can't find a spot

      // Mark days as used
      for (let d = 0; d < duration; d++) {
        usedDays.add(startDay + d);
      }

      heatwaves.push({
        month,
        start_day: startDay,
        end_day: startDay + duration - 1,
        duration,
        type: 'heatwave',
        name: getHeatwaveName()
      });
    }
  });

  return heatwaves.sort((a, b) => a.month - b.month || a.start_day - b.start_day);
};

/**
 * Get a random heatwave name
 */
const getHeatwaveName = () => {
  const names = [
    'Summer Scorcher',
    'Heat Advisory Issued',
    'Record Temperatures Expected',
    'Excessive Heat Warning',
    'Triple Digit Temps Forecasted',
    'Heat Dome Arrives',
    'Sweltering Conditions Continue',
    'Dangerous Heat Wave Alert'
  ];
  return names[Math.floor(Math.random() * names.length)];
};

/**
 * Check if a date falls within a heatwave
 */
export const isHeatwaveDay = (heatwaves, month, day) => {
  if (!heatwaves) return false;
  return heatwaves.some(hw =>
    hw.month === month && day >= hw.start_day && day <= hw.end_day
  );
};

/**
 * Get temperature range based on current conditions
 */
const getTempRange = (month, isHeatwave) => {
  if (isHeatwave) {
    return HEATWAVE_TEMP;
  }
  return TEMP_RANGES[month] || TEMP_RANGES[3]; // Default to March if invalid
};

/**
 * Calculate next day's temperature based on previous temp
 */
export const calculateNextTemp = (currentTemp, month, isHeatwave) => {
  const range = getTempRange(month, isHeatwave);

  // Randomly select a change amount
  const changeOptions = TEMP_CHANGE_OPTIONS;
  const change = changeOptions[Math.floor(Math.random() * changeOptions.length)];

  // Randomly decide if it goes up or down
  const direction = Math.random() < 0.5 ? -1 : 1;

  let newTemp = currentTemp + (change * direction);

  // Clamp to valid range
  newTemp = Math.max(range.min, Math.min(range.max, newTemp));

  return Math.round(newTemp);
};

/**
 * Get temperature category for weather probability
 */
const getTempCategory = (temp) => {
  if (temp < 50) return 'cold';
  if (temp < 65) return 'cool';
  if (temp < 75) return 'mild';
  if (temp < 85) return 'warm';
  if (temp < 95) return 'hot';
  return 'very_hot';
};

/**
 * Generate weather type based on temperature
 */
export const generateWeather = (temp) => {
  const category = getTempCategory(temp);
  const probabilities = WEATHER_PROBABILITIES[category];

  // Roll a random number 0-99
  const roll = Math.floor(Math.random() * 100);

  let cumulative = 0;
  for (const [weatherType, probability] of Object.entries(probabilities)) {
    cumulative += probability;
    if (roll < cumulative) {
      return weatherType;
    }
  }

  return 'sunny'; // Fallback
};

/**
 * Initialize starting temperature for a month
 */
export const getStartingTemp = (month, isHeatwave) => {
  const range = getTempRange(month, isHeatwave);
  // Start somewhere in the middle of the range
  const midpoint = (range.min + range.max) / 2;
  const variance = (range.max - range.min) * 0.25;
  return Math.round(midpoint + (Math.random() - 0.5) * variance);
};

/**
 * Generate 5-day forecast from current day
 */
export const generateForecast = (currentTemp, currentMonth, currentDay, heatwaves) => {
  const forecast = [];
  let temp = currentTemp;
  let day = currentDay;
  let month = currentMonth;

  for (let i = 0; i < 5; i++) {
    const isHeatwave = isHeatwaveDay(heatwaves, Math.floor(month), day);
    const weatherType = generateWeather(temp);

    forecast.push({
      day: i,
      dayNum: day,
      month: Math.floor(month),
      temp,
      weatherType,
      isHeatwave,
      weather: WEATHER_TYPES[weatherType]
    });

    // Calculate next day
    if (i < 4) {
      day++;
      const daysInMonth = new Date(2024, Math.floor(month), 0).getDate();
      if (day > daysInMonth) {
        day = 1;
        month++;
        if (month > 10) month = 3; // Loop back to March
      }

      const nextIsHeatwave = isHeatwaveDay(heatwaves, Math.floor(month), day);
      temp = calculateNextTemp(temp, Math.floor(month), nextIsHeatwave);
    }
  }

  return forecast;
};

/**
 * Get weather multiplier for a given weather type
 */
export const getWeatherMultiplier = (weatherType) => {
  return WEATHER_TYPES[weatherType]?.multiplier || 1.0;
};

/**
 * Generate full year of weather data (March 20 - October 31)
 * @param {number} year - The year to generate weather for
 * @param {Array} heatwaves - Pre-generated heatwave events
 * @returns {Array} Array of daily weather data for the entire game period
 */
export const generateYearWeather = (year = 2024, heatwaves = []) => {
  const weatherData = [];

  // Game runs from March 20 to October 31
  const months = [
    { month: 3, startDay: 20, endDay: 31 },  // March 20-31
    { month: 4, startDay: 1, endDay: 30 },   // April 1-30
    { month: 5, startDay: 1, endDay: 31 },   // May 1-31
    { month: 6, startDay: 1, endDay: 30 },   // June 1-30
    { month: 7, startDay: 1, endDay: 31 },   // July 1-31
    { month: 8, startDay: 1, endDay: 31 },   // August 1-31
    { month: 9, startDay: 1, endDay: 30 },   // September 1-30
    { month: 10, startDay: 1, endDay: 31 }   // October 1-31
  ];

  // Start with a temperature for March 20
  const isFirstDayHeatwave = isHeatwaveDay(heatwaves, 3, 20);
  let currentTemp = getStartingTemp(3, isFirstDayHeatwave);

  // Generate weather for each day
  months.forEach(({ month, startDay, endDay }) => {
    for (let day = startDay; day <= endDay; day++) {
      const isHeatwave = isHeatwaveDay(heatwaves, month, day);
      const weatherType = generateWeather(currentTemp);

      weatherData.push({
        month,
        day,
        temp: currentTemp,
        weatherType,
        isHeatwave,
        weather: WEATHER_TYPES[weatherType]
      });

      // Calculate next day's temperature
      const nextIsHeatwave = isHeatwaveDay(heatwaves, month, day + 1);
      currentTemp = calculateNextTemp(currentTemp, month, nextIsHeatwave);
    }
  });

  return weatherData;
};

/**
 * Get weather for a specific day from pre-generated data
 * @param {Array} weatherData - Pre-generated weather data
 * @param {number} month - Month number (3-10)
 * @param {number} day - Day of month
 * @returns {Object} Weather data for that day
 */
export const getWeatherForDay = (weatherData, month, day) => {
  return weatherData.find(w => w.month === month && w.day === day);
};

/**
 * Get forecast for next N days starting from a specific day
 * @param {Array} weatherData - Pre-generated weather data
 * @param {number} currentMonth - Current month
 * @param {number} currentDay - Current day
 * @param {number} numDays - Number of days to forecast (default 4)
 * @returns {Array} Array of weather data for the forecast period
 */
export const getForecastFromData = (weatherData, currentMonth, currentDay, numDays = 4) => {
  const forecast = [];

  // Find the index of the current day
  const currentIndex = weatherData.findIndex(w => w.month === currentMonth && w.day === currentDay);

  if (currentIndex === -1) {
    return forecast; // Day not found
  }

  // Get the next numDays days
  for (let i = 0; i < numDays && currentIndex + i < weatherData.length; i++) {
    const dayData = weatherData[currentIndex + i];
    forecast.push({
      day: i,
      dayNum: dayData.day,
      month: dayData.month,
      temp: dayData.temp,
      weatherType: dayData.weatherType,
      isHeatwave: dayData.isHeatwave,
      weather: dayData.weather
    });
  }

  return forecast;
};
