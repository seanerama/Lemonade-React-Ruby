// Shop item categories and pricing

export const SHOP_CATEGORIES = {
  LEMONS: 'lemons',
  SUGAR: 'sugar',
  CUPS: 'cups',
  CONTAINERS: 'containers',
  EQUIPMENT: 'equipment',
  UPGRADES: 'upgrades'
};

export const SHOP_ITEMS = {
  // Lemons
  lemons_normal: {
    id: 'lemons_normal',
    name: 'Normal Lemons',
    category: SHOP_CATEGORIES.LEMONS,
    price: 0.50,
    unit: 'each',
    description: 'Standard lemons, reliable taste',
    inventoryKey: 'lemons.normal'
  },
  lemons_sour: {
    id: 'lemons_sour',
    name: 'Sour Lemons',
    category: SHOP_CATEGORIES.LEMONS,
    price: 0.40,
    unit: 'each',
    description: 'Extra sour, strong flavor',
    inventoryKey: 'lemons.sour'
  },
  lemons_sweet: {
    id: 'lemons_sweet',
    name: 'Sweet Lemons',
    category: SHOP_CATEGORIES.LEMONS,
    price: 0.60,
    unit: 'each',
    description: 'Sweeter variety, less acidic',
    inventoryKey: 'lemons.sweet'
  },

  // Sugar
  sugar_lbs: {
    id: 'sugar_lbs',
    name: 'Sugar',
    category: SHOP_CATEGORIES.SUGAR,
    price: 1.50,
    unit: 'lb',
    description: 'White granulated sugar',
    inventoryKey: 'sugar_lbs'
  },

  // Apples
  apples_lbs: {
    id: 'apples_lbs',
    name: 'Apples',
    category: SHOP_CATEGORIES.LEMONS,  // Use LEMONS category for produce
    price: 2.00,
    unit: 'lb',
    description: 'Fresh apples for cider (1 lb = 20 oz cider)',
    inventoryKey: 'apples_lbs'
  },

  // Cups
  cups_ten_oz: {
    id: 'cups_ten_oz',
    name: '10 oz Cups',
    category: SHOP_CATEGORIES.CUPS,
    price: 0.10,
    unit: 'each',
    description: 'Small paper cups',
    inventoryKey: 'cups.ten_oz'
  },
  cups_sixteen_oz: {
    id: 'cups_sixteen_oz',
    name: '16 oz Cups',
    category: SHOP_CATEGORIES.CUPS,
    price: 0.15,
    unit: 'each',
    description: 'Medium paper cups',
    inventoryKey: 'cups.sixteen_oz'
  },
  cups_twentyfour_oz: {
    id: 'cups_twentyfour_oz',
    name: '24 oz Cups',
    category: SHOP_CATEGORIES.CUPS,
    price: 0.20,
    unit: 'each',
    description: 'Large paper cups',
    inventoryKey: 'cups.twentyfour_oz'
  },
  mugs_cinnamon: {
    id: 'mugs_cinnamon',
    name: 'Mugs w/ Cinnamon Stick',
    category: SHOP_CATEGORIES.CUPS,
    price: 0.75,
    unit: 'each',
    description: '8 oz mugs with cinnamon sticks for cider',
    inventoryKey: 'mugs_cinnamon'
  },

  // Containers
  container_one_gal: {
    id: 'container_one_gal',
    name: '1 Gallon Container',
    category: SHOP_CATEGORIES.CONTAINERS,
    price: 5.00,
    unit: 'each',
    description: 'Small storage container (128 oz)',
    inventoryKey: 'containers.one_gal'
  },
  container_five_gal: {
    id: 'container_five_gal',
    name: '5 Gallon Container',
    category: SHOP_CATEGORIES.CONTAINERS,
    price: 15.00,
    unit: 'each',
    description: 'Medium storage container (640 oz)',
    inventoryKey: 'containers.five_gal'
  },
  container_barrel: {
    id: 'container_barrel',
    name: 'Barrel',
    category: SHOP_CATEGORIES.CONTAINERS,
    price: 50.00,
    unit: 'each',
    description: 'Large barrel (55 gallons)',
    inventoryKey: 'containers.barrel'
  },
  container_tanker: {
    id: 'container_tanker',
    name: 'Tanker',
    category: SHOP_CATEGORIES.CONTAINERS,
    price: 500.00,
    unit: 'each',
    description: 'Industrial tanker (500 gallons)',
    inventoryKey: 'containers.tanker'
  },

  // Equipment
  juicer_hand: {
    id: 'juicer_hand',
    name: 'Hand Juicer',
    category: SHOP_CATEGORIES.EQUIPMENT,
    price: 10.00,
    unit: 'each',
    description: 'Basic manual juicer (starting equipment)',
    inventoryKey: 'juicer_level',
    inventoryValue: 'hand',
    isUpgrade: true
  },
  juicer_electric: {
    id: 'juicer_electric',
    name: 'Electric Juicer',
    category: SHOP_CATEGORIES.EQUIPMENT,
    price: 75.00,
    unit: 'each',
    description: 'Faster electric juicer',
    inventoryKey: 'juicer_level',
    inventoryValue: 'electric',
    isUpgrade: true,
    requires: 'hand'
  },
  juicer_commercial: {
    id: 'juicer_commercial',
    name: 'Commercial Juicer',
    category: SHOP_CATEGORIES.EQUIPMENT,
    price: 300.00,
    unit: 'each',
    description: 'Professional-grade juicer',
    inventoryKey: 'juicer_level',
    inventoryValue: 'commercial',
    isUpgrade: true,
    requires: 'electric'
  },
  juicer_industrial: {
    id: 'juicer_industrial',
    name: 'Industrial Juicer',
    category: SHOP_CATEGORIES.EQUIPMENT,
    price: 1500.00,
    unit: 'each',
    description: 'High-capacity industrial juicer',
    inventoryKey: 'juicer_level',
    inventoryValue: 'industrial',
    isUpgrade: true,
    requires: 'commercial'
  },

  // Upgrades
  upgrade_glass_dispenser: {
    id: 'upgrade_glass_dispenser',
    name: 'Glass Beverage Dispenser',
    category: SHOP_CATEGORIES.UPGRADES,
    price: 100.00,
    unit: 'one-time',
    description: 'Speeds up serving time (+50 customers)',
    inventoryKey: 'upgrades.glass_dispenser',
    isUpgrade: true,
    upgradeKey: 'glass_dispenser'
  },
  upgrade_cash_drawer: {
    id: 'upgrade_cash_drawer',
    name: 'Cash Drawer',
    category: SHOP_CATEGORIES.UPGRADES,
    price: 200.00,
    unit: 'one-time',
    description: 'Organized cash handling (+50 customers)',
    inventoryKey: 'upgrades.cash_drawer',
    isUpgrade: true,
    upgradeKey: 'cash_drawer'
  },
  upgrade_pos_system: {
    id: 'upgrade_pos_system',
    name: 'Point of Sale with Card Pay',
    category: SHOP_CATEGORIES.UPGRADES,
    price: 2500.00,
    unit: 'one-time',
    description: 'Modern payment processing (+150 customers, +20% traffic)',
    inventoryKey: 'upgrades.pos_system',
    isUpgrade: true,
    upgradeKey: 'pos_system'
  },
  upgrade_frozen_machine: {
    id: 'upgrade_frozen_machine',
    name: 'Frozen Drink Machine',
    category: SHOP_CATEGORIES.UPGRADES,
    price: 3500.00,
    unit: 'one-time',
    description: 'Sell frozen lemonade for 2x price (20oz, 50% 5-star chance)',
    inventoryKey: 'upgrades.frozen_machine',
    isUpgrade: true,
    upgradeKey: 'frozen_machine'
  },
  upgrade_second_location: {
    id: 'upgrade_second_location',
    name: 'Second Location',
    category: SHOP_CATEGORIES.UPGRADES,
    price: 10000.00,
    unit: 'one-time',
    description: 'Sell at 2 locations per day (max 2 days per week)',
    inventoryKey: 'upgrades.second_location',
    isUpgrade: true,
    upgradeKey: 'second_location'
  },
  upgrade_ad_campaign: {
    id: 'upgrade_ad_campaign',
    name: 'Ad Campaign',
    category: SHOP_CATEGORIES.UPGRADES,
    price: 2500.00,
    unit: 'consumable',
    description: '+0.8 customer multiplier for 3 days (1x per week)',
    inventoryKey: 'active_effects.ad_campaign',
    isConsumable: true,
    upgradeKey: 'ad_campaign'
  },
  upgrade_cashier: {
    id: 'upgrade_cashier',
    name: 'Hire Cashier',
    category: SHOP_CATEGORIES.UPGRADES,
    price: 220.00,
    unit: 'per use',
    description: '+400 customers served for today only',
    inventoryKey: 'active_effects.cashier',
    isConsumable: true,
    upgradeKey: 'cashier'
  },
  upgrade_chilled_dispenser: {
    id: 'upgrade_chilled_dispenser',
    name: 'Chilled Commercial Beverage Dispenser',
    category: SHOP_CATEGORIES.UPGRADES,
    price: 1000.00,
    unit: 'one-time',
    description: 'High-capacity chilled serving system (+1000 customers)',
    inventoryKey: 'upgrades.chilled_dispenser',
    isUpgrade: true,
    upgradeKey: 'chilled_dispenser'
  },
  upgrade_lemonade_robot: {
    id: 'upgrade_lemonade_robot',
    name: 'Lemonade Robot',
    category: SHOP_CATEGORIES.UPGRADES,
    price: 10000.00,
    unit: 'one-time',
    description: 'Automated kitchen assistant - makes perfect lemonade with your ingredients',
    inventoryKey: 'upgrades.lemonade_robot',
    isUpgrade: true,
    upgradeKey: 'lemonade_robot'
  },
  upgrade_cider_maker: {
    id: 'upgrade_cider_maker',
    name: 'Cider Making Equipment',
    category: SHOP_CATEGORIES.UPGRADES,
    price: 2500.00,
    unit: 'one-time',
    description: 'Brew warm apple cider - sells better in cold weather! (Available Sep 1+)',
    inventoryKey: 'upgrades.cider_maker',
    isUpgrade: true,
    upgradeKey: 'cider_maker',
    availableMonth: 9  // September
  },
  upgrade_tasters_guidebook: {
    id: 'upgrade_tasters_guidebook',
    name: "Lemonade Taster's GuideBook",
    category: SHOP_CATEGORIES.UPGRADES,
    price: 150.00,
    unit: 'one-time',
    description: 'Get helpful hints before mixing to perfect your recipe!',
    inventoryKey: 'upgrades.tasters_guidebook',
    isUpgrade: true,
    upgradeKey: 'tasters_guidebook'
  },
  upgrade_taster_handbook: {
    id: 'upgrade_taster_handbook',
    name: "Taster's Handbook",
    category: SHOP_CATEGORIES.UPGRADES,
    price: 500.00,
    unit: 'one-time',
    description: 'Taste batches for FREE with detailed feedback hints to perfect your lemonade!',
    inventoryKey: 'upgrades.taster_handbook',
    isUpgrade: true,
    upgradeKey: 'taster_handbook'
  }
};

// Helper function to get items by category
export const getItemsByCategory = (category) => {
  return Object.values(SHOP_ITEMS).filter(item => item.category === category);
};

// Helper function to get all categories
export const getAllCategories = () => {
  return Object.values(SHOP_CATEGORIES);
};
