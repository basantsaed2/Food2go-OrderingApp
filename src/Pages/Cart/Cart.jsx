import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Minus, Plus, X, ShoppingCart, Trash2, Receipt } from 'lucide-react';
import {
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  clearCart
} from '../../Store/Slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, total, itemCount, totalDiscount, totalTax, priceAfterDiscount } = useSelector(state => state.cart);
  const taxSysType = useSelector(state => state.taxType?.data || 'included');
  const { t } = useTranslation();

  // Check if any item has excluded tax
  const hasExcludedTax = items.some(item => {
    const taxSetting = item.product.taxes?.setting || item.product.tax_obj?.setting || 'excluded';
    return taxSetting === 'excluded';
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-96">
        <ShoppingCart className="w-24 h-24 mb-6 text-gray-300" />
        <h3 className="mb-2 text-xl font-semibold text-gray-600">{t("YourCartIsEmpty")}</h3>
        <p className="mb-6 text-gray-500">{t("AddSomeDeliciousItemsToGetStarted")}</p>

        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 text-white transition-colors rounded-lg bg-mainColor hover:bg-mainColor/90"
        >
          {t("ContinueShopping")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 xl:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-mainColor">{t("ShoppingCart")}</h1>

          <p className="mt-1 text-gray-600">
            {itemCount} {itemCount === 1 ? t("Item") : t("Items")} {t("InYourCart")}
          </p>

        </div>
        <button
          onClick={() => dispatch(clearCart())}
          className="flex items-center gap-2 px-4 py-2 font-medium text-red-500 transition-colors rounded-lg hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          {t("ClearCart")}
        </button>
      </div>


      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="overflow-hidden bg-white border border-gray-100 shadow-md rounded-xl">
                <div className="flex flex-col md:flex-row">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-full h-48 md:w-32 md:h-32">
                    <img
                      src={item.product.image_link}
                      alt={item.product.name}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5YzlkYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjM1ZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="mb-1 text-lg font-bold text-gray-900">{item.product.name}</h3>
                        <p className="mb-3 text-sm text-gray-600 line-clamp-2">{item.product.description}</p>

                        {/* Tax Info */}
                        {(item.taxDetails && item.taxDetails.totalTax > 0) && taxSysType !== "included" && (
                          <div className="mb-2">
                            <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded">
                              Tax (Product & Addons): {item.taxDetails.totalTax.toFixed(2)} {t("egp")}
                            </span>
                          </div>
                        )}

                        {/* Display note if exists */}
                        {item.note && (
                          <div className="p-2 mb-3 rounded-lg bg-yellow-50">
                            <span className="text-sm font-medium text-yellow-800">Note: </span>
                            <span className="text-sm text-yellow-700">{item.note}</span>
                          </div>
                        )}

                        {/* Price per item */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg font-bold text-mainColor">
                            {(item.totalPrice / item.quantity).toFixed(2)} {t("egp")}
                          </span>
                          {item.product.discount_val > 0 && (
                            <span className="text-sm text-red-500 line-through">
                              {item.product.price} {t("egp")}
                            </span>
                          )}
                        </div>

                        {/* Customizations */}
                        <div className="space-y-1 text-sm text-gray-600">
                          {/* Variations */}
                          {item.variations && Object.entries(item.variations).map(([variationId, optionIds]) => {
                            const variation = item.product.variations?.find(v => v.id === parseInt(variationId));
                            if (!variation) return null;

                            return (
                              <div key={variationId} className="flex">
                                <span className="w-20 font-medium">{variation.name}:</span>
                                <span>
                                  {Array.isArray(optionIds) ? (
                                    optionIds.map(optionId => {
                                      const option = variation.options.find(o => o.id === optionId);
                                      return option?.name;
                                    }).join(', ')
                                  ) : (
                                    variation.options.find(o => o.id === optionIds)?.name
                                  )}
                                </span>
                              </div>
                            );
                          })}

                          {/* Addons */}
                          {item.addons && Object.entries(item.addons).map(([addonId, addonData]) => {
                            if (!addonData.checked) return null;
                            const addon = item.product.addons?.find(a => a.id === parseInt(addonId));
                            if (!addon) return null;

                            return (
                              <div key={addonId} className="flex">
                                <span className="w-20 font-medium">Addon:</span>
                                <span>{addon.name} ({addonData.quantity}x)</span>
                              </div>
                            );
                          })}

                          {/* Extras (No Tax) */}
                          {item.extras && Object.entries(item.extras).map(([extraId, extraQty]) => {
                            if (extraQty <= 0) return null;
                            const extra = item.product.allExtras?.find(e => e.id === parseInt(extraId));
                            if (!extra) return null;

                            return (
                              <div key={extraId} className="flex">
                                <span className="w-20 font-medium">Extra:</span>
                                <span>{extra.name} ({extraQty}x) - No Tax</span>
                              </div>
                            );
                          })}

                          {/* Excludes */}
                          {item.excludes && item.excludes.length > 0 && (
                            <div className="flex">
                              <span className="w-20 font-medium">{t("Excluded")}:</span>
                              <span>
                                {item.excludes.map(excludeId => {
                                  const exclude = item.product.excludes?.find(e => e.id === excludeId);
                                  return exclude?.name;
                                }).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="ml-4 text-gray-400 transition-colors hover:text-red-500"
                        title="Remove item"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center px-3 py-1 space-x-3 rounded-lg bg-gray-50">
                        <button
                          onClick={() => dispatch(decrementQuantity(item.id))}
                          className="p-1 transition-colors rounded-full hover:bg-white"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-lg font-semibold text-center">{item.quantity}</span>
                        <button
                          onClick={() => dispatch(incrementQuantity(item.id))}
                          className="p-1 transition-colors rounded-full hover:bg-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <span className="text-xl font-bold text-mainColor">
                        {item.totalPrice.toFixed(2)} {t("egp")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky p-6 bg-white border border-gray-100 shadow-md rounded-xl top-4">
            <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-gray-900">
              <Receipt className="w-5 h-5" />
              {t("OrderSummary")}            </h2>

            {/* Price Breakdown */}
            <div className="mb-6 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>{t("Subtotal")} ({itemCount} {t("items")})</span>
                <span>{subtotal.toFixed(2)} {t("egp")}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t("Discount")}</span>
                  <span>-{totalDiscount.toFixed(2)} {t("egp")}</span>
                </div>
              )}

              <div className="flex justify-between text-blue-600">
                <span>{t("PriceAfterDiscount")}</span>
                <span>{priceAfterDiscount.toFixed(2)} {t("egp")}</span>
              </div>

              {(hasExcludedTax && totalTax > 0) && taxSysType !== "included" && (
                <div className="flex justify-between text-orange-600">
                  <span>{t("TaxProductAndAddons")}</span>
                  <span>+{totalTax.toFixed(2)} {t("egp")}</span>
                </div>
              )}

              <div className="pt-3 border-t">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>{t("Total")}</span>
                  {taxSysType === "included" ? (
                    <span>{priceAfterDiscount.toFixed(2)} {t("egp")}</span>
                  ) : (
                    <span>{total.toFixed(2)} {t("egp")}</span>
                  )}
                </div>
              </div>
            </div>


            {/* Tax Breakdown Modal Trigger */}
            {hasExcludedTax && taxSysType !== "included" && (
              <div className="p-3 mb-4 rounded-lg bg-gray-50">
                <details className="text-sm">
                  <summary className="font-medium text-gray-700 cursor-pointer">{t('ViewTaxBreakdown')}</summary>
                  <div className="mt-2 space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        <div className="font-medium">{item.product.name}</div>
                        {item.taxDetails.taxBreakdown.map((taxItem, taxIndex) => (
                          <div key={taxIndex} className="ml-2">
                            {taxItem.name}: {taxItem.taxAmount.toFixed(2)} {t("egp")} ({taxItem.taxRate}%)
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {/* Checkout Button */}
            <button onClick={() => navigate('/check_out')} className="w-full py-3 text-lg font-bold text-white transition-colors rounded-lg bg-mainColor hover:bg-mainColor/90">
              {t("ProceedToCheckout")}            </button>

            {/* Continue Shopping */}
            <button
              onClick={() => window.history.back()}
              className="w-full py-3 mt-3 font-medium transition-colors border rounded-lg border-mainColor text-mainColor hover:bg-mainColor/5"
            >
              {t("ContinueShopping")}            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;