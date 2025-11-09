import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Heart } from 'lucide-react';
import { useGet } from '../../Hooks/useGet';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../Store/Slices/cartSlice';
import { toggleFavorite, setFavorite } from '../../Store/Slices/favoritesSlice'; // Import actions
import { useChangeState } from '../../Hooks/useChangeState';
import StaticSpinner from '../../Components/Spinners/StaticSpinner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../Context/Auth';
import { useNavigate } from 'react-router-dom';

const ProductDetails = ({ product, onClose, language }) => {
  const { t } = useTranslation();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { changeState, loadingChange } = useChangeState();
  const auth = useAuth();
  const token = useSelector((state) => state?.user?.data?.token || '');
  
  // Get favorite status from Redux
  const favorites = useSelector((state) => state.favorites.items);
  const isFavorite = favorites[product.id] ?? product.favourite;

  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [selectedAddons, setSelectedAddons] = useState({});
  const [selectedExcludes, setSelectedExcludes] = useState([]);
  const [selectedExtras, setSelectedExtras] = useState({});
  const [note, setNote] = useState('');
  const [displayProduct, setDisplayProduct] = useState(product);
  const user = useSelector(state => state.user?.data?.user);
  const selectedLanguage = useSelector(state => state.language?.selected || 'en');

  const savedOrderType = localStorage.getItem('orderType');
  const selectedAddressId =
    useSelector((state) => state.orderType?.selectedAddressId) ||
    localStorage.getItem('selectedAddressId');

  const selectedBranchId =
    useSelector((state) => state.orderType?.selectedBranchId) ||
    localStorage.getItem('selectedBranchId');

  let productDetailsUrl = `${apiUrl}/customer/home/product_item/${product.id}?locale=${language}`;

  if (user) {
    productDetailsUrl += `&user_id=${user.id}`;
  }

  if (savedOrderType === 'delivery' && selectedAddressId) {
    productDetailsUrl += `&address_id=${selectedAddressId}`;
  } else if (savedOrderType === 'take_away' && selectedBranchId) {
    productDetailsUrl += `&branch_id=${selectedBranchId}`;
  }

  // Fetch product details
  const {
    refetch: refetchProductDetails,
    loading: loadingProductDetails,
    data: productDetails,
  } = useGet({
    url: productDetailsUrl,
  });

  // Refetch when language changes
  useEffect(() => {
    refetchProductDetails();
  }, [language, refetchProductDetails]);

  // Update product data
  useEffect(() => {
    if (productDetails && !loadingProductDetails) {
      setDisplayProduct(productDetails.product || product);
      
      // Update Redux state with the latest favorite status from API
      if (productDetails.product?.favourite !== undefined) {
        dispatch(setFavorite({ 
          productId: product.id, 
          isFavorite: productDetails.product.favourite 
        }));
      }
      
      const initialAddons = {};
      productDetails.addons?.forEach((addon) => {
        initialAddons[addon.id] = {
          checked: false,
          quantity: addon.quantity_add === 1 ? 1 : 1,
        };
      });
      setSelectedAddons(initialAddons);
      const initialExtras = {};
      productDetails.allExtras?.forEach((extra) => {
        initialExtras[extra.id] = 0;
      });
      setSelectedExtras(initialExtras);
    }
  }, [productDetails, product, loadingProductDetails, dispatch]);

  const handleVariationChange = (variationId, optionId, type) => {
    if (type === 'single') {
      setSelectedVariations((prev) => ({
        ...prev,
        [variationId]: optionId,
      }));
    } else {
      setSelectedVariations((prev) => {
        const currentOptions = prev[variationId] || [];
        if (currentOptions.includes(optionId)) {
          return {
            ...prev,
            [variationId]: currentOptions.filter((id) => id !== optionId),
          };
        } else {
          return {
            ...prev,
            [variationId]: [...currentOptions, optionId],
          };
        }
      });
    }
  };

  const handleAddonChange = (addonId, checked) => {
    setSelectedAddons((prev) => ({
      ...prev,
      [addonId]: {
        ...prev[addonId],
        checked,
        quantity: checked && productDetails?.addons?.find((a) => a.id === addonId)?.quantity_add === 0 ? 1 : prev[addonId]?.quantity || 1,
      },
    }));
  };

  const handleAddonQuantityChange = (addonId, newQuantity) => {
    const addon = productDetails?.addons?.find((a) => a.id === addonId);
    if (addon?.quantity_add === 1) {
      setSelectedAddons((prev) => ({
        ...prev,
        [addonId]: { ...prev[addonId], quantity: Math.max(1, newQuantity) },
      }));
    }
  };

  const handleExcludeChange = (excludeId, checked) => {
    if (checked) {
      setSelectedExcludes((prev) => [...prev, excludeId]);
    } else {
      setSelectedExcludes((prev) => prev.filter((id) => id !== excludeId));
    }
  };

  const handleExtraQuantityChange = (extraId, newQuantity) => {
    const extra = productDetails?.allExtras?.find((e) => e.id === extraId);
    if (extra && isExtraAvailable(extra)) {
      const min = extra.min || 0;
      const max = extra.max || Infinity;
      const clampedQuantity = Math.max(min, Math.min(max, newQuantity));
      setSelectedExtras((prev) => ({
        ...prev,
        [extraId]: clampedQuantity,
      }));
    }
  };

  const handleFavoriteToggle = async () => {
    if (!token) {
      auth.toastError(t('pleaseLogin'));
      return;
    }
    
    const newFavoriteState = !isFavorite;
    const url = `${apiUrl}/customer/home/favourite/${product.id}`;
    
    const success = await changeState(
      url,
      newFavoriteState ? `${product.name} ${t('addedToFavorites')}` : `${product.name} ${t('removedFromFavorites')}`,
      { favourite: newFavoriteState ? 1 : 0 }
    );
    
    if (success) {
      // Update Redux state
      dispatch(toggleFavorite({ 
        productId: product.id, 
        isFavorite: newFavoriteState 
      }));
      
      // Update local display product
      setDisplayProduct(prev => ({
        ...prev,
        favourite: newFavoriteState
      }));
    }
  };

  const isExtraAvailable = (extra) => {
    if (!extra.variation_id && !extra.option_id) return true;
    if (extra.variation_id && extra.option_id) {
      const selectedOptions = selectedVariations[extra.variation_id];
      if (Array.isArray(selectedOptions)) {
        return selectedOptions.includes(extra.option_id);
      } else {
        return selectedOptions === extra.option_id;
      }
    }
    if (extra.variation_id && !extra.option_id) {
      const selectedOptions = selectedVariations[extra.variation_id];
      return selectedOptions && (Array.isArray(selectedOptions) ? selectedOptions.length > 0 : true);
    }
    return false;
  };

  const getAvailableExtras = () => {
    if (!productDetails?.allExtras) return [];
    return productDetails.allExtras.filter((extra) => isExtraAvailable(extra));
  };

  const calculateTotalPrice = () => {
    if (!productDetails) return (product.price_after_discount || product.price) * quantity;

    let total = parseFloat(productDetails.price_after_discount || productDetails.price);

    // Add variation prices
    Object.values(selectedVariations).forEach((optionIds) => {
      if (Array.isArray(optionIds)) {
        optionIds.forEach((optionId) => {
          const option = productDetails.variations
            .flatMap((v) => v.options)
            .find((o) => o.id === optionId);
          if (option) total += parseFloat(option.price);
        });
      } else {
        const option = productDetails.variations
          .flatMap((v) => v.options)
          .find((o) => o.id === optionIds);
        if (option) total += parseFloat(option.price);
      }
    });

    // Add addon prices
    Object.entries(selectedAddons).forEach(([addonId, addonData]) => {
      if (addonData.checked) {
        const addon = productDetails.addons?.find((a) => a.id === parseInt(addonId));
        if (addon) {
          const addonQty = addonData.quantity || 1;
          total += parseFloat(addon.price) * addonQty;
        }
      }
    });

    // Add extra prices (use price_after_discount for extras)
    Object.entries(selectedExtras).forEach(([extraId, extraQty]) => {
      const extra = productDetails.allExtras?.find((e) => e.id === parseInt(extraId));
      if (extra && extraQty > 0 && isExtraAvailable(extra)) {
        total += parseFloat(extra.price_after_discount || extra.price) * extraQty;
      }
    });

    return total * quantity;
  };

  const validateVariationSelection = (variation) => {
    if (!variation.required) return true;
    const selectedOptions = selectedVariations[variation.id];
    if (variation.type === 'single') {
      return !!selectedOptions;
    } else {
      const selectedCount = Array.isArray(selectedOptions) ? selectedOptions.length : 0;
      if (variation.min !== null && selectedCount < variation.min) return false;
      if (variation.max !== null && selectedCount > variation.max) return false;
      return selectedCount > 0;
    }
  };

  const validateExtrasSelection = () => {
    const availableExtras = getAvailableExtras();
    if (!availableExtras.length) return true;
    return availableExtras.every((extra) => {
      const quantity = selectedExtras[extra.id] || 0;
      if (extra.min !== null && quantity < extra.min) return false;
      if (extra.max !== null && quantity > extra.max) return false;
      return true;
    });
  };

  const canAddToCart = () => {
    if (!productDetails) return true;
    const variationsValid = productDetails.variations?.every(validateVariationSelection) ?? true;
    const extrasValid = validateExtrasSelection();
    return variationsValid && extrasValid;
  };

  const handleAddToCart = () => {
    if (!canAddToCart()) return;

    if (!user) {
      onClose();
      auth.toastError(t('pleaseLoginFirst'));
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    if (!selectedBranchId && !selectedAddressId) {
      onClose();
      auth.toastError(t('pleaseSelectOrderTypeFirst'));
      setTimeout(() => navigate("/order_online"), 1500);
      return;
    }

    const cartItem = {
      product: productDetails || product,
      quantity,
      variations: selectedVariations,
      addons: selectedAddons,
      excludes: selectedExcludes,
      extras: selectedExtras,
      note: note.trim(),
      totalPrice: calculateTotalPrice(),
    };
    dispatch(addToCart(cartItem));
    auth.toastSuccess(`${product.name} ${t('addedToCart')}`);
    onClose();
  };

  if (loadingProductDetails) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="p-8 bg-white rounded-lg">
          <StaticSpinner />
        </div>
      </div>
    );
  }

  const displayData = productDetails || product;
  const availableExtras = getAvailableExtras();
  const taxSetting = displayData.taxes?.setting || 'excluded';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 bg-white border-b">
          <h2 className="text-xl font-bold text-mainColor">{displayData.name}</h2>
          <div className="flex items-center gap-2">
            {/* Favorite Button */}
            {user && (
              <button
                onClick={handleFavoriteToggle}
                disabled={loadingChange}
                className={`p-2 rounded-full transition-colors ${isFavorite
                  ? "text-red-500 bg-red-50"
                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                  }`}
                title={
                  isFavorite
                    ? t("removeFromFavorites")
                    : t("addToFavorites")
                }
              >
                <Heart
                  className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`}
                />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 transition-colors rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="p-6">
          {/* Image */}
          <div className="mb-6">
            <img
              src={displayData.image_link}
              alt={displayData.name}
              className="object-contain w-full h-48 rounded-lg"
            />
          </div>
          {/* Description */}
          <p className="mb-6 text-gray-600">{displayData.description}</p>
          {/* Price Display */}
          <div className="p-3 mb-6 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t('price')}</span>
              <div className="flex items-center gap-2">
                {displayData.discount_val > 0 && (
                  <span className="text-red-500 line-through">
                    {displayData.price} {t('egp')}
                  </span>
                )}
                <span className="text-lg font-bold text-mainColor">
                  {displayData.price_after_discount || displayData.price} {t('egp')}
                </span>
              </div>
            </div>
            {taxSetting === 'included' && displayData.tax_val > 0 && (
              <div className="mt-1 text-sm text-gray-600">
                {t('taxIncluded')}: {displayData.tax_val} {t('egp')}
              </div>
            )}
          </div>
          {/* Variations */}
          {displayData.variations?.map((variation) => (
            <div key={variation.id} className="mb-6">
              <h3 className="mb-3 font-semibold">
                {variation.name} {variation.required ? <span className="text-red-500">*</span> : ''}
                {variation.type === 'multiple' && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({t('select')} {variation.min}-{variation.max})
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {variation.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <input
                        type={variation.type === 'single' ? 'radio' : 'checkbox'}
                        name={`variation-${variation.id}`}
                        checked={
                          variation.type === 'single'
                            ? selectedVariations[variation.id] === option.id
                            : (selectedVariations[variation.id] || []).includes(option.id)
                        }
                        onChange={() => handleVariationChange(variation.id, option.id, variation.type)}
                        className={`${selectedLanguage === "en" ? 'mr-3' : 'ml-3'}`}
                      />
                      <span>{option.name}</span>
                    </div>
                    {option.price > 0 && (
                      <span className="font-semibold text-mainColor">
                        +{option.price} {t('egp')}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
          {/* Addons */}
          {displayData.addons?.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold">{t('addons')}</h3>
              <div className="space-y-2">
                {displayData.addons.map((addon) => {
                  const canChangeQuantity = addon.quantity_add === 1;
                  const currentAddon = selectedAddons[addon.id];
                  return (
                    <div key={addon.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!!currentAddon?.checked}
                            onChange={(e) => handleAddonChange(addon.id, e.target.checked)}
                            className={`${selectedLanguage === "en" ? 'mr-3' : 'ml-3'}`}
                          />
                          <span>{addon.name}</span>
                        </div>
                        <span className="font-semibold text-mainColor">
                          +{addon.price} {t('egp')}
                        </span>
                      </label>
                      {currentAddon?.checked && (
                        <div className="flex items-center justify-end gap-2 pl-6 mt-2">
                          {canChangeQuantity ? (
                            <>
                              <span className="text-sm text-gray-600">{t('quantity')}:</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleAddonQuantityChange(addon.id, currentAddon.quantity - 1)}
                                  className="p-1 border border-gray-300 rounded-full hover:bg-gray-100"
                                  disabled={currentAddon.quantity <= 1}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-sm font-semibold text-center">
                                  {currentAddon.quantity}
                                </span>
                                <button
                                  onClick={() => handleAddonQuantityChange(addon.id, currentAddon.quantity + 1)}
                                  className="p-1 border border-gray-300 rounded-full hover:bg-gray-100"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-600">{t('quantityFixed')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Extras */}
          {availableExtras.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold">{t('availableExtras')}</h3>
              <div className="space-y-3">
                {availableExtras.map((extra) => {
                  const currentQty = selectedExtras[extra.id] || 0;
                  const min = extra.min || 0;
                  const max = extra.max || Infinity;
                  const hasDiscount = extra.price_after_discount && extra.price_after_discount < extra.price;

                  return (
                    <div key={extra.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{extra.name}</span>
                        <div className="flex items-center gap-2">
                          {hasDiscount && (
                            <span className="text-sm text-red-500 line-through">
                              {extra.price} {t('egp')}
                            </span>
                          )}
                          <span className="font-semibold text-mainColor">
                            +{extra.price_after_discount || extra.price} {t('egp')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {min > 0 && `${t('min')}: ${min}, `}
                          {t('max')}: {max === Infinity ? t('noLimit') : max}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleExtraQuantityChange(extra.id, currentQty - 1)}
                            className="p-1 border border-gray-300 rounded-full hover:bg-gray-100"
                            disabled={currentQty <= min}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-sm font-semibold text-center">
                            {currentQty}
                          </span>
                          <button
                            onClick={() => handleExtraQuantityChange(extra.id, currentQty + 1)}
                            className="p-1 border border-gray-300 rounded-full hover:bg-gray-100"
                            disabled={currentQty >= max}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Excludes */}
          {displayData.excludes?.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold">{t('excludeItems')}</h3>
              <div className="space-y-2">
                {displayData.excludes.map((exclude) => (
                  <label
                    key={exclude.id}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedExcludes.includes(exclude.id)}
                      onChange={(e) => handleExcludeChange(exclude.id, e.target.checked)}
                      className={`${selectedLanguage === "en" ? 'mr-3' : 'ml-3'}`}
                    />
                    <span>{exclude.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {/* Note Input */}
          <div className="mb-6">
            <h3 className="mb-3 font-semibold">{t('specialInstructions')}</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('addSpecialInstructions')}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-mainColor"
              rows={3}
              maxLength={500}
            />
            <div className="mt-1 text-sm text-right text-gray-500">
              {note.length}/500 {t('characters')}
            </div>
          </div>
          {/* Quantity */}
          <div className="flex items-center justify-between mb-6">
            <span className="font-semibold">{t('quantity')}</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-1 border border-gray-300 rounded-full hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 font-semibold text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="p-1 border border-gray-300 rounded-full hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Total Price */}
          <div className="flex items-center justify-between p-4 mb-6 rounded-lg bg-mainColor/10">
            <span className="text-lg font-semibold">{t('totalPrice')}</span>
            <span className="text-2xl font-bold text-mainColor">
              {calculateTotalPrice().toFixed(2)} {t('egp')}
            </span>
          </div>
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart()}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${canAddToCart()
              ? 'bg-mainColor text-white hover:bg-mainColor/90'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {canAddToCart() ? t('addToCart') : t('completeSelection')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;