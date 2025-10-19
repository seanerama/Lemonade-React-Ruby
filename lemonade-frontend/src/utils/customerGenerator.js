import {
  BASE_CUSTOMER_COUNT,
  TEMP_CUSTOMER_MODIFIERS,
  THIRST_LEVEL_RANGE,
  QUALITY_EXPECTATION_RANGE,
  PRICE_WILLINGNESS,
  TIP_AMOUNTS,
  WEATHER_TYPES,
  CUP_SIZES,
  THIRST_CUP_SIZE_THRESHOLD,
  TIP_CHANCE_HIGH,
  TIP_CHANCE_LOW,
  REVIEW_CHANCE_SATISFIED,
  REVIEW_CHANCE_UNSATISFIED,
  getLocationTraffic,
  getReviewMultiplier,
  calculateUpgradeCustomerBonus
} from '../constants/gameMultipliers';

import { generateCustomerReview } from './reviewsLoader';

/**
 * Get temperature modifier for customer behavior
 */
const getTempModifier = (temp) => {
  const modifiers = TEMP_CUSTOMER_MODIFIERS;

  if (temp <= modifiers.very_cold.temp_max) {
    return modifiers.very_cold;
  } else if (temp >= modifiers.cold.temp_min && temp <= modifiers.cold.temp_max) {
    return modifiers.cold;
  } else if (temp >= modifiers.cool.temp_min && temp <= modifiers.cool.temp_max) {
    return modifiers.cool;
  } else if (temp >= modifiers.warm.temp_min && temp <= modifiers.warm.temp_max) {
    return modifiers.warm;
  } else if (temp >= modifiers.hot.temp_min && temp <= modifiers.hot.temp_max) {
    return modifiers.hot;
  } else if (temp >= modifiers.very_hot.temp_min && temp <= modifiers.very_hot.temp_max) {
    return modifiers.very_hot;
  } else if (temp >= modifiers.extreme.temp_min) {
    return modifiers.extreme;
  }

  // Default (shouldn't happen)
  return modifiers.warm;
};

/**
 * Generate a random integer between min and max (inclusive)
 */
const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate a random float between min and max
 */
const randomFloat = (min, max) => {
  return Math.random() * (max - min) + min;
};

/**
 * Get max price per oz based on thirst level
 */
export const getMaxPricePerOz = (thirstLevel) => {
  for (const tier of PRICE_WILLINGNESS) {
    if (thirstLevel >= tier.thirst_min && thirstLevel <= tier.thirst_max) {
      return tier.max_price_per_oz;
    }
  }
  return PRICE_WILLINGNESS[0].max_price_per_oz; // Default to lowest
};

/**
 * Generate a single customer
 */
const generateCustomer = (temp, weatherType, baseThirst, baseQuality) => {
  // Base thirst and quality
  const rawThirst = randomInt(THIRST_LEVEL_RANGE.min, THIRST_LEVEL_RANGE.max);
  const rawQuality = randomInt(QUALITY_EXPECTATION_RANGE.min, QUALITY_EXPECTATION_RANGE.max);

  // Apply modifiers
  const thirstLevel = Math.max(0, Math.round(rawThirst + baseThirst));
  const desiredQuality = Math.max(0, Math.min(100, rawQuality + baseQuality));

  // Calculate max price willing to pay per oz
  const maxPricePerOz = getMaxPricePerOz(thirstLevel);

  return {
    id: Math.random().toString(36).substring(7),
    thirst_level: thirstLevel,
    desired_quality: desiredQuality,
    max_price_per_oz: maxPricePerOz,
    served: false
  };
};

/**
 * Generate customers for a specific location and day
 */
export const generateCustomersForLocation = (
  locationKey,
  temperature,
  weatherType,
  dayName,
  events,
  month,
  day,
  reviewMultiplier = 1.0,
  upgradeBonus = 0
) => {
  // Get temp modifier
  const tempModifier = getTempModifier(temperature);

  // Get weather modifier
  const weatherInfo = WEATHER_TYPES[weatherType] || WEATHER_TYPES.sunny;
  const weatherThirstMod = weatherInfo.thirst_modifier || 0;

  // Calculate base thirst and quality adjustments
  const totalThirstModifier = tempModifier.thirst_modifier + weatherThirstMod;
  const baseThirstAdjustment = Math.round(totalThirstModifier * THIRST_LEVEL_RANGE.max);
  const baseQualityAdjustment = tempModifier.quality_min_increase;

  // Get location traffic multiplier
  const trafficMultiplier = getLocationTraffic(locationKey, dayName, events, month, day);

  // Generate base customer count (40-60)
  const baseCount = randomInt(BASE_CUSTOMER_COUNT.min, BASE_CUSTOMER_COUNT.max);

  // Apply traffic, review multipliers, and upgrade bonus
  const totalCustomers = Math.round(baseCount * trafficMultiplier * reviewMultiplier * (1 + upgradeBonus));

  // Generate customers
  const customers = [];
  for (let i = 0; i < totalCustomers; i++) {
    customers.push(generateCustomer(
      temperature,
      weatherType,
      baseThirstAdjustment,
      baseQualityAdjustment
    ));
  }

  return {
    location: locationKey,
    total_count: totalCustomers,
    base_count: baseCount,
    traffic_multiplier: trafficMultiplier,
    review_multiplier: reviewMultiplier,
    temp_modifier: tempModifier,
    weather_thirst_mod: weatherThirstMod,
    customers
  };
};

/**
 * Generate customers for all locations
 */
export const generateDailyCustomers = (gameData) => {
  const data = gameData?.game_data || gameData || {};
  const temperature = data.weather?.current_temp || 80;
  const weatherType = data.weather?.current_weather || 'sunny';
  const dayName = data.day_name || 'Monday';
  const events = data.events || {};
  const month = Math.floor(data.month || 3);
  const day = data.day_num || 20;
  const ownedPermits = data.permits || {};
  const reviews = data.reviews || {};
  const upgrades = data.upgrades || {};
  const activeEffects = data.active_effects || {};

  // Calculate upgrade bonus (includes active ad campaigns)
  const upgradeBonus = calculateUpgradeCustomerBonus(upgrades, activeEffects);

  // Generate for driveway (always available)
  const drivewayRating = reviews.location_driveway?.rating || 0;
  const drivewayReviewMult = getReviewMultiplier(drivewayRating);
  const locationCustomers = {
    location_driveway: generateCustomersForLocation(
      'location_driveway',
      temperature,
      weatherType,
      dayName,
      events,
      month,
      day,
      drivewayReviewMult,
      upgradeBonus
    )
  };

  // Generate for owned permit locations
  Object.keys(ownedPermits).forEach(locationKey => {
    if (ownedPermits[locationKey].count > 0) {
      const locationRating = reviews[locationKey]?.rating || 0;
      const locationReviewMult = getReviewMultiplier(locationRating);
      locationCustomers[locationKey] = generateCustomersForLocation(
        locationKey,
        temperature,
        weatherType,
        dayName,
        events,
        month,
        day,
        locationReviewMult,
        upgradeBonus
      );
    }
  });

  return locationCustomers;
};

/**
 * Get a random tip amount
 */
export const getRandomTip = () => {
  return TIP_AMOUNTS[Math.floor(Math.random() * TIP_AMOUNTS.length)];
};

/**
 * Check if customer will buy at given price
 */
export const willCustomerBuy = (customer, pricePerOz) => {
  return pricePerOz <= customer.max_price_per_oz;
};

/**
 * Check if customer will leave a tip (quality met or exceeded)
 */
export const willCustomerTip = (customer, lemonadeQuality) => {
  return lemonadeQuality >= customer.desired_quality;
};

/**
 * Calculate customer satisfaction for review
 */
export const calculateSatisfaction = (customer, lemonadeQuality, pricePerOz) => {
  let satisfaction = 0;

  // Quality satisfaction (0-50 points)
  const qualityDiff = lemonadeQuality - customer.desired_quality;
  if (qualityDiff >= 0) {
    satisfaction += 50; // Met expectations
    satisfaction += Math.min(20, qualityDiff / 2); // Bonus for exceeding
  } else {
    satisfaction += Math.max(0, 50 + qualityDiff); // Penalty for missing
  }

  // Price satisfaction (0-30 points)
  const priceRatio = pricePerOz / customer.max_price_per_oz;
  if (priceRatio <= 0.5) {
    satisfaction += 30; // Great deal
  } else if (priceRatio <= 0.75) {
    satisfaction += 20; // Good price
  } else if (priceRatio <= 1.0) {
    satisfaction += 10; // Fair price
  } else {
    satisfaction += 0; // Overpriced (but they bought it anyway?)
  }

  return Math.min(100, Math.max(0, satisfaction));
};

/**
 * Determine cup size based on thirst level
 * If thirst is 3+ higher than the minimum threshold for their price tier, buy medium/large
 */
export const determineCupSize = (customer) => {
  // Find which price tier this customer is in
  let thresholdForTier = 20; // Default
  for (const tier of PRICE_WILLINGNESS) {
    if (customer.thirst_level >= tier.thirst_min && customer.thirst_level <= tier.thirst_max) {
      thresholdForTier = tier.thirst_min;
      break;
    }
  }

  // Check if thirst is 3+ higher than threshold
  const thirstDifference = customer.thirst_level - thresholdForTier;

  if (thirstDifference >= THIRST_CUP_SIZE_THRESHOLD) {
    // 75% chance for medium or large (50/50 between them)
    if (Math.random() < 0.75) {
      return Math.random() < 0.5 ? 'medium' : 'large';
    }
  }

  // Default to small
  return 'small';
};

/**
 * Determine if customer will tip based on quality and thirst
 */
export const willCustomerTipAdvanced = (customer, lemonadeQuality, cupSize) => {
  const qualityMet = lemonadeQuality >= customer.desired_quality;

  if (!qualityMet) return false;

  // Find threshold for their price tier
  let thresholdForTier = 20;
  for (const tier of PRICE_WILLINGNESS) {
    if (customer.thirst_level >= tier.thirst_min && customer.thirst_level <= tier.thirst_max) {
      thresholdForTier = tier.thirst_min;
      break;
    }
  }

  const thirstDifference = customer.thirst_level - thresholdForTier;

  // If thirst 3+ over threshold and bought medium/large
  if (thirstDifference >= THIRST_CUP_SIZE_THRESHOLD && (cupSize === 'medium' || cupSize === 'large')) {
    return Math.random() < TIP_CHANCE_HIGH; // 75% chance
  }

  // Otherwise 20% chance
  return Math.random() < TIP_CHANCE_LOW;
};

/**
 * Generate a review for this customer
 */
export const generateReview = (customer, lemonadeQuality) => {
  const qualityMet = lemonadeQuality >= customer.desired_quality;
  const satisfaction = calculateSatisfaction(customer, lemonadeQuality, customer.max_price_per_oz);

  return generateCustomerReview(qualityMet, satisfaction);
};
