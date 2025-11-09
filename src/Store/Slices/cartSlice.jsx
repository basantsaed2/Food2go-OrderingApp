// Store/Slices/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const serializedCart = localStorage.getItem('cart');
    if (serializedCart === null) {
      return {
        items: [],
        total: 0,
        itemCount: 0,
        subtotal: 0,
        totalDiscount: 0,
        totalTax: 0,
        priceAfterDiscount: 0
      };
    }
    return JSON.parse(serializedCart);
  } catch (err) {
    return {
      items: [],
      total: 0,
      itemCount: 0,
      subtotal: 0,
      totalDiscount: 0,
      totalTax: 0,
      priceAfterDiscount: 0
    };
  }
};

// Save cart to localStorage
const saveCartToStorage = (cart) => {
  try {
    const serializedCart = JSON.stringify(cart);
    localStorage.setItem('cart', serializedCart);
  } catch (err) {
    console.error('Failed to save cart to localStorage:', err);
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: loadCartFromStorage(),
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity, variations, addons, excludes, extras, note } = action.payload;

      const itemId = generateCartItemId(product.id, variations, addons, excludes, extras);

      const existingItem = state.items.find(item => item.id === itemId);

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.note = note || existingItem.note;
        existingItem.totalPrice = calculateItemTotal(existingItem);
      } else {
        const newItem = {
          id: itemId,
          product,
          quantity,
          variations: variations || {},
          addons: addons || {},
          excludes: excludes || [],
          extras: extras || {},
          note: note || '',
          totalPrice: 0,
          basePrice: product.price_after_discount || product.price,
          taxDetails: calculateItemTaxDetails(product, variations, addons, quantity) // Only product and addons
        };
        newItem.totalPrice = calculateItemTotal(newItem);
        state.items.push(newItem);
      }

      updateCartTotals(state);
      saveCartToStorage(state);
    },

    updateCartItem: (state, action) => {
      const { itemId, quantity, variations, addons, excludes, extras, note } = action.payload;

      const item = state.items.find(item => item.id === itemId);
      if (item) {
        if (quantity !== undefined) item.quantity = quantity;
        if (variations) item.variations = variations;
        if (addons) item.addons = addons;
        if (excludes) item.excludes = excludes;
        if (extras) item.extras = extras;
        if (note !== undefined) item.note = note;

        item.taxDetails = calculateItemTaxDetails(item.product, item.variations, item.addons, item.quantity);
        item.totalPrice = calculateItemTotal(item);
        updateCartTotals(state);
        saveCartToStorage(state);
      }
    },

    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      updateCartTotals(state);
      saveCartToStorage(state);
    },

    clearCart: (state) => {
      state.items = [];
      updateCartTotals(state);
      saveCartToStorage(state);
    },

    incrementQuantity: (state, action) => {
      const itemId = action.payload;
      const item = state.items.find(item => item.id === itemId);
      if (item) {
        item.quantity += 1;
        item.taxDetails = calculateItemTaxDetails(item.product, item.variations, item.addons, item.quantity);
        item.totalPrice = calculateItemTotal(item);
        updateCartTotals(state);
        saveCartToStorage(state);
      }
    },

    decrementQuantity: (state, action) => {
      const itemId = action.payload;
      const item = state.items.find(item => item.id === itemId);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        item.taxDetails = calculateItemTaxDetails(item.product, item.variations, item.addons, item.quantity);
        item.totalPrice = calculateItemTotal(item);
        updateCartTotals(state);
        saveCartToStorage(state);
      }
    },

    updateItemNote: (state, action) => {
      const { itemId, note } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      if (item) {
        item.note = note;
        saveCartToStorage(state);
      }
    },

    initializeCart: (state) => {
      const savedCart = loadCartFromStorage();
      state.items = savedCart.items;
      updateCartTotals(state);
    }
  }
});

// Helper functions
const generateCartItemId = (productId, variations, addons, excludes, extras) => {
  const variationsStr = variations ? Object.entries(variations)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${Array.isArray(value) ? value.sort().join(',') : value}`)
    .join('|') : '';

  const addonsStr = addons ? Object.entries(addons)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
    .join('|') : '';

  const excludesStr = excludes ? excludes.sort().join(',') : '';

  const extrasStr = extras ? Object.entries(extras)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|') : '';

  return `${productId}|${variationsStr}|${addonsStr}|${excludesStr}|${extrasStr}`;
};

// Calculate tax for a single component (product, variation, addon)
const calculateTaxForComponent = (price, taxObj, quantity = 1) => {
  if (!taxObj || !taxObj.amount) return { taxAmount: 0, priceAfterTax: price };

  const taxAmount = taxObj.type === 'precentage'
    ? (price * taxObj.amount) / 100
    : taxObj.amount;

  const taxSetting = taxObj.setting || 'excluded';
  const priceAfterTax = taxSetting === 'included' ? price : price + taxAmount;

  return {
    taxAmount: taxAmount * quantity,
    priceAfterTax: priceAfterTax * quantity,
    taxRate: taxObj.amount,
    taxType: taxObj.type,
    taxSetting: taxSetting
  };
};

// In calculateItemTaxDetails function, update ONLY the addon tax calculation:
const calculateItemTaxDetails = (product, variations, addons, quantity) => {
  const taxDetails = {
    productTax: 0,
    variationTax: 0,
    addonTax: 0,
    totalTax: 0,
    taxableAmount: 0,
    taxBreakdown: []
  };

  // Product base tax (KEEP multiplied by quantity)
  const productTax = calculateTaxForComponent(
    parseFloat(product.price_after_discount || product.price), 
    product.tax_obj || product.taxes, 
    quantity
  );
  taxDetails.productTax = productTax.taxAmount;
  taxDetails.taxableAmount += parseFloat(product.price_after_discount || product.price) * quantity;
  
  // ADD THIS BACK - Product tax breakdown
  taxDetails.taxBreakdown.push({
    name: product.name,
    type: 'product',
    taxableAmount: parseFloat(product.price_after_discount || product.price) * quantity,
    taxAmount: productTax.taxAmount,
    taxRate: product.tax_obj?.amount || product.taxes?.amount || 0
  });

  // Variation taxes (KEEP multiplied by quantity)
  if (variations) {
    Object.values(variations).forEach(optionIds => {
      const options = Array.isArray(optionIds) ? optionIds : [optionIds];
      options.forEach(optionId => {
        const option = findOptionInProduct(product, optionId);
        if (option && option.price > 0) {
          const optionTax = calculateTaxForComponent(
            parseFloat(option.price), 
            option.taxes || product.tax_obj || product.taxes, 
            quantity
          );
          taxDetails.variationTax += optionTax.taxAmount;
          taxDetails.taxableAmount += parseFloat(option.price) * quantity;
          
          // ADD THIS BACK - Variation tax breakdown
          taxDetails.taxBreakdown.push({
            name: `${product.name} - ${option.name}`,
            type: 'variation',
            taxableAmount: parseFloat(option.price) * quantity,
            taxAmount: optionTax.taxAmount,
            taxRate: option.taxes?.amount || product.tax_obj?.amount || product.taxes?.amount || 0
          });
        }
      });
    });
  }

  // Addon taxes (NOT multiplied by product quantity - FIX ONLY THIS)
  if (addons) {
    Object.entries(addons).forEach(([addonId, addonData]) => {
      if (addonData.checked) {
        const addon = product.addons?.find(a => a.id === parseInt(addonId));
        if (addon) {
          const addonQty = addonData.quantity || 1;
          // Addon tax is calculated per addon quantity, NOT multiplied by product quantity
          const addonTax = calculateTaxForComponent(
            parseFloat(addon.price), 
            addon.tax || product.tax_obj || product.taxes, 
            addonQty  // Only use addon quantity, not product quantity
          );
          taxDetails.addonTax += addonTax.taxAmount;
          taxDetails.taxableAmount += parseFloat(addon.price) * addonQty;
          
          // ADD THIS BACK - Addon tax breakdown (with fixed quantity calculation)
          taxDetails.taxBreakdown.push({
            name: `${product.name} - ${addon.name}`,
            type: 'addon',
            taxableAmount: parseFloat(addon.price) * addonQty, // Only addon quantity, not multiplied by product quantity
            taxAmount: addonTax.taxAmount,
            taxRate: addon.tax?.amount || product.tax_obj?.amount || product.taxes?.amount || 0
          });
        }
      }
    });
  }

  taxDetails.totalTax = taxDetails.productTax + taxDetails.variationTax + taxDetails.addonTax;
  
  return taxDetails;
};

const calculateItemTotal = (item) => {
  let total = parseFloat(item.basePrice);

  // Add variation prices (KEEP multiplied by quantity)
  if (item.variations) {
    Object.values(item.variations).forEach(optionIds => {
      if (Array.isArray(optionIds)) {
        optionIds.forEach(optionId => {
          const option = findOptionInProduct(item.product, optionId);
          if (option) total += parseFloat(option.price);
        });
      } else {
        const option = findOptionInProduct(item.product, optionIds);
        if (option) total += parseFloat(option.price);
      }
    });
  }

  // Multiply base product + variations by quantity (KEEP AS IS)
  total = total * item.quantity;

  // Add addon prices (NOT multiplied by product quantity - FIX ONLY THIS)
  if (item.addons) {
    Object.entries(item.addons).forEach(([addonId, addonData]) => {
      if (addonData.checked) {
        const addon = item.product.addons?.find(a => a.id === parseInt(addonId));
        if (addon) {
          const addonQty = addonData.quantity || 1;
          // Addon price is multiplied only by addon quantity, not product quantity
          total += parseFloat(addon.price) * addonQty;
        }
      }
    });
  }

  // Add extra prices (KEEP multiplied by product quantity - NO CHANGE)
  if (item.extras) {
    Object.entries(item.extras).forEach(([extraId, extraQty]) => {
      const extra = item.product.allExtras?.find(e => e.id === parseInt(extraId));
      if (extra && extraQty > 0) {
        // Extra price is multiplied by both extra quantity AND product quantity (KEEP AS IS)
        total += parseFloat(extra.price_after_discount || extra.price) * extraQty * item.quantity;
      }
    });
  }

  return total;
};

const findOptionInProduct = (product, optionId) => {
  if (!product.variations) return null;
  for (const variation of product.variations) {
    const option = variation.options.find(o => o.id === optionId);
    if (option) return option;
  }
  return null;
};

const updateCartTotals = (state) => {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let priceAfterDiscount = 0;

  state.items.forEach(item => {
    // Calculate item base price without tax
    let itemSubtotal = parseFloat(item.product.price) * item.quantity;
    let itemPriceAfterDiscount = parseFloat(item.product.price_after_discount || item.product.price) * item.quantity;

    // Calculate discount
    const itemDiscount = itemSubtotal - itemPriceAfterDiscount;
    totalDiscount += Math.max(0, itemDiscount);

    // Add variation prices (KEEP multiplied by quantity)
    if (item.variations) {
      Object.values(item.variations).forEach(optionIds => {
        if (Array.isArray(optionIds)) {
          optionIds.forEach(optionId => {
            const option = findOptionInProduct(item.product, optionId);
            if (option) {
              itemSubtotal += parseFloat(option.price) * item.quantity;
              itemPriceAfterDiscount += parseFloat(option.price) * item.quantity;
            }
          });
        } else {
          const option = findOptionInProduct(item.product, optionIds);
          if (option) {
            itemSubtotal += parseFloat(option.price) * item.quantity;
            itemPriceAfterDiscount += parseFloat(option.price) * item.quantity;
          }
        }
      });
    }

    // Add addon prices (NOT multiplied by product quantity - FIX ONLY THIS)
    if (item.addons) {
      Object.entries(item.addons).forEach(([addonId, addonData]) => {
        if (addonData.checked) {
          const addon = item.product.addons?.find(a => a.id === parseInt(addonId));
          if (addon) {
            const addonQty = addonData.quantity || 1;
            const addonPrice = parseFloat(addon.price) * addonQty; // No multiplication by item.quantity
            itemSubtotal += addonPrice;
            itemPriceAfterDiscount += addonPrice;
          }
        }
      });
    }

    // Add extra prices (KEEP multiplied by product quantity - NO CHANGE)
    if (item.extras) {
      Object.entries(item.extras).forEach(([extraId, extraQty]) => {
        const extra = item.product.allExtras?.find(e => e.id === parseInt(extraId));
        if (extra && extraQty > 0) {
          const extraPrice = parseFloat(extra.price) * extraQty * item.quantity; // KEEP multiplication by item.quantity
          const extraPriceAfterDiscount = parseFloat(extra.price_after_discount || extra.price) * extraQty * item.quantity; // KEEP multiplication by item.quantity
          itemSubtotal += extraPrice;
          itemPriceAfterDiscount += extraPriceAfterDiscount;
          // Calculate extra discount
          const extraDiscount = extraPrice - extraPriceAfterDiscount;
          totalDiscount += Math.max(0, extraDiscount);
        }
      });
    }
    subtotal += itemSubtotal;
    priceAfterDiscount += itemPriceAfterDiscount;
    // Use pre-calculated tax details (which only includes product and addons)
    totalTax += item.taxDetails?.totalTax || 0;
  });

  state.subtotal = parseFloat(subtotal.toFixed(2));
  state.totalDiscount = parseFloat(totalDiscount.toFixed(2));
  state.totalTax = parseFloat(totalTax.toFixed(2));
  state.priceAfterDiscount = parseFloat(priceAfterDiscount.toFixed(2));
  state.total = parseFloat((priceAfterDiscount + totalTax).toFixed(2));
  state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
};

export const {
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  incrementQuantity,
  decrementQuantity,
  updateItemNote,
  initializeCart
} = cartSlice.actions;

export default cartSlice.reducer;