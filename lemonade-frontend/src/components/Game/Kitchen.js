import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { getGame, updateGame } from '../../services/api';
import {
  PERFECT_RECIPE,
  JUICER_YIELD,
  LEMON_QUALITY,
  QUALITY_TOLERANCE,
  lbsToGrams,
  gramsToLbs,
  formatSugarAmount,
  getJuiceYield,
  calculateJuiceYield
} from '../../constants/gameMultipliers';
import '../../styles/Kitchen.css';

// Container capacities in ounces
const CONTAINER_CAPACITIES = {
  one_gal: 128,      // 1 gallon = 128 oz
  five_gal: 640,     // 5 gallons = 640 oz
  barrel: 7040,      // 55 gallons = 7040 oz
  tanker: 64000      // 500 gallons = 64000 oz
};

const CONTAINER_NAMES = {
  one_gal: '1 Gallon Container',
  five_gal: '5 Gallon Container',
  barrel: 'Barrel (55 gal)',
  tanker: 'Tanker (500 gal)'
};

// Maximum reuse counts for each container type
const CONTAINER_MAX_USES = {
  one_gal: 2,
  five_gal: 5,
  barrel: 10,
  tanker: 99
};

function Kitchen() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mixing, setMixing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Lemonade recipe state
  const [selectedLemons, setSelectedLemons] = useState({
    normal: 0,
    sour: 0,
    sweet: 0
  });
  const [sugarGrams, setSugarGrams] = useState(0); // Sugar in grams for recipe
  const [waterAmount, setWaterAmount] = useState(0);
  const [selectedContainer, setSelectedContainer] = useState('one_gal');

  // Cider recipe state
  const [applesLbs, setApplesLbs] = useState(0);
  const [selectedCiderContainer, setSelectedCiderContainer] = useState('one_gal');

  // Container combining state
  const [selectedBatchesForCombine, setSelectedBatchesForCombine] = useState([]);
  const [combiningMode, setCombiningMode] = useState(false);

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

  const inventory = gameData?.game_data?.inventory || {};
  const availableLemons = inventory.lemons || { normal: 0, sour: 0, sweet: 0 };
  const availableSugarLbs = inventory.sugar_lbs || 0;
  const availableSugarGrams = lbsToGrams(availableSugarLbs);
  const availableApplesLbs = inventory.apples_lbs || 0;
  const availableMugsCinnamon = inventory.mugs_cinnamon || 0;
  const availableContainers = inventory.containers || { one_gal: 0, five_gal: 0, barrel: 0, tanker: 0 };
  const juicerLevel = inventory.juicer_level || 'hand';
  const upgrades = gameData?.game_data?.upgrades || {};

  // Lemonade calculations
  const totalLemons = selectedLemons.normal + selectedLemons.sour + selectedLemons.sweet;
  const totalLemonJuice = calculateJuiceYield(selectedLemons, juicerLevel);
  const totalMixture = totalLemonJuice + waterAmount; // Sugar dissolves, doesn't add volume significantly

  // Cider calculations (1 lb apples = 20 oz cider)
  const totalCiderOz = applesLbs * 20;

  const canMix = () => {
    // Must have at least one lemon
    if (totalLemons === 0) return false;

    // Must have sugar
    if (sugarGrams <= 0) return false;

    // Must have water
    if (waterAmount <= 0) return false;

    // Must have available container
    if (availableContainers[selectedContainer] <= 0) return false;

    // Check if we have enough ingredients
    if (selectedLemons.normal > availableLemons.normal) return false;
    if (selectedLemons.sour > availableLemons.sour) return false;
    if (selectedLemons.sweet > availableLemons.sweet) return false;
    if (sugarGrams > availableSugarGrams) return false;

    // Check if mixture fits in container
    const containerCapacity = CONTAINER_CAPACITIES[selectedContainer];
    if (totalMixture > containerCapacity) return false;

    return true;
  };

  // Calculate quality based on how close to perfect recipe ratios
  // Analyze recipe and provide feedback
  const analyzeRecipe = () => {
    if (totalMixture === 0) return { quality: 0, feedback: '', issues: [] };

    // Calculate actual ratios
    const actualWaterRatio = waterAmount / totalMixture;
    const actualJuiceRatio = totalLemonJuice / totalMixture;
    const actualSugarPerOz = sugarGrams / totalMixture;

    // Calculate perfect ratios
    const perfectTotal = PERFECT_RECIPE.water_oz + PERFECT_RECIPE.lemon_juice_oz;
    const perfectWaterRatio = PERFECT_RECIPE.water_oz / perfectTotal;
    const perfectJuiceRatio = PERFECT_RECIPE.lemon_juice_oz / perfectTotal;
    const perfectSugarPerOz = PERFECT_RECIPE.sugar_grams / perfectTotal;

    // Track issues
    const issues = [];

    // Check water ratio
    if (actualWaterRatio > perfectWaterRatio * 1.2) {
      issues.push('Too Weak - Too much water! Reduce water or add more lemons.');
    } else if (actualWaterRatio < perfectWaterRatio * 0.8) {
      issues.push('Too Strong - Not enough water! Add more water.');
    }

    // Check sugar ratio
    if (actualSugarPerOz > perfectSugarPerOz * 1.2) {
      issues.push('Too Sweet - Too much sugar! Reduce sugar.');
    } else if (actualSugarPerOz < perfectSugarPerOz * 0.8) {
      issues.push('Too Sour - Not enough sugar! Add more sugar.');
    }

    // Check juice ratio
    if (actualJuiceRatio > perfectJuiceRatio * 1.2) {
      issues.push('Too Sour - Too much lemon juice! Add more water.');
    } else if (actualJuiceRatio < perfectJuiceRatio * 0.8) {
      issues.push('Too Weak - Not enough lemon juice! Add more lemons.');
    }

    return { issues };
  };

  const calculateQuality = () => {
    if (totalMixture === 0) return 0;

    // Calculate actual ratios
    const actualWaterRatio = waterAmount / totalMixture;
    const actualJuiceRatio = totalLemonJuice / totalMixture;
    const actualSugarPerOz = sugarGrams / totalMixture;

    // Calculate perfect ratios
    const perfectTotal = PERFECT_RECIPE.water_oz + PERFECT_RECIPE.lemon_juice_oz;
    const perfectWaterRatio = PERFECT_RECIPE.water_oz / perfectTotal;
    const perfectJuiceRatio = PERFECT_RECIPE.lemon_juice_oz / perfectTotal;
    const perfectSugarPerOz = PERFECT_RECIPE.sugar_grams / perfectTotal;

    // Calculate deviations (0 = perfect, higher = worse)
    const waterDeviation = Math.abs(actualWaterRatio - perfectWaterRatio) / perfectWaterRatio;
    const juiceDeviation = Math.abs(actualJuiceRatio - perfectJuiceRatio) / perfectJuiceRatio;
    const sugarDeviation = Math.abs(actualSugarPerOz - perfectSugarPerOz) / perfectSugarPerOz;

    // Calculate scores (1.0 = perfect, 0 = terrible)
    const waterScore = Math.max(0, 1 - (waterDeviation / QUALITY_TOLERANCE.water_tolerance)) ** QUALITY_TOLERANCE.water_penalty;
    const juiceScore = Math.max(0, 1 - (juiceDeviation / QUALITY_TOLERANCE.juice_tolerance)) ** QUALITY_TOLERANCE.juice_penalty;
    const sugarScore = Math.max(0, 1 - (sugarDeviation / QUALITY_TOLERANCE.sugar_tolerance)) ** QUALITY_TOLERANCE.sugar_penalty;

    // Calculate lemon type quality
    let lemonTypeScore = 0;
    let totalQualityWeight = 0;
    if (selectedLemons.normal > 0) {
      const weight = selectedLemons.normal / totalLemons;
      lemonTypeScore += weight * LEMON_QUALITY.normal.juice_quality;
      totalQualityWeight += weight;
    }
    if (selectedLemons.sour > 0) {
      const weight = selectedLemons.sour / totalLemons;
      lemonTypeScore += weight * LEMON_QUALITY.sour.juice_quality;
      totalQualityWeight += weight;
    }
    if (selectedLemons.sweet > 0) {
      const weight = selectedLemons.sweet / totalLemons;
      lemonTypeScore += weight * LEMON_QUALITY.sweet.juice_quality;
      totalQualityWeight += weight;
    }
    lemonTypeScore = totalQualityWeight > 0 ? lemonTypeScore / totalQualityWeight : 1.0;

    // Diversity bonus (using multiple lemon types)
    const lemonTypesUsed = (selectedLemons.normal > 0 ? 1 : 0) +
                           (selectedLemons.sour > 0 ? 1 : 0) +
                           (selectedLemons.sweet > 0 ? 1 : 0);
    const diversityBonus = lemonTypesUsed >= 2 ? QUALITY_TOLERANCE.diversity_bonus : 1.0;

    // Check if all ratios are within tolerance for balance bonus
    const isBalanced = waterDeviation < QUALITY_TOLERANCE.water_tolerance &&
                       juiceDeviation < QUALITY_TOLERANCE.juice_tolerance &&
                       sugarDeviation < QUALITY_TOLERANCE.sugar_tolerance;
    const balanceBonus = isBalanced ? QUALITY_TOLERANCE.balance_bonus : 1.0;

    // Calculate final quality (0-100)
    const baseQuality = (waterScore + juiceScore + sugarScore) / 3;
    const finalQuality = baseQuality * lemonTypeScore * diversityBonus * balanceBonus * 100;

    return Math.round(Math.min(100, Math.max(0, finalQuality)));
  };

  const handleMix = async () => {
    if (!canMix()) return;

    setMixing(true);
    try {
      const newGameData = { ...gameData.game_data };

      // Deduct ingredients from inventory
      newGameData.inventory.lemons.normal -= selectedLemons.normal;
      newGameData.inventory.lemons.sour -= selectedLemons.sour;
      newGameData.inventory.lemons.sweet -= selectedLemons.sweet;
      newGameData.inventory.sugar_lbs -= gramsToLbs(sugarGrams);

      // Use one container
      newGameData.inventory.containers[selectedContainer] -= 1;

      // Calculate lemonade quality
      const quality = calculateQuality();

      // Create batch with date stamp
      const currentDate = new Date(
        `${newGameData.month_name} ${newGameData.day_num}, 2024`
      );

      const batch = {
        id: `batch_${Date.now()}`,
        created_on_day: newGameData.day_count,
        created_date: currentDate.toISOString(),
        container_type: selectedContainer,
        container_uses: 1,  // Track how many times this container has been used
        volume_oz: totalMixture,
        capacity_oz: CONTAINER_CAPACITIES[selectedContainer],
        recipe: {
          lemons: { ...selectedLemons },
          sugar_grams: sugarGrams,
          water_oz: waterAmount,
          juice_oz: totalLemonJuice,
          juicer_level: juicerLevel
        },
        quality: quality,
        remaining_oz: totalMixture
      };

      // Add batch to inventory
      if (!newGameData.inventory.lemonade_batches) {
        newGameData.inventory.lemonade_batches = [];
      }
      newGameData.inventory.lemonade_batches.push(batch);

      // Update game on server
      await updateGame(gameData.game_id, newGameData);

      // Reload game data
      await loadGame();

      // Reset form
      setSelectedLemons({ normal: 0, sour: 0, sweet: 0 });
      setSugarGrams(0);
      setWaterAmount(0);

      // Get feedback on quality
      const { issues } = analyzeRecipe();
      let message = `Successfully mixed ${totalMixture} oz of lemonade!\nQuality: ${quality}/100`;

      if (quality < 70 && issues.length > 0) {
        message += '\n\n⚠️ Quality Issues:\n' + issues.map(issue => `• ${issue}`).join('\n');
      } else if (quality >= 90) {
        message += '\n\n✨ Excellent quality!';
      } else if (quality >= 70) {
        message += '\n\n👍 Good quality!';
      }

      alert(message);
    } catch (error) {
      console.error('Failed to mix lemonade:', error);
      alert('Failed to mix lemonade. Please try again.');
    } finally {
      setMixing(false);
    }
  };

  const handleCombineBatches = async () => {
    if (selectedBatchesForCombine.length < 2) {
      alert('Please select at least 2 batches to combine');
      return;
    }

    setMixing(true);
    try {
      const newGameData = { ...gameData.game_data };
      const batches = newGameData.inventory.lemonade_batches || [];

      // Get the selected batch objects
      const batchesToCombine = selectedBatchesForCombine
        .map(id => batches.find(b => b.id === id))
        .filter(b => b != null);

      if (batchesToCombine.length < 2) {
        alert('Invalid batch selection');
        return;
      }

      // Calculate total volume and check if all batches use same container type
      const containerType = batchesToCombine[0].container_type;
      const allSameType = batchesToCombine.every(b => b.container_type === containerType);

      if (!allSameType) {
        alert('All batches must use the same container type to combine');
        setMixing(false);
        return;
      }

      const totalVolume = batchesToCombine.reduce((sum, b) => sum + b.remaining_oz, 0);
      const containerCapacity = CONTAINER_CAPACITIES[containerType];

      if (totalVolume > containerCapacity) {
        alert(`Total volume (${totalVolume} oz) exceeds container capacity (${containerCapacity} oz)`);
        setMixing(false);
        return;
      }

      // Find the oldest batch (earliest created_date) and highest container uses
      const oldestBatch = batchesToCombine.reduce((oldest, current) => {
        const oldestDate = new Date(oldest.created_date);
        const currentDate = new Date(current.created_date);
        return currentDate < oldestDate ? current : oldest;
      });

      const maxContainerUses = Math.max(...batchesToCombine.map(b => b.container_uses || 1));
      const containerMaxUses = CONTAINER_MAX_USES[containerType];

      if (maxContainerUses >= containerMaxUses) {
        alert(`One or more containers have already been used ${containerMaxUses} times and cannot be reused`);
        setMixing(false);
        return;
      }

      // Calculate weighted average quality based on volume
      const totalQualityWeight = batchesToCombine.reduce((sum, b) => sum + (b.quality * b.remaining_oz), 0);
      const combinedQuality = Math.round(totalQualityWeight / totalVolume);

      // Create combined batch using oldest batch's creation date
      const combinedBatch = {
        id: `batch_${Date.now()}`,
        created_on_day: oldestBatch.created_on_day,
        created_date: oldestBatch.created_date,  // Use oldest date
        container_type: containerType,
        container_uses: maxContainerUses + 1,  // Increment uses
        volume_oz: totalVolume,
        capacity_oz: containerCapacity,
        recipe: {
          // This is a combined batch, store recipes from original batches
          combined_from: batchesToCombine.map(b => ({
            batch_id: b.id,
            volume_oz: b.remaining_oz,
            recipe: b.recipe
          })),
          combined: true
        },
        quality: combinedQuality,
        remaining_oz: totalVolume
      };

      // Remove the combined batches and add the new one
      newGameData.inventory.lemonade_batches = batches.filter(
        b => !selectedBatchesForCombine.includes(b.id)
      );
      newGameData.inventory.lemonade_batches.push(combinedBatch);

      // Return empty containers (except one since we're still using it)
      const containersToReturn = batchesToCombine.length - 1;
      newGameData.inventory.containers[containerType] += containersToReturn;

      await updateGame(gameData.game_id, newGameData);
      await loadGame();

      setSelectedBatchesForCombine([]);
      setCombiningMode(false);

      alert(`Successfully combined ${batchesToCombine.length} batches!\n` +
            `Total Volume: ${totalVolume} oz\n` +
            `Quality: ${combinedQuality}/100\n` +
            `Container Uses: ${maxContainerUses + 1}/${containerMaxUses}\n` +
            `Age: Day ${oldestBatch.created_on_day}\n` +
            `Returned ${containersToReturn} empty containers`);
    } catch (error) {
      console.error('Failed to combine batches:', error);
      alert('Failed to combine batches. Please try again.');
    } finally {
      setMixing(false);
    }
  };

  const toggleBatchSelection = (batchId) => {
    setSelectedBatchesForCombine(prev => {
      if (prev.includes(batchId)) {
        return prev.filter(id => id !== batchId);
      } else {
        return [...prev, batchId];
      }
    });
  };

  // Tasting function - analyzes batch and provides feedback
  const handleTasteBatch = async (batch) => {
    if (mixing) return;

    const hasTasterHandbook = gameData?.game_data?.upgrades?.taster_handbook || false;
    const tasteCost = hasTasterHandbook ? 0 : 8; // 8oz cost without handbook

    // Check if batch has enough liquid
    if (batch.remaining_oz < tasteCost) {
      alert(`Not enough lemonade to taste! Need at least ${tasteCost} oz.`);
      return;
    }

    try {
      setMixing(true);

      // Calculate quality feedback based on recipe
      const recipe = batch.recipe;
      const totalOz = recipe.water_oz + recipe.juice_oz;

      const actualWaterRatio = recipe.water_oz / totalOz;
      const actualJuiceRatio = recipe.juice_oz / totalOz;
      const actualSugarPerOz = recipe.sugar_grams / totalOz;

      const perfectTotal = PERFECT_RECIPE.water_oz + PERFECT_RECIPE.lemon_juice_oz;
      const perfectWaterRatio = PERFECT_RECIPE.water_oz / perfectTotal;
      const perfectJuiceRatio = PERFECT_RECIPE.lemon_juice_oz / perfectTotal;
      const perfectSugarPerOz = PERFECT_RECIPE.sugar_grams / perfectTotal;

      // Calculate deviations
      const waterDeviation = (actualWaterRatio - perfectWaterRatio) / perfectWaterRatio;
      const juiceDeviation = (actualJuiceRatio - perfectJuiceRatio) / perfectJuiceRatio;
      const sugarDeviation = (actualSugarPerOz - perfectSugarPerOz) / perfectSugarPerOz;

      // Generate feedback
      let feedback = [];

      // Water feedback
      if (waterDeviation > 0.2) {
        feedback.push(hasTasterHandbook ?
          '💧 WAY TOO WEAK - Too much water! Add more lemons or sugar.' :
          '💧 WAY TOO WEAK');
      } else if (waterDeviation > 0.1) {
        feedback.push(hasTasterHandbook ?
          '💧 A little weak - Could use more lemons or sugar.' :
          '💧 A LITTLE WEAK');
      } else if (waterDeviation < -0.2) {
        feedback.push(hasTasterHandbook ?
          '💧 WAY TOO STRONG - Too little water! Add more water.' :
          '💧 WAY TOO STRONG');
      } else if (waterDeviation < -0.1) {
        feedback.push(hasTasterHandbook ?
          '💧 A little strong - Could use a bit more water.' :
          '💧 A LITTLE STRONG');
      }

      // Sugar feedback
      if (sugarDeviation > 0.2) {
        feedback.push(hasTasterHandbook ?
          '🍬 WAY TOO SWEET - Too much sugar! Add water or lemon juice.' :
          '🍬 WAY TOO SWEET');
      } else if (sugarDeviation > 0.1) {
        feedback.push(hasTasterHandbook ?
          '🍬 A little sweet - Could use slightly less sugar or more lemon.' :
          '🍬 A LITTLE SWEET');
      } else if (sugarDeviation < -0.2) {
        feedback.push(hasTasterHandbook ?
          '🍋 WAY TOO SOUR - Not enough sugar! Add more sugar.' :
          '🍋 WAY TOO SOUR');
      } else if (sugarDeviation < -0.1) {
        feedback.push(hasTasterHandbook ?
          '🍋 A little sour - Could use a bit more sugar.' :
          '🍋 A LITTLE SOUR');
      }

      // Juice feedback (combined with water in strength)
      if (juiceDeviation > 0.2) {
        feedback.push(hasTasterHandbook ?
          '🍋 WAY TOO SOUR - Too much lemon juice! Add water or sugar.' :
          '🍋 WAY TOO SOUR');
      } else if (juiceDeviation > 0.1) {
        feedback.push(hasTasterHandbook ?
          '🍋 A little sour - Could balance with water or sugar.' :
          '🍋 A LITTLE SOUR');
      }

      if (feedback.length === 0) {
        feedback.push('✨ PERFECT! This lemonade is balanced beautifully!');
      }

      // Deduct tasting cost if applicable
      if (tasteCost > 0) {
        const newGameData = { ...gameData.game_data };
        const batchIndex = newGameData.inventory.lemonade_batches.findIndex(b => b.id === batch.id);
        if (batchIndex !== -1) {
          newGameData.inventory.lemonade_batches[batchIndex].remaining_oz -= tasteCost;
          await updateGame(gameData.game_id, newGameData);
          await loadGame();
        }
      }

      // Show feedback
      const costText = tasteCost > 0 ? `\n\n(Tasted 8 oz - ${batch.remaining_oz - tasteCost} oz remaining)` : '\n\n(Free tasting with Taster\'s Handbook!)';
      alert(`🍋 Tasting Results 🍋\n\nQuality: ${batch.quality}/100\n\n${feedback.join('\n')}${costText}`);

    } catch (error) {
      console.error('Failed to taste batch:', error);
      alert('Failed to taste batch. Please try again.');
    } finally {
      setMixing(false);
    }
  };

  // Adjustment function - allows adding ingredients to existing batch
  const handleAdjustBatch = async (batch) => {
    if (mixing) return;

    const adjustmentOptions = [
      'Add Water',
      'Add Lemon Juice',
      'Add Sugar',
      'Cancel'
    ];

    const choice = window.prompt(
      `Adjust Batch (Quality: ${batch.quality}/100)\n\n` +
      `Current: ${batch.remaining_oz} oz remaining\n\n` +
      `What would you like to add?\n` +
      `1. Add Water (1 oz)\n` +
      `2. Add Lemon Juice (squeeze 1 lemon)\n` +
      `3. Add Sugar (25g)\n` +
      `4. Cancel\n\n` +
      `Enter 1, 2, 3, or 4:`
    );

    if (!choice || choice === '4') return;

    try {
      setMixing(true);
      const newGameData = { ...gameData.game_data };
      const batchIndex = newGameData.inventory.lemonade_batches.findIndex(b => b.id === batch.id);

      if (batchIndex === -1) {
        alert('Batch not found!');
        return;
      }

      const targetBatch = newGameData.inventory.lemonade_batches[batchIndex];
      const juicerLevel = newGameData.inventory?.juicer_level || 'hand';
      const juicePerLemon = getJuiceYield(juicerLevel);

      let updated = false;

      switch (choice) {
        case '1': // Add Water
          const waterToAdd = 1;
          if (targetBatch.remaining_oz + waterToAdd > targetBatch.capacity_oz) {
            alert('Not enough space in container!');
            return;
          }
          targetBatch.recipe.water_oz += waterToAdd;
          targetBatch.remaining_oz += waterToAdd;
          targetBatch.volume_oz += waterToAdd;
          updated = true;
          break;

        case '2': // Add Lemon Juice
          const totalAvailableLemons = (newGameData.inventory.lemons.normal || 0) +
                                       (newGameData.inventory.lemons.sour || 0) +
                                       (newGameData.inventory.lemons.sweet || 0);
          if (totalAvailableLemons < 1) {
            alert('No lemons available!');
            return;
          }
          if (targetBatch.remaining_oz + juicePerLemon > targetBatch.capacity_oz) {
            alert('Not enough space in container!');
            return;
          }

          // Deduct a normal lemon (or whatever's available)
          if (newGameData.inventory.lemons.normal > 0) {
            newGameData.inventory.lemons.normal -= 1;
          } else if (newGameData.inventory.lemons.sour > 0) {
            newGameData.inventory.lemons.sour -= 1;
          } else {
            newGameData.inventory.lemons.sweet -= 1;
          }

          targetBatch.recipe.juice_oz += juicePerLemon;
          targetBatch.remaining_oz += juicePerLemon;
          targetBatch.volume_oz += juicePerLemon;
          updated = true;
          break;

        case '3': // Add Sugar
          const sugarToAdd = 25; // grams
          if (newGameData.inventory.sugar_lbs < gramsToLbs(sugarToAdd)) {
            alert('Not enough sugar!');
            return;
          }
          newGameData.inventory.sugar_lbs -= gramsToLbs(sugarToAdd);
          targetBatch.recipe.sugar_grams += sugarToAdd;
          updated = true;
          break;

        default:
          return;
      }

      if (updated) {
        // Recalculate quality based on new recipe
        const totalOz = targetBatch.recipe.water_oz + targetBatch.recipe.juice_oz;
        const actualWaterRatio = targetBatch.recipe.water_oz / totalOz;
        const actualJuiceRatio = targetBatch.recipe.juice_oz / totalOz;
        const actualSugarPerOz = targetBatch.recipe.sugar_grams / totalOz;

        const perfectTotal = PERFECT_RECIPE.water_oz + PERFECT_RECIPE.lemon_juice_oz;
        const perfectWaterRatio = PERFECT_RECIPE.water_oz / perfectTotal;
        const perfectJuiceRatio = PERFECT_RECIPE.lemon_juice_oz / perfectTotal;
        const perfectSugarPerOz = PERFECT_RECIPE.sugar_grams / perfectTotal;

        const waterDeviation = Math.abs(actualWaterRatio - perfectWaterRatio) / perfectWaterRatio;
        const juiceDeviation = Math.abs(actualJuiceRatio - perfectJuiceRatio) / perfectJuiceRatio;
        const sugarDeviation = Math.abs(actualSugarPerOz - perfectSugarPerOz) / perfectSugarPerOz;

        const waterScore = Math.max(0, 1 - (waterDeviation / QUALITY_TOLERANCE.water_tolerance)) ** QUALITY_TOLERANCE.water_penalty;
        const juiceScore = Math.max(0, 1 - (juiceDeviation / QUALITY_TOLERANCE.juice_tolerance)) ** QUALITY_TOLERANCE.juice_penalty;
        const sugarScore = Math.max(0, 1 - (sugarDeviation / QUALITY_TOLERANCE.sugar_tolerance)) ** QUALITY_TOLERANCE.sugar_penalty;

        const baseQuality = (waterScore + juiceScore + sugarScore) / 3;
        const finalQuality = Math.round(Math.min(100, Math.max(0, baseQuality * 100)));

        const oldQuality = targetBatch.quality;
        targetBatch.quality = finalQuality;

        await updateGame(gameData.game_id, newGameData);
        await loadGame();

        const qualityChange = finalQuality - oldQuality;
        const changeText = qualityChange > 0 ? `+${qualityChange}` : qualityChange;
        alert(`Batch adjusted!\n\nQuality: ${oldQuality} → ${finalQuality} (${changeText})\nVolume: ${targetBatch.remaining_oz} oz`);
      }

    } catch (error) {
      console.error('Failed to adjust batch:', error);
      alert('Failed to adjust batch. Please try again.');
    } finally {
      setMixing(false);
    }
  };

  const adjustLemon = (type, delta) => {
    setSelectedLemons(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta)
    }));
  };

  const adjustSugar = (deltaGrams) => {
    setSugarGrams(prev => Math.max(0, Math.round(prev + deltaGrams)));
  };

  const adjustWater = (delta) => {
    setWaterAmount(prev => Math.max(0, prev + delta));
  };

  const adjustApples = (delta) => {
    setApplesLbs(prev => Math.max(0, Math.min(availableApplesLbs, prev + delta)));
  };

  // Cider brewing validation
  const canBrewCider = () => {
    // Must have cider maker upgrade
    if (!upgrades.cider_maker) return false;

    // Must have at least some apples
    if (applesLbs <= 0) return false;

    // Must have apples available
    if (applesLbs > availableApplesLbs) return false;

    // Must have available container
    if (availableContainers[selectedCiderContainer] <= 0) return false;

    // Check if cider fits in container
    const containerCapacity = CONTAINER_CAPACITIES[selectedCiderContainer];
    if (totalCiderOz > containerCapacity) return false;

    return true;
  };

  // Brew cider
  const handleBrewCider = async () => {
    if (!canBrewCider()) return;

    setMixing(true);
    try {
      const newGameData = { ...gameData.game_data };

      // Deduct apples from inventory
      newGameData.inventory.apples_lbs -= applesLbs;

      // Use one container
      newGameData.inventory.containers[selectedCiderContainer] -= 1;

      // Create cider batch
      const currentDate = new Date(
        `${newGameData.month_name} ${newGameData.day_num}, 2024`
      );

      const batch = {
        id: `cider_batch_${Date.now()}`,
        created_on_day: newGameData.day_count,
        created_date: currentDate.toISOString(),
        container_type: selectedCiderContainer,
        volume_oz: totalCiderOz,
        capacity_oz: CONTAINER_CAPACITIES[selectedCiderContainer],
        remaining_oz: totalCiderOz,
        apples_used: applesLbs
      };

      // Add to cider batches
      if (!newGameData.inventory.cider_batches) {
        newGameData.inventory.cider_batches = [];
      }
      newGameData.inventory.cider_batches.push(batch);

      await updateGame(gameData.game_id, newGameData);
      await loadGame();

      // Reset form
      setApplesLbs(0);

      alert(`Successfully brewed ${totalCiderOz} oz of apple cider!`);
    } catch (error) {
      console.error('Failed to brew cider:', error);
      alert('Failed to brew cider. Please try again.');
    } finally {
      setMixing(false);
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Lemonade Robot - Auto-calculate perfect recipe based on available ingredients
  const handleAutoRecipe = () => {
    // Calculate total available lemons
    const totalAvailableLemons = availableLemons.normal + availableLemons.sour + availableLemons.sweet;
    if (totalAvailableLemons === 0) {
      alert('You need lemons to make lemonade!');
      return;
    }

    // Calculate how much juice we can make with available lemons
    const maxJuiceOz = totalAvailableLemons * getJuiceYield(juicerLevel);

    // Perfect recipe ratio: 6 oz water : 2 oz juice : 25g sugar (per 8 oz serving)
    // This means: for every 2 oz of lemon juice, we need 6 oz water and 25g sugar

    // Calculate how many servings we can make with available juice
    const servingsFromJuice = maxJuiceOz / PERFECT_RECIPE.lemon_juice_oz;

    // Calculate required water and sugar for those servings
    const requiredWaterOz = servingsFromJuice * PERFECT_RECIPE.water_oz;
    const requiredSugarGrams = servingsFromJuice * PERFECT_RECIPE.sugar_grams;

    // Check if we have enough sugar
    if (requiredSugarGrams > availableSugarGrams) {
      // We're limited by sugar - recalculate based on available sugar
      const servingsFromSugar = availableSugarGrams / PERFECT_RECIPE.sugar_grams;
      const lemonsNeeded = Math.ceil(servingsFromSugar * PERFECT_RECIPE.lemon_juice_oz / getJuiceYield(juicerLevel));
      const waterNeeded = Math.round(servingsFromSugar * PERFECT_RECIPE.water_oz);
      const sugarNeeded = Math.round(servingsFromSugar * PERFECT_RECIPE.sugar_grams);

      // Distribute lemons proportionally based on what's available
      const normalRatio = availableLemons.normal / totalAvailableLemons;
      const sourRatio = availableLemons.sour / totalAvailableLemons;
      const sweetRatio = availableLemons.sweet / totalAvailableLemons;

      setSelectedLemons({
        normal: Math.floor(lemonsNeeded * normalRatio),
        sour: Math.floor(lemonsNeeded * sourRatio),
        sweet: Math.floor(lemonsNeeded * sweetRatio)
      });
      setWaterAmount(waterNeeded);
      setSugarGrams(sugarNeeded);

      alert('🤖 Recipe calculated! (Limited by available sugar)');
      return;
    }

    // We have enough sugar, use all available lemons
    const waterNeeded = Math.round(requiredWaterOz);
    const sugarNeeded = Math.round(requiredSugarGrams);

    // Check if it fits in selected container
    const totalVolume = maxJuiceOz + waterNeeded;
    const containerCapacity = CONTAINER_CAPACITIES[selectedContainer];

    if (totalVolume > containerCapacity) {
      // Scale down to fit in container
      const scaleFactor = containerCapacity / totalVolume;
      const lemonsToUse = Math.floor(totalAvailableLemons * scaleFactor);
      const juiceOz = lemonsToUse * getJuiceYield(juicerLevel);
      const servings = juiceOz / PERFECT_RECIPE.lemon_juice_oz;

      const normalRatio = availableLemons.normal / totalAvailableLemons;
      const sourRatio = availableLemons.sour / totalAvailableLemons;
      const sweetRatio = availableLemons.sweet / totalAvailableLemons;

      setSelectedLemons({
        normal: Math.floor(lemonsToUse * normalRatio),
        sour: Math.floor(lemonsToUse * sourRatio),
        sweet: Math.floor(lemonsToUse * sweetRatio)
      });
      setWaterAmount(Math.round(servings * PERFECT_RECIPE.water_oz));
      setSugarGrams(Math.round(servings * PERFECT_RECIPE.sugar_grams));

      alert(`🤖 Recipe calculated! (Scaled to fit ${CONTAINER_NAMES[selectedContainer]})`);
      return;
    }

    // Use all lemons - distribute proportionally
    const normalRatio = availableLemons.normal / totalAvailableLemons;
    const sourRatio = availableLemons.sour / totalAvailableLemons;
    const sweetRatio = availableLemons.sweet / totalAvailableLemons;

    setSelectedLemons({
      normal: Math.floor(totalAvailableLemons * normalRatio),
      sour: Math.floor(totalAvailableLemons * sourRatio),
      sweet: Math.floor(totalAvailableLemons * sweetRatio)
    });
    setWaterAmount(waterNeeded);
    setSugarGrams(sugarNeeded);

    alert('🤖 Perfect recipe calculated using all available lemons!');
  };

  if (loading) {
    return (
      <div className="kitchen-container">
        <div className="loading">Loading kitchen...</div>
      </div>
    );
  }

  const batches = inventory.lemonade_batches || [];
  const ciderBatches = inventory.cider_batches || [];
  const containerCapacity = CONTAINER_CAPACITIES[selectedContainer];
  const fillPercentage = (totalMixture / containerCapacity) * 100;

  return (
    <div className="kitchen-container">
      <div className="kitchen-header">
        <div>
          <h1>🍋 Kitchen</h1>
          <p className="subtitle">Mix your lemonade recipes</p>
        </div>
        <button onClick={() => navigate('/home-office')} className="btn-back">
          Back to Home Office
        </button>
      </div>

      <div className="kitchen-content">
        {/* Recipe Mixer */}
        <div className="mixer-panel">
          <h2>Mix New Batch</h2>

          {/* Lemons Section */}
          <div className="ingredient-section">
            <h3>Lemons</h3>
            <div className="ingredient-grid">
              <div className="ingredient-item">
                <label>Normal Lemons ({availableLemons.normal} available)</label>
                <div className="ingredient-controls">
                  <button onClick={() => adjustLemon('normal', -1000)} disabled={selectedLemons.normal < 1000} className="btn-bulk-adjust">−1000</button>
                  <button onClick={() => adjustLemon('normal', -1)} disabled={selectedLemons.normal === 0}>−</button>
                  <span className="quantity">{selectedLemons.normal}</span>
                  <button onClick={() => adjustLemon('normal', 1)} disabled={selectedLemons.normal >= availableLemons.normal}>+</button>
                  <button onClick={() => adjustLemon('normal', 10)} disabled={selectedLemons.normal + 10 > availableLemons.normal} className="btn-bulk-adjust">+10</button>
                  <button onClick={() => adjustLemon('normal', 100)} disabled={selectedLemons.normal + 100 > availableLemons.normal} className="btn-bulk-adjust">+100</button>
                  <button onClick={() => adjustLemon('normal', 1000)} disabled={selectedLemons.normal + 1000 > availableLemons.normal} className="btn-bulk-adjust">+1000</button>
                </div>
              </div>

              <div className="ingredient-item">
                <label>Sour Lemons ({availableLemons.sour} available)</label>
                <div className="ingredient-controls">
                  <button onClick={() => adjustLemon('sour', -1000)} disabled={selectedLemons.sour < 1000} className="btn-bulk-adjust">−1000</button>
                  <button onClick={() => adjustLemon('sour', -1)} disabled={selectedLemons.sour === 0}>−</button>
                  <span className="quantity">{selectedLemons.sour}</span>
                  <button onClick={() => adjustLemon('sour', 1)} disabled={selectedLemons.sour >= availableLemons.sour}>+</button>
                  <button onClick={() => adjustLemon('sour', 10)} disabled={selectedLemons.sour + 10 > availableLemons.sour} className="btn-bulk-adjust">+10</button>
                  <button onClick={() => adjustLemon('sour', 100)} disabled={selectedLemons.sour + 100 > availableLemons.sour} className="btn-bulk-adjust">+100</button>
                  <button onClick={() => adjustLemon('sour', 1000)} disabled={selectedLemons.sour + 1000 > availableLemons.sour} className="btn-bulk-adjust">+1000</button>
                </div>
              </div>

              <div className="ingredient-item">
                <label>Sweet Lemons ({availableLemons.sweet} available)</label>
                <div className="ingredient-controls">
                  <button onClick={() => adjustLemon('sweet', -1000)} disabled={selectedLemons.sweet < 1000} className="btn-bulk-adjust">−1000</button>
                  <button onClick={() => adjustLemon('sweet', -1)} disabled={selectedLemons.sweet === 0}>−</button>
                  <span className="quantity">{selectedLemons.sweet}</span>
                  <button onClick={() => adjustLemon('sweet', 1)} disabled={selectedLemons.sweet >= availableLemons.sweet}>+</button>
                  <button onClick={() => adjustLemon('sweet', 10)} disabled={selectedLemons.sweet + 10 > availableLemons.sweet} className="btn-bulk-adjust">+10</button>
                  <button onClick={() => adjustLemon('sweet', 100)} disabled={selectedLemons.sweet + 100 > availableLemons.sweet} className="btn-bulk-adjust">+100</button>
                  <button onClick={() => adjustLemon('sweet', 1000)} disabled={selectedLemons.sweet + 1000 > availableLemons.sweet} className="btn-bulk-adjust">+1000</button>
                </div>
              </div>
            </div>
            <p className="ingredient-info">
              Total: {totalLemons} lemons → {totalLemonJuice} oz juice ({juicerLevel} juicer: {getJuiceYield(juicerLevel)} oz/lemon)
            </p>
          </div>

          {/* Sugar Section */}
          <div className="ingredient-section">
            <h3>Sugar</h3>
            <div className="ingredient-item">
              <label>{availableSugarLbs.toFixed(1)} lbs ({Math.round(availableSugarGrams)} g) available</label>
              <div className="ingredient-controls">
                <button onClick={() => adjustSugar(-10000)} disabled={sugarGrams < 10000} className="btn-bulk-adjust">−10kg</button>
                <button onClick={() => adjustSugar(-1000)} disabled={sugarGrams < 1000} className="btn-bulk-adjust">−1kg</button>
                <button onClick={() => adjustSugar(-100)} disabled={sugarGrams === 0}>−100g</button>
                <button onClick={() => adjustSugar(-25)} disabled={sugarGrams === 0}>−25g</button>
                <button onClick={() => adjustSugar(-10)} disabled={sugarGrams === 0}>−10g</button>
                <span className="quantity">{formatSugarAmount(sugarGrams)}</span>
                <button onClick={() => adjustSugar(10)} disabled={sugarGrams + 10 > availableSugarGrams}>+10g</button>
                <button onClick={() => adjustSugar(25)} disabled={sugarGrams + 25 > availableSugarGrams}>+25g</button>
                <button onClick={() => adjustSugar(100)} disabled={sugarGrams + 100 > availableSugarGrams} className="btn-bulk-adjust">+100g</button>
                <button onClick={() => adjustSugar(1000)} disabled={sugarGrams + 1000 > availableSugarGrams} className="btn-bulk-adjust">+1kg</button>
                <button onClick={() => adjustSugar(10000)} disabled={sugarGrams + 10000 > availableSugarGrams} className="btn-bulk-adjust">+10kg</button>
              </div>
            </div>
            <p className="ingredient-info">
              Perfect ratio: {PERFECT_RECIPE.sugar_grams}g per {PERFECT_RECIPE.water_oz + PERFECT_RECIPE.lemon_juice_oz}oz serving
            </p>
          </div>

          {/* Water Section */}
          <div className="ingredient-section">
            <h3>Water (Free)</h3>
            <div className="ingredient-item">
              <label>Add water to your recipe</label>
              <div className="ingredient-controls">
                <button onClick={() => adjustWater(-10000)} disabled={waterAmount < 10000} className="btn-bulk-adjust">−10000</button>
                <button onClick={() => adjustWater(-1000)} disabled={waterAmount < 1000} className="btn-bulk-adjust">−1000</button>
                <button onClick={() => adjustWater(-100)} disabled={waterAmount < 100} className="btn-bulk-adjust">−100</button>
                <button onClick={() => adjustWater(-10)} disabled={waterAmount === 0}>−10</button>
                <button onClick={() => adjustWater(-1)} disabled={waterAmount === 0}>−1</button>
                <span className="quantity">{waterAmount} oz</span>
                <button onClick={() => adjustWater(1)}>+1</button>
                <button onClick={() => adjustWater(10)}>+10</button>
                <button onClick={() => adjustWater(100)} className="btn-bulk-adjust">+100</button>
                <button onClick={() => adjustWater(1000)} className="btn-bulk-adjust">+1000</button>
                <button onClick={() => adjustWater(10000)} className="btn-bulk-adjust">+10000</button>
              </div>
            </div>
          </div>

          {/* Container Selection */}
          <div className="ingredient-section">
            <h3>Container</h3>
            <div className="container-selection">
              {Object.entries(availableContainers).map(([type, count]) => (
                <button
                  key={type}
                  className={`container-btn ${selectedContainer === type ? 'selected' : ''} ${count === 0 ? 'unavailable' : ''}`}
                  onClick={() => setSelectedContainer(type)}
                  disabled={count === 0}
                >
                  <div className="container-name">{CONTAINER_NAMES[type]}</div>
                  <div className="container-info">
                    {CONTAINER_CAPACITIES[type]} oz
                    <br />
                    ({count} available)
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mix Preview */}
          <div className="mix-preview">
            <h3>Mixture Preview</h3>
            <div className="preview-stats">
              <div className="stat-item">
                <span className="stat-label">Total Volume:</span>
                <span className="stat-value">{totalMixture} oz</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Container Capacity:</span>
                <span className="stat-value">{containerCapacity} oz</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Fill Level:</span>
                <span className={`stat-value ${fillPercentage > 100 ? 'error' : ''}`}>
                  {fillPercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {totalMixture > 0 && (
              <div className="fill-bar-container">
                <div
                  className={`fill-bar ${fillPercentage > 100 ? 'overfill' : ''}`}
                  style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                />
              </div>
            )}

            {fillPercentage > 100 && (
              <p className="error-message">⚠️ Too much mixture for this container!</p>
            )}
          </div>

          {/* Taster's GuideBook Hints */}
          {gameData?.game_data?.upgrades?.tasters_guidebook && totalMixture > 0 && (
            <div className="tasters-hints">
              <h3>📖 Taster's GuideBook</h3>
              {(() => {
                const { issues } = analyzeRecipe();
                if (issues.length === 0) {
                  return <p className="hint-perfect">✨ Perfect recipe! This batch will be excellent!</p>;
                }
                return (
                  <div className="hint-list">
                    {issues.map((issue, idx) => (
                      <p key={idx} className="hint-issue">💡 {issue}</p>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          <div className="button-group">
            {gameData?.game_data?.upgrades?.lemonade_robot && (
              <button
                onClick={handleAutoRecipe}
                className="btn-robot"
                disabled={mixing}
              >
                🤖 Auto Recipe
              </button>
            )}
            <button
              onClick={handleMix}
              disabled={!canMix() || mixing}
              className="btn-mix"
            >
              {mixing ? 'Mixing...' : 'Mix Lemonade'}
            </button>
          </div>
        </div>

        {/* Cider Brewing Panel */}
        {upgrades.cider_maker && (
          <div className="mixer-panel cider-panel">
            <h2>🍎 Brew Apple Cider</h2>
            <p className="cider-note">Warm spiced cider - sells better in cold weather!</p>

            {/* Apples Section */}
            <div className="ingredient-section">
              <h3>Apples</h3>
              <div className="ingredient-item">
                <label>{availableApplesLbs.toFixed(1)} lbs available (1 lb = 20 oz cider)</label>
                <div className="ingredient-controls">
                  <button onClick={() => adjustApples(-5)} disabled={applesLbs === 0}>−5</button>
                  <button onClick={() => adjustApples(-1)} disabled={applesLbs === 0}>−1</button>
                  <button onClick={() => adjustApples(-0.5)} disabled={applesLbs === 0}>−0.5</button>
                  <span className="quantity">{applesLbs.toFixed(1)} lbs</span>
                  <button onClick={() => adjustApples(0.5)} disabled={applesLbs >= availableApplesLbs}>+0.5</button>
                  <button onClick={() => adjustApples(1)} disabled={applesLbs >= availableApplesLbs}>+1</button>
                  <button onClick={() => adjustApples(5)} disabled={applesLbs + 5 > availableApplesLbs} className="btn-bulk-adjust">+5</button>
                </div>
              </div>
              <p className="ingredient-info">
                Will produce: {totalCiderOz} oz of cider
              </p>
            </div>

            {/* Container Selection */}
            <div className="ingredient-section">
              <h3>Container</h3>
              <div className="container-selector">
                {Object.keys(CONTAINER_CAPACITIES).map(containerKey => (
                  <div key={containerKey} className="container-option">
                    <input
                      type="radio"
                      id={`cider_${containerKey}`}
                      name="cider_container"
                      value={containerKey}
                      checked={selectedCiderContainer === containerKey}
                      onChange={(e) => setSelectedCiderContainer(e.target.value)}
                    />
                    <label htmlFor={`cider_${containerKey}`}>
                      {CONTAINER_NAMES[containerKey]}
                      <span className="container-capacity">({CONTAINER_CAPACITIES[containerKey]} oz)</span>
                      <span className="container-available">Available: {availableContainers[containerKey]}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Container Visualization */}
            <div className="container-visual">
              <div className="container-fill-bar">
                <div
                  className="container-fill"
                  style={{
                    width: `${(totalCiderOz / CONTAINER_CAPACITIES[selectedCiderContainer]) * 100}%`,
                    background: 'linear-gradient(180deg, #CD853F 0%, #8B4513 100%)'
                  }}
                />
              </div>
              <p className="container-label">
                {totalCiderOz} oz / {CONTAINER_CAPACITIES[selectedCiderContainer]} oz
                ({((totalCiderOz / CONTAINER_CAPACITIES[selectedCiderContainer]) * 100).toFixed(1)}% full)
              </p>
              {totalCiderOz > CONTAINER_CAPACITIES[selectedCiderContainer] && (
                <p className="error-message">⚠️ Too much cider for this container!</p>
              )}
            </div>

            <button
              onClick={handleBrewCider}
              disabled={!canBrewCider() || mixing}
              className="btn-brew-cider"
            >
              {mixing ? 'Brewing...' : 'Brew Cider'}
            </button>
          </div>
        )}

        {/* Batch Inventory */}
        <div className="batches-panel">
          <div className="batches-header">
            <h2>Lemonade Batches</h2>
            {batches.length >= 2 && (
              <div className="batch-controls">
                {!combiningMode ? (
                  <button
                    onClick={() => setCombiningMode(true)}
                    className="btn-combine-mode"
                  >
                    🔄 Combine Batches
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCombineBatches}
                      disabled={selectedBatchesForCombine.length < 2 || mixing}
                      className="btn-combine-confirm"
                    >
                      Combine Selected ({selectedBatchesForCombine.length})
                    </button>
                    <button
                      onClick={() => {
                        setCombiningMode(false);
                        setSelectedBatchesForCombine([]);
                      }}
                      className="btn-combine-cancel"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {combiningMode && (
            <div className="combine-instructions">
              ℹ️ Select 2 or more batches with the same container type to combine them.
              The combined batch will be as old as the oldest batch selected.
              Containers can be reused up to 3 times.
            </div>
          )}
          {batches.length === 0 ? (
            <p className="empty-message">No lemonade batches yet. Mix your first batch!</p>
          ) : (
            <div className="batches-list">
              {batches.map((batch, index) => {
                const containerUses = batch.container_uses || 1;
                const maxUses = CONTAINER_MAX_USES[batch.container_type] || 2;
                const canReuse = containerUses < maxUses;
                const isSelected = selectedBatchesForCombine.includes(batch.id);

                return (
                  <div
                    key={batch.id || index}
                    className={`batch-card ${combiningMode ? 'selectable' : ''} ${isSelected ? 'selected' : ''} ${!canReuse ? 'max-uses' : ''}`}
                    onClick={() => combiningMode && toggleBatchSelection(batch.id)}
                  >
                    {combiningMode && (
                      <div className="batch-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                        />
                      </div>
                    )}
                    <div className="batch-header">
                      <h3>{CONTAINER_NAMES[batch.container_type]}</h3>
                      <span className="batch-quality">Quality: {batch.quality}/100</span>
                    </div>
                    <div className="batch-info">
                      <p>📅 Made on Day {batch.created_on_day}</p>
                      <p>🗓️ {formatDate(batch.created_date)}</p>
                      <p>📊 {batch.remaining_oz} oz / {batch.capacity_oz} oz</p>
                      <p className={`container-uses ${!canReuse ? 'max-uses-warning' : ''}`}>
                        🔄 Container Uses: {containerUses}/{maxUses}
                        {!canReuse && ' ⚠️ Max uses reached'}
                      </p>
                    </div>
                    <div className="batch-recipe">
                      <strong>Recipe:</strong>
                      {batch.recipe.combined ? (
                        <ul>
                          <li>Combined from {batch.recipe.combined_from?.length || 0} batches</li>
                          <li>Total: {batch.volume_oz} oz</li>
                        </ul>
                      ) : (
                        <ul>
                          {batch.recipe.lemons?.normal > 0 && <li>{batch.recipe.lemons.normal} normal lemons</li>}
                          {batch.recipe.lemons?.sour > 0 && <li>{batch.recipe.lemons.sour} sour lemons</li>}
                          {batch.recipe.lemons?.sweet > 0 && <li>{batch.recipe.lemons.sweet} sweet lemons</li>}
                          <li>{batch.recipe.juice_oz} oz juice ({batch.recipe.juicer_level} juicer)</li>
                          <li>{formatSugarAmount(batch.recipe.sugar_grams)} sugar</li>
                          <li>{batch.recipe.water_oz} oz water</li>
                        </ul>
                      )}
                    </div>
                    {!combiningMode && (
                      <div className="batch-actions">
                        <button
                          className="btn-taste-batch"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTasteBatch(batch);
                          }}
                          disabled={mixing || batch.remaining_oz < (upgrades?.taster_handbook ? 0 : 8)}
                        >
                          👅 Taste {!upgrades?.taster_handbook && '(8oz)'}
                        </button>
                        <button
                          className="btn-adjust-batch"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustBatch(batch);
                          }}
                          disabled={mixing}
                        >
                          🔧 Adjust
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cider Batches */}
        {upgrades.cider_maker && ciderBatches.length > 0 && (
          <div className="batches-panel">
            <h2>🍎 Cider Batches</h2>
            <div className="batches-list">
              {ciderBatches.map((batch, index) => (
                <div key={batch.id || index} className="batch-card cider-batch-card">
                  <div className="batch-header">
                    <h3>{CONTAINER_NAMES[batch.container_type]}</h3>
                    <span className="batch-quality">Apple Cider</span>
                  </div>
                  <div className="batch-info">
                    <p>📅 Made on Day {batch.created_on_day}</p>
                    <p>🗓️ {formatDate(batch.created_date)}</p>
                    <p>📊 {batch.remaining_oz} oz / {batch.capacity_oz} oz</p>
                  </div>
                  <div className="batch-recipe">
                    <strong>Recipe:</strong>
                    <ul>
                      <li>{batch.apples_used} lbs apples</li>
                      <li>{batch.volume_oz} oz warm cider</li>
                    </ul>
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

export default Kitchen;
