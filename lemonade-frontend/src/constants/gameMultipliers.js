// Game Multipliers and Constants
// Edit these values to adjust game balance

// ====================
// SERVING CAPACITY
// ====================

export const BASE_SERVE_TIME = 150;
export const DEFAULT_SERVE_MULTIPLIER = 0.5;

// Calculate max customers that can be served
export const calculateMaxServed = (serveMultiplier) => {
  return Math.floor(BASE_SERVE_TIME * serveMultiplier);
};

// ====================
// UPGRADES
// ====================

export const UPGRADES = {
  glass_dispenser: {
    name: "Glass Beverage Dispenser",
    description: "Speeds up serving time",
    cost: 100,
    serve_multiplier_bonus: 0.5,
    customer_multiplier_bonus: 0,
    is_permanent: true
  },
  cash_drawer: {
    name: "Cash Drawer",
    description: "Organized cash handling",
    cost: 200,
    serve_multiplier_bonus: 0.5,
    customer_multiplier_bonus: 0,
    is_permanent: true
  },
  pos_system: {
    name: "Point of Sale with Card Pay",
    description: "Modern payment processing",
    cost: 2500,
    serve_multiplier_bonus: 1.5,
    customer_multiplier_bonus: 0.2,
    is_permanent: true
  },
  frozen_machine: {
    name: "Frozen Drink Machine",
    description: "Sell frozen lemonade for 2x price",
    cost: 3500,
    serve_multiplier_bonus: 0,
    customer_multiplier_bonus: 0,
    enables_frozen: true,
    is_permanent: true
  },
  second_location: {
    name: "Second Location",
    description: "Sell at 2 locations per day (max 2x/week)",
    cost: 10000,
    serve_multiplier_bonus: 0,
    customer_multiplier_bonus: 0,
    enables_second_location: true,
    is_permanent: true
  },
  ad_campaign: {
    name: "Ad Campaign",
    description: "+0.8 customer multiplier for 3 days",
    cost: 2500,
    serve_multiplier_bonus: 0,
    customer_multiplier_bonus: 0.8,
    duration_days: 3,
    is_consumable: true,
    weekly_limit: 1
  },
  chilled_dispenser: {
    name: "Chilled Commercial Beverage Dispenser",
    description: "High-capacity chilled serving system",
    cost: 1000,
    serve_multiplier_bonus: 10,
    customer_multiplier_bonus: 0,
    is_permanent: true
  },
  lemonade_robot: {
    name: "Lemonade Robot",
    description: "Automated perfect recipe calculator",
    cost: 10000,
    serve_multiplier_bonus: 0,
    customer_multiplier_bonus: 0,
    enables_auto_recipe: true,
    is_permanent: true
  },
  cider_maker: {
    name: "Cider Making Equipment",
    description: "Brew warm apple cider (Available Sep 1+)",
    cost: 2500,
    serve_multiplier_bonus: 0,
    customer_multiplier_bonus: 0,
    enables_cider: true,
    is_permanent: true,
    available_month: 9  // September
  },
  taster_handbook: {
    name: "Taster's Handbook",
    description: "Free batch tasting with detailed feedback hints",
    cost: 500,
    serve_multiplier_bonus: 0,
    customer_multiplier_bonus: 0,
    enables_free_tasting: true,
    is_permanent: true
  }
};

// Calculate total serve multiplier from upgrades
export const calculateServeMultiplier = (ownedUpgrades) => {
  let multiplier = DEFAULT_SERVE_MULTIPLIER;

  // Add permanent upgrades
  Object.keys(ownedUpgrades || {}).forEach(upgradeKey => {
    if (ownedUpgrades[upgradeKey] && UPGRADES[upgradeKey] && UPGRADES[upgradeKey].is_permanent) {
      multiplier += UPGRADES[upgradeKey].serve_multiplier_bonus;
    }
  });

  return multiplier;
};

// Calculate customer multiplier bonus from upgrades (includes active consumables)
export const calculateUpgradeCustomerBonus = (ownedUpgrades, activeEffects = {}) => {
  let bonus = 0;

  // Add permanent upgrades
  Object.keys(ownedUpgrades || {}).forEach(upgradeKey => {
    if (ownedUpgrades[upgradeKey] && UPGRADES[upgradeKey] && UPGRADES[upgradeKey].is_permanent) {
      bonus += UPGRADES[upgradeKey].customer_multiplier_bonus;
    }
  });

  // Add active ad campaign
  if (activeEffects.ad_campaign_active && activeEffects.ad_campaign_days_left > 0) {
    bonus += UPGRADES.ad_campaign.customer_multiplier_bonus;
  }

  return bonus;
};

// ====================
// RECIPE CONSTANTS
// ====================

// Perfect lemonade ratio (per serving)
export const PERFECT_RECIPE = {
  water_oz: 6,
  lemon_juice_oz: 2,
  sugar_oz: 1,        // 1 oz = ~28.35 grams
  sugar_grams: 25     // Perfect amount in grams
};

// Perfect cider recipe (per 8 oz serving)
export const CIDER_RECIPE = {
  apple_cider_oz: 8,      // 8 oz per serving
  cider_per_lb_apples: 20, // 1 lb of apples yields 20 oz of cider
  requires_cinnamon: true  // Each serving needs 1 cinnamon stick (mug)
};

// Conversion constants
export const CONVERSIONS = {
  oz_to_grams: 28.35,
  grams_to_oz: 0.035274,
  lbs_to_grams: 453.592,
  grams_to_lbs: 0.00220462,
  grams_to_kg: 0.001,
  kg_to_grams: 1000
};

// ====================
// JUICER MULTIPLIERS
// ====================

// How much juice (in oz) each lemon yields based on juicer level
export const JUICER_YIELD = {
  hand: 1.5,        // 1 oz per lemon
  electric: 2.5,    // 2 oz per lemon
  commercial: 4,  // 4 oz per lemon
  industrial: 7   // 7 oz per lemon
};

// ====================
// LEMON TYPE MULTIPLIERS
// ====================

// Quality impact of lemon types
export const LEMON_QUALITY = {
  normal: {
    sweetness: 1.0,
    sourness: 1.0,
    juice_quality: 1.0
  },
  sour: {
    sweetness: 0.7,
    sourness: 1.3,
    juice_quality: 1.1  // Sour lemons have slightly more intense flavor
  },
  sweet: {
    sweetness: 1.3,
    sourness: 0.7,
    juice_quality: 1.1  // Sweet lemons have slightly more intense flavor
  }
};

// ====================
// QUALITY CALCULATION
// ====================

// How far from perfect ratio affects quality (0-1 scale)
// 1.0 = perfect, 0 = terrible
export const QUALITY_TOLERANCE = {
  // How much deviation from perfect is acceptable
  water_tolerance: 0.3,      // ±30% from perfect water ratio
  juice_tolerance: 0.2,      // ±20% from perfect juice ratio
  sugar_tolerance: 0.25,     // ±25% from perfect sugar ratio

  // Penalty multipliers for being off-ratio
  water_penalty: 0.8,        // Less critical
  juice_penalty: 1.2,        // More important
  sugar_penalty: 1.0,        // Medium importance

  // Balance bonuses
  balance_bonus: 1.15,       // 15% bonus for perfect balance

  // Lemon type diversity bonus
  diversity_bonus: 1.05      // 5% bonus for using multiple lemon types
};

// Quality score display thresholds
export const QUALITY_TIERS = {
  excellent: 90,    // 90-100
  good: 75,         // 75-89
  decent: 60,       // 60-74
  poor: 40,         // 40-59
  terrible: 0       // 0-39
};

// ====================
// LOCATION PERMITS
// ====================

// Permit costs for each location (driveway is free, no permit needed)
export const PERMIT_COSTS = {
  location_localpark: 15.00,
  location_fleamarket: 30.00,
  location_downtownpark: 50.00,
  location_farmersmarket: 75.00,
  location_conventioncenter: 150.00,
  location_stadium: 3000.00
};

// Location information
export const LOCATION_INFO = {
  location_driveway: {
    name: 'Your Driveway',
    description: 'Sell from your own driveway. Free to use, no permit required!',
    permit_required: false,
    unlock_cost: 0
  },
  location_localpark: {
    name: 'Local Park',
    description: 'A quiet neighborhood park with families and dog walkers.',
    permit_required: true,
    unlock_cost: 15.00
  },
  location_fleamarket: {
    name: 'Flea Market',
    description: 'Busy weekend market with bargain hunters.',
    permit_required: true,
    unlock_cost: 30.00
  },
  location_downtownpark: {
    name: 'Downtown Park',
    description: 'Popular urban park with lunch crowds and tourists.',
    permit_required: true,
    unlock_cost: 50.00
  },
  location_farmersmarket: {
    name: "Farmer's Market",
    description: 'Premium market with health-conscious shoppers.',
    permit_required: true,
    unlock_cost: 75.00
  },
  location_conventioncenter: {
    name: 'Convention Center',
    description: 'Large events with captive audiences.',
    permit_required: true,
    unlock_cost: 150.00
  },
  location_stadium: {
    name: 'Stadium',
    description: 'Major sporting events with huge crowds.',
    permit_required: true,
    unlock_cost: 300.00
  }
};

// ====================
// CUSTOMER MULTIPLIERS
// ====================

// BASE traffic multipliers (modified by day of week and events)
// These are hidden from players
export const BASE_LOCATION_TRAFFIC = {
  location_driveway: 1.0,
  location_localpark: 1.5,
  location_fleamarket: 0.3,      // Low except Sundays
  location_downtownpark: 1.0,    // Low except during weekly events
  location_farmersmarket: 1.0,   // Low except Saturdays
  location_conventioncenter: 0.5, // Low except during events
  location_stadium: 0.5          // Low except during games
};

// Day-of-week traffic multipliers by location
export const DAY_OF_WEEK_MULTIPLIERS = {
  location_driveway: {
    Monday: 1.0,
    Tuesday: 1.0,
    Wednesday: 1.0,
    Thursday: 1.0,
    Friday: 1.0,
    Saturday: 1.5,
    Sunday: 1.5
  },
  location_localpark: {
    Monday: 1.0,
    Tuesday: 1.0,
    Wednesday: 1.0,
    Thursday: 1.0,
    Friday: 1.0,
    Saturday: 2.5,
    Sunday: 2.5
  },
  location_fleamarket: {
    Monday: 1.0,
    Tuesday: 1.0,
    Wednesday: 1.0,
    Thursday: 1.0,
    Friday: 1.0,
    Saturday: 1.0,
    Sunday: 10.0  // 0.3 * 10 = 3x on Sundays
  },
  location_downtownpark: {
    Monday: 1.0,
    Tuesday: 1.0,
    Wednesday: 1.0,
    Thursday: 1.0,
    Friday: 1.0,
    Saturday: 1.0,
    Sunday: 1.0
  },
  location_farmersmarket: {
    Monday: 1.0,
    Tuesday: 1.0,
    Wednesday: 1.0,
    Thursday: 1.0,
    Friday: 1.0,
    Saturday: 4.0,  // 1.0 * 4 = 4x on Saturdays
    Sunday: 1.0
  },
  location_conventioncenter: {
    Monday: 1.0,
    Tuesday: 1.0,
    Wednesday: 1.0,
    Thursday: 1.0,
    Friday: 1.0,
    Saturday: 1.0,
    Sunday: 1.0
    // Event days: 10x (0.5 * 10 = 5x)
  },
  location_stadium: {
    Monday: 1.0,
    Tuesday: 1.0,
    Wednesday: 1.0,
    Thursday: 1.0,
    Friday: 1.0,
    Saturday: 1.0,
    Sunday: 1.0
    // Game days: 30x (0.5 * 30 = 15x)
  }
};

// Event multipliers (applied on special event days)
export const EVENT_MULTIPLIERS = {
  convention: 10.0,       // 0.5 * 10 = 5x traffic
  stadium: 30.0,          // 0.5 * 30 = 15x traffic
  downtown_event: 5.0     // 1.0 * 5 = 5x traffic
};

// Legacy export for backwards compatibility (use getLocationTraffic instead)
export const LOCATION_TRAFFIC = BASE_LOCATION_TRAFFIC;

// Price sensitivity by location (customer tolerance for high prices)
export const PRICE_SENSITIVITY = {
  location_driveway: 0.9,           // Neighbors are more price tolerant
  location_localpark: 0.6,
  location_fleamarket: 0.7,
  location_downtownpark: 0.8,
  location_farmersmarket: 0.9,
  location_conventioncenter: 1.2,   // Less price sensitive (willing to pay more)
  location_stadium: 1.5             // Captive audience
};

// Quality sensitivity by location (how much customers care about quality)
export const QUALITY_SENSITIVITY = {
  location_driveway: 0.7,           // Kids/neighbors, less picky
  location_localpark: 0.8,
  location_fleamarket: 0.9,
  location_downtownpark: 1.0,
  location_farmersmarket: 1.3,      // Health-conscious customers
  location_conventioncenter: 1.1,
  location_stadium: 0.6             // Just want something cold
};

// ====================
// WEATHER SYSTEM
// ====================

// Temperature ranges by month (in Fahrenheit)
export const TEMP_RANGES = {
  3: { min: 55, max: 75, name: 'March' },      // March - Early spring
  4: { min: 60, max: 80, name: 'April' },      // April - Mid spring
  5: { min: 70, max: 95, name: 'May' },        // May - Late spring, getting warm
  6: { min: 75, max: 95, name: 'June' },       // June - Early summer, hot days begin
  7: { min: 79, max: 98, name: 'July' },       // July - Peak summer heat
  8: { min: 79, max: 98, name: 'August' },     // August - Continued peak heat
  9: { min: 60, max: 85, name: 'September' },  // September - Early fall, still warm
  10: { min: 45, max: 70, name: 'October' }    // October - Fall cooling
};

// Heatwave temperature ranges (June, July, August)
export const HEATWAVE_TEMP = {
  min: 99,
  max: 115
};

// Temperature change values (randomly selected each day)
export const TEMP_CHANGE_OPTIONS = [1, 1, 1, 1, 2, 2, 3, 4, 5];

// Weather types and their multipliers
export const WEATHER_TYPES = {
  sunny: {
    name: 'Sunny',
    icon: '☀️',
    multiplier: 1.5,
    thirst_modifier: 0.3
  },
  partly_cloudy: {
    name: 'Partly Cloudy',
    icon: '⛅',
    multiplier: 1.2,
    thirst_modifier: 0.15
  },
  cloudy: {
    name: 'Cloudy',
    icon: '☁️',
    multiplier: 0.9,
    thirst_modifier: 0
  },
  rainy: {
    name: 'Rainy',
    icon: '🌧️',
    multiplier: 0.3,
    thirst_modifier: -0.2
  }
};

// ====================
// CUSTOMER GENERATION
// ====================

// Base customer counts (before location/day/weather multipliers)
export const BASE_CUSTOMER_COUNT = {
  min: 50,
  max: 60
};

// Temperature-based customer modifiers
export const TEMP_CUSTOMER_MODIFIERS = {
  // temp < 50: decrease thirst by 0.6, increase quality min by 15
  very_cold: {
    temp_max: 49,
    thirst_modifier: -0.6,
    quality_min_increase: 15
  },
  // 50-59: decrease thirst by 0.3, increase quality min by 10
  cold: {
    temp_min: 50,
    temp_max: 59,
    thirst_modifier: -0.3,
    quality_min_increase: 10
  },
  // 60-69: no thirst change, increase quality min by 5
  cool: {
    temp_min: 60,
    temp_max: 69,
    thirst_modifier: 0,
    quality_min_increase: 5
  },
  // 70-79: increase thirst by 0.07, no quality change
  warm: {
    temp_min: 70,
    temp_max: 79,
    thirst_modifier: 0.07,
    quality_min_increase: 0
  },
  // 80-89: increase thirst by 0.15, decrease quality min by 10
  hot: {
    temp_min: 80,
    temp_max: 89,
    thirst_modifier: 0.15,
    quality_min_increase: -10
  },
  // 90-100: increase thirst by 0.7, decrease quality min by 20
  very_hot: {
    temp_min: 90,
    temp_max: 100,
    thirst_modifier: 0.7,
    quality_min_increase: -20
  },
  // >100: increase thirst by 0.9, decrease quality min by 30
  extreme: {
    temp_min: 101,
    thirst_modifier: 0.9,
    quality_min_increase: -30
  }
};

// Customer thirst level ranges
export const THIRST_LEVEL_RANGE = {
  min: 20,
  max: 30

};

// Customer quality expectation ranges
export const QUALITY_EXPECTATION_RANGE = {
  min: 80,
  max: 100
};

// Price willingness based on thirst level (max price per oz)
export const PRICE_WILLINGNESS = [
  { thirst_min: 0, thirst_max: 19, max_price_per_oz: 0.15 },
  { thirst_min: 20, thirst_max: 25, max_price_per_oz: 0.20 },
  { thirst_min: 26, thirst_max: 39, max_price_per_oz: 0.30 },
  { thirst_min: 40, thirst_max: 59, max_price_per_oz: 0.50 },
  { thirst_min: 60, thirst_max: 60, max_price_per_oz: 0.80 },
  { thirst_min: 61, thirst_max: 999, max_price_per_oz: 1.25 }
];

// Tip amounts (randomly selected when customer is satisfied)
export const TIP_AMOUNTS = [0.25, 0.25, 0.25, 0.25, 0.5, 0.5, 0.5, 1, 1, 2, 5];

// Cup sizes
export const CUP_SIZES = {
  small: {
    name: '10 oz',
    size_oz: 10,
    inventory_key: 'ten_oz'
  },
  medium: {
    name: '16 oz',
    size_oz: 16,
    inventory_key: 'sixteen_oz'
  },
  large: {
    name: '24 oz',
    size_oz: 24,
    inventory_key: 'twentyfour_oz'
  }
};

// Cup size selection logic based on thirst level
// If thirst is 3+ higher than threshold, 75% chance for medium/large
export const THIRST_CUP_SIZE_THRESHOLD = 3;

// Tip chances
export const TIP_CHANCE_HIGH = 0.75;  // 75% if quality met and thirst 3+ over threshold
export const TIP_CHANCE_LOW = 0.20;   // 20% if quality met but lower thirst

// Review chances
export const REVIEW_CHANCE_SATISFIED = 0.10;  // 10% for 5-star if quality met
export const REVIEW_CHANCE_UNSATISFIED = 0.25; // 25% for 1-4 star if quality not met

// Review-based customer traffic multipliers
export const REVIEW_RATING_MULTIPLIERS = [
  { rating_min: 4.8, rating_max: 5.0, multiplier: 1.5 },    // Excellent reviews
  { rating_min: 4.5, rating_max: 4.79, multiplier: 1.24 },  // Great reviews
  { rating_min: 4.0, rating_max: 4.49, multiplier: 1.1 },   // Good reviews
  { rating_min: 3.0, rating_max: 3.99, multiplier: 1.0 },   // Average reviews (no change)
  { rating_min: 2.0, rating_max: 2.99, multiplier: 0.7 },   // Poor reviews (-0.3)
  { rating_min: 0, rating_max: 1.99, multiplier: 0.5 }      // Terrible reviews (-0.5)
];

// Weather probabilities by temperature range
export const WEATHER_PROBABILITIES = {
  // Probabilities add up to 100
  cold: { // Below 50°F
    sunny: 30,
    partly_cloudy: 30,
    cloudy: 25,
    rainy: 15
  },
  cool: { // 50-65°F
    sunny: 40,
    partly_cloudy: 30,
    cloudy: 20,
    rainy: 10
  },
  mild: { // 65-75°F
    sunny: 50,
    partly_cloudy: 30,
    cloudy: 15,
    rainy: 5
  },
  warm: { // 75-85°F
    sunny: 60,
    partly_cloudy: 25,
    cloudy: 10,
    rainy: 5
  },
  hot: { // 85-95°F
    sunny: 70,
    partly_cloudy: 20,
    cloudy: 7,
    rainy: 3
  },
  very_hot: { // 95°F+
    sunny: 80,
    partly_cloudy: 15,
    cloudy: 4,
    rainy: 1
  }
};

// Legacy exports for backwards compatibility
export const DAY_OF_WEEK_TRAFFIC = {
  Monday: 0.6,
  Tuesday: 0.7,
  Wednesday: 0.8,
  Thursday: 0.9,
  Friday: 1.2,
  Saturday: 1.5,
  Sunday: 1.3
};

export const WEATHER_MULTIPLIERS = {
  sunny: WEATHER_TYPES.sunny.multiplier,
  partly_cloudy: WEATHER_TYPES.partly_cloudy.multiplier,
  cloudy: WEATHER_TYPES.cloudy.multiplier,
  rainy: WEATHER_TYPES.rainy.multiplier
};

// ====================
// HELPER FUNCTIONS
// ====================

// Convert lbs to grams
export const lbsToGrams = (lbs) => lbs * CONVERSIONS.lbs_to_grams;

// Convert grams to lbs
export const gramsToLbs = (grams) => grams * CONVERSIONS.grams_to_lbs;

// Convert oz to grams
export const ozToGrams = (oz) => oz * CONVERSIONS.oz_to_grams;

// Convert grams to oz
export const gramsToOz = (grams) => grams * CONVERSIONS.grams_to_oz;

// Format sugar amount for display (show grams or kg)
export const formatSugarAmount = (grams) => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${Math.round(grams)} g`;
};

// Get juice yield for a juicer level
export const getJuiceYield = (juicerLevel) => {
  return JUICER_YIELD[juicerLevel] || JUICER_YIELD.hand;
};

// Calculate total juice from lemons
export const calculateJuiceYield = (lemons, juicerLevel) => {
  const yieldPerLemon = getJuiceYield(juicerLevel);
  const totalLemons = (lemons.normal || 0) + (lemons.sour || 0) + (lemons.sweet || 0);
  return totalLemons * yieldPerLemon;
};

// Get review-based traffic multiplier
export const getReviewMultiplier = (averageRating) => {
  if (!averageRating || averageRating === 0) {
    return 1.0; // No reviews yet, no multiplier
  }

  for (const tier of REVIEW_RATING_MULTIPLIERS) {
    if (averageRating >= tier.rating_min && averageRating <= tier.rating_max) {
      return tier.multiplier;
    }
  }

  return 1.0; // Default
};

// Calculate actual traffic multiplier for a location on a given day
export const getLocationTraffic = (locationKey, dayName, events, month, day) => {
  // Get base traffic
  const baseTraffic = BASE_LOCATION_TRAFFIC[locationKey] || 1.0;

  // Get day of week multiplier
  const dayMultipliers = DAY_OF_WEEK_MULTIPLIERS[locationKey] || {};
  const dayMultiplier = dayMultipliers[dayName] || 1.0;

  // Check for special events
  let eventMultiplier = 1.0;
  if (events) {
    // Check convention center events
    if (locationKey === 'location_conventioncenter') {
      const hasConvention = events.convention_events?.some(
        e => e.month === month && e.day === day
      );
      if (hasConvention) {
        eventMultiplier = EVENT_MULTIPLIERS.convention;
      }
    }

    // Check stadium events
    if (locationKey === 'location_stadium') {
      const hasGame = events.stadium_events?.some(
        e => e.month === month && e.day === day
      );
      if (hasGame) {
        eventMultiplier = EVENT_MULTIPLIERS.stadium;
      }
    }

    // Check downtown park events
    if (locationKey === 'location_downtownpark') {
      const hasEvent = events.downtown_events?.some(
        e => e.month === month && e.day === day
      );
      if (hasEvent) {
        eventMultiplier = EVENT_MULTIPLIERS.downtown_event;
      }
    }
  }

  return baseTraffic * dayMultiplier * eventMultiplier;
};
