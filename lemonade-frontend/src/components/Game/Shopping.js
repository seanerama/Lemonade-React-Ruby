import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { getGame, updateGame } from '../../services/api';
import { SHOP_ITEMS, SHOP_CATEGORIES, getItemsByCategory } from '../../constants/shopItems';
import '../../styles/Shopping.css';

function Shopping() {
  const [gameData, setGameData] = useState(null);
  const [cart, setCart] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(SHOP_CATEGORIES.LEMONS);
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

  const addToCart = (itemId, quantity = 1) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + quantity
    }));
  };

  const removeFromCart = (itemId, quantity = 1) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > quantity) {
        newCart[itemId] -= quantity;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const updateCartQuantity = (itemId, quantity) => {
    const num = parseInt(quantity, 10);
    if (num > 0) {
      setCart(prev => ({
        ...prev,
        [itemId]: num
      }));
    } else {
      setCart(prev => {
        const newCart = { ...prev };
        delete newCart[itemId];
        return newCart;
      });
    }
  };

  const clearCart = () => {
    setCart({});
  };

  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      return total + (SHOP_ITEMS[itemId].price * quantity);
    }, 0);
  };

  const canAfford = () => {
    const total = calculateTotal();
    const currentMoney = gameData?.game_data?.money || 0;
    return total <= currentMoney;
  };

  const canPurchaseItem = (item) => {
    if (!item.isUpgrade) return true;

    const data = gameData?.game_data || {};
    const upgrades = data.upgrades || {};
    const activeEffects = data.active_effects || {};
    const currentMonth = Math.floor(data.month || 3);

    // Check if item is available based on month
    if (item.availableMonth && currentMonth < item.availableMonth) {
      return false; // Not available yet
    }

    // Check for consumable upgrades
    if (item.isConsumable) {
      if (item.upgradeKey === 'ad_campaign') {
        // Can only buy once per week
        const currentWeek = Math.floor(data.day_count / 7);
        const lastPurchaseWeek = activeEffects.ad_campaign_last_purchase_week || 0;
        if (currentWeek === lastPurchaseWeek) {
          return false; // Already purchased this week
        }
      }
      // Other consumables can always be purchased
      return true;
    }

    // Check for permanent shop upgrades (glass_dispenser, cash_drawer, etc.)
    if (item.upgradeKey) {
      return !upgrades[item.upgradeKey]; // Can purchase if not already owned
    }

    // Check for juicer upgrades
    const currentJuicerLevel = data.inventory?.juicer_level;

    // Already have this level or better
    const levels = ['hand', 'electric', 'commercial', 'industrial'];
    const currentIndex = levels.indexOf(currentJuicerLevel);
    const itemIndex = levels.indexOf(item.inventoryValue);

    if (currentIndex >= itemIndex) {
      return false; // Already owned
    }

    // Check if we have the required previous level
    if (item.requires && currentJuicerLevel !== item.requires) {
      return false;
    }

    return true;
  };

  const handlePurchase = async () => {
    if (!canAfford()) {
      alert('Not enough money!');
      return;
    }

    setPurchasing(true);
    try {
      const total = calculateTotal();
      const newGameData = { ...gameData.game_data };

      // Deduct money
      newGameData.money -= total;

      // Update statistics
      newGameData.statistics.total_spent_grocery += total;

      // Add items to inventory
      Object.entries(cart).forEach(([itemId, quantity]) => {
        const item = SHOP_ITEMS[itemId];

        if (item.isConsumable) {
          // Handle consumable upgrades
          if (!newGameData.active_effects) {
            newGameData.active_effects = {};
          }

          if (item.upgradeKey === 'ad_campaign') {
            // Start ad campaign
            newGameData.active_effects.ad_campaign_active = true;
            newGameData.active_effects.ad_campaign_days_left = 3;
            newGameData.active_effects.ad_campaign_last_purchase_week = Math.floor(newGameData.day_count / 7);
          }
        } else if (item.isUpgrade) {
          // For permanent shop upgrades (glass_dispenser, cash_drawer, etc.)
          if (item.upgradeKey) {
            if (!newGameData.upgrades) {
              newGameData.upgrades = {};
            }
            newGameData.upgrades[item.upgradeKey] = true;
          } else {
            // For equipment upgrades (juicers), set the new level
            const keys = item.inventoryKey.split('.');
            let obj = newGameData.inventory;
            for (let i = 0; i < keys.length - 1; i++) {
              obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = item.inventoryValue;
          }
        } else {
          // For regular items, add to quantity
          const keys = item.inventoryKey.split('.');
          let obj = newGameData.inventory;

          for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
          }

          const finalKey = keys[keys.length - 1];
          obj[finalKey] = (obj[finalKey] || 0) + quantity;
        }
      });

      // Update game on server
      await updateGame(gameData.game_id, newGameData);

      // Reload game data
      await loadGame();

      // Clear cart
      clearCart();

      alert('Purchase successful!');
    } catch (error) {
      console.error('Failed to purchase:', error);
      alert('Failed to complete purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="shopping-container">
        <div className="loading">Loading shop...</div>
      </div>
    );
  }

  const currentMoney = gameData?.game_data?.money || 0;
  const cartTotal = calculateTotal();
  const cartItems = Object.entries(cart);

  return (
    <div className="shopping-container">
      <div className="shopping-header">
        <div>
          <h1>🛒 Shopping</h1>
          <p className="money-display">Available: ${currentMoney.toFixed(2)}</p>
        </div>
        <button onClick={() => navigate('/home-office')} className="btn-back">
          Back to Home Office
        </button>
      </div>

      <div className="shopping-content">
        {/* Category Navigation */}
        <div className="category-nav">
          {Object.entries(SHOP_CATEGORIES).map(([key, category]) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <div className="shopping-layout">
          {/* Items List */}
          <div className="items-panel">
            <h2>{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</h2>
            <div className="items-grid">
              {getItemsByCategory(selectedCategory).map(item => {
                const canPurchase = canPurchaseItem(item);
                const inCart = cart[item.id] || 0;

                return (
                  <div
                    key={item.id}
                    className={`item-card ${!canPurchase ? 'disabled' : ''}`}
                  >
                    <div className="item-header">
                      <h3>{item.name}</h3>
                      <span className="item-price">${item.price.toFixed(2)}/{item.unit}</span>
                    </div>
                    <p className="item-description">{item.description}</p>

                    {!canPurchase && item.isUpgrade && (
                      <p className="item-unavailable">
                        {gameData?.game_data?.inventory?.juicer_level === item.inventoryValue
                          ? 'Already owned'
                          : `Requires ${item.requires} juicer`}
                      </p>
                    )}

                    {canPurchase && (
                      <div className="item-actions">
                        <div className="add-buttons">
                          <button
                            onClick={() => addToCart(item.id, 1)}
                            className="btn-add-to-cart"
                          >
                            +1
                          </button>
                          {!item.isUpgrade && (
                            <>
                              <button
                                onClick={() => addToCart(item.id, 10)}
                                className="btn-add-to-cart btn-bulk"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => addToCart(item.id, 100)}
                                className="btn-add-to-cart btn-bulk"
                              >
                                +100
                              </button>
                              <button
                                onClick={() => addToCart(item.id, 1000)}
                                className="btn-add-to-cart btn-bulk"
                              >
                                +1000
                              </button>
                            </>
                          )}
                        </div>
                        {inCart > 0 && (
                          <div className="cart-controls">
                            <span className="in-cart-badge">{inCart} in cart</span>
                            {!item.isUpgrade && inCart >= 1000 && (
                              <button
                                onClick={() => removeFromCart(item.id, 1000)}
                                className="btn-remove-bulk"
                              >
                                -1000
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shopping Cart */}
          <div className="cart-panel">
            <h2>Shopping Cart</h2>

            {cartItems.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map(([itemId, quantity]) => {
                    const item = SHOP_ITEMS[itemId];
                    const subtotal = item.price * quantity;

                    return (
                      <div key={itemId} className="cart-item">
                        <div className="cart-item-info">
                          <strong>{item.name}</strong>
                          <div className="cart-item-details">
                            ${item.price.toFixed(2)} × {quantity} = ${subtotal.toFixed(2)}
                          </div>
                        </div>
                        <div className="cart-item-controls">
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => updateCartQuantity(itemId, e.target.value)}
                            className="quantity-input"
                          />
                          <button
                            onClick={() => removeFromCart(itemId)}
                            className="btn-remove"
                            title="Remove one"
                          >
                            −
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="cart-summary">
                  <div className="cart-total">
                    <span>Total:</span>
                    <span className="total-amount">${cartTotal.toFixed(2)}</span>
                  </div>

                  {!canAfford() && (
                    <p className="error-message">Not enough money!</p>
                  )}

                  <div className="cart-actions">
                    <button
                      onClick={handlePurchase}
                      disabled={!canAfford() || purchasing}
                      className="btn-purchase"
                    >
                      {purchasing ? 'Processing...' : 'Complete Purchase'}
                    </button>
                    <button
                      onClick={clearCart}
                      className="btn-clear-cart"
                      disabled={purchasing}
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shopping;
