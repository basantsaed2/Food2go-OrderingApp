import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../Context/Auth';
import { usePost } from '../../Hooks/usePost';
import { useGet } from '../../Hooks/useGet';
import {
  ArrowLeft,
  Clock,
  ChefHat,
  CheckCircle,
  Truck,
  AlertCircle,
  Package,
  History,
} from 'lucide-react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { MdWarning } from 'react-icons/md';
import { useChangeState } from '../../Hooks/useChangeState';

const MyOrderTracking = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [totals, setTotals] = useState({ subtotal: 0, discount: 0, tax: 0, total: 0 });
  const [openCancelModal, setOpenCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Pagination state
  const [visiblePendingCount, setVisiblePendingCount] = useState(15);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(15);

  // API hooks
  const { refetch: refetchOrders, loading: loadingOrders, data: dataOrders } = useGet({
    url: `${apiUrl}/customer/orders`,
  });

  const { refetch: refetchOrdersHistory, loading: loadingOrdersHistory, data: dataOrdersHistory } = useGet({
    url: `${apiUrl}/customer/orders/history`,
  });

  const { changeState: cancelOrder, loadingChange: loadingCancel } = useChangeState();

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'pending') {
      refetchOrders();
    } else {
      refetchOrdersHistory();
    }
  }, [activeTab]);

  // Handle customer pending orders
  useEffect(() => {
    if (dataOrders && dataOrders.orders && activeTab === 'pending') {
      const globalCancelTime = dataOrders.cancel_time;
      const pendingOrders = dataOrders.orders.map(order => {
        // Use order-specific cancel_time if available, otherwise use global one
        const effectiveOrder = {
          ...order,
          cancel_time: order.cancel_time || globalCancelTime
        };

        return {
          ...effectiveOrder,
          isCancellable: order.can_cancel && isCancellable(effectiveOrder)
        };
      });
      setOrders(pendingOrders);
    }
  }, [dataOrders, activeTab]);

  // Handle history orders
  useEffect(() => {
    if (dataOrdersHistory && dataOrdersHistory.orders && activeTab === 'history') {
      setHistoryOrders(dataOrdersHistory.orders);
    }
  }, [dataOrdersHistory, activeTab]);

  // Cancellation functionality
  useEffect(() => {
    const checkCancellability = () => {
      const currentTime = new Date().getTime();
      setOrders((prevOrders) => {
        const updatedOrders = prevOrders.map((order) => {
          const isCancellableStatus = isCancellable(order);
          return order.isCancellable !== isCancellableStatus
            ? { ...order, isCancellable: isCancellableStatus }
            : order;
        });
        const hasChanged = prevOrders.some(
          (order, i) => order.isCancellable !== updatedOrders[i].isCancellable
        );
        return hasChanged ? updatedOrders : prevOrders;
      });
    };

    checkCancellability();
    const interval = setInterval(checkCancellability, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenCancelModal = (orderId) => setOpenCancelModal(orderId);
  const handleCloseCancelModal = () => {
    setOpenCancelModal(null);
    setCancelReason('');
  };

  const handleCancelOrder = async (id) => {
    try {
      await cancelOrder(
        `${apiUrl}/customer/orders/cancel/${id}`,
        `Order #${id} is Cancelled. Reason: ${cancelReason}`,
        { status: '', customer_cancel_reason: cancelReason }
      );
      handleCloseCancelModal();
      refetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      auth.toastError(t('Failed to cancel order'));
    }
  };

  const isCancellable = (order) => {
    try {
      // إذا كان الـ can_cancel false من الخادم، لا يمكن الإلغاء
      if (order.can_cancel === false) {
        return false;
      }

      const currentTime = new Date().getTime();
      const orderTimeString = `${order.order_date}T${order.date}Z`;
      const orderTime = new Date(orderTimeString).getTime();

      if (isNaN(orderTime)) {
        console.error('Invalid order date or time:', order.order_date, order.date);
        return false;
      }

      // استخدام cancel_time من الـ order إذا كان موجوداً، وإلا استخدام الوقت الافتراضي
      const cancelTime = order.cancel_time;

      if (!cancelTime) {
        return false;
      }

      const [hours, minutes, seconds] = cancelTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        console.error('Invalid cancellation time format:', cancelTime);
        return false;
      }

      const cancelWindow = (hours * 3600 + minutes * 60 + seconds) * 1000;
      const isWithinWindow = currentTime - orderTime <= cancelWindow;

      return isWithinWindow;
    } catch (error) {
      console.error('Error in isCancellable for order', order.id, error);
      return false;
    }
  };

  const formatTime = (dateString, timeString) => {
    const date = new Date(`${dateString}T${timeString}Z`);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // حساب الوقت المتبقي للإلغاء
  const getRemainingCancelTime = (order) => {
    try {
      const currentTime = new Date().getTime();
      const orderTimeString = `${order.order_date}T${order.date}Z`;
      const orderTime = new Date(orderTimeString).getTime();

      if (isNaN(orderTime)) return null;

      const cancelTime = order.cancel_time;
      if (!cancelTime) return null;

      const [hours, minutes, seconds] = cancelTime.split(':').map(Number);
      const cancelWindow = (hours * 3600 + minutes * 60 + seconds) * 1000;

      const timePassed = currentTime - orderTime;
      const timeRemaining = cancelWindow - timePassed;

      if (timeRemaining <= 0) return null;

      const minutesRemaining = Math.floor(timeRemaining / (60 * 1000));
      const secondsRemaining = Math.floor((timeRemaining % (60 * 1000)) / 1000);

      return { minutes: minutesRemaining, seconds: secondsRemaining };
    } catch (error) {
      console.error('Error calculating remaining time:', error);
      return null;
    }
  };

  // Status configuration
  const statusConfig = {
    pending: {
      label: t('pending'),
      icon: Clock,
      color: 'text-yellow-500',
      bg: 'bg-yellow-100',
      border: 'border-yellow-300'
    },
    processing: {
      label: t('Preparing'),
      icon: ChefHat,
      color: 'text-blue-500',
      bg: 'bg-blue-100',
      border: 'border-blue-300'
    },
    confirmed: {
      label: t('Done'),
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-100',
      border: 'border-green-300'
    },
    out_for_delivery: {
      label: t('Out for delivery'),
      icon: Truck,
      color: 'text-purple-500',
      bg: 'bg-purple-100',
      border: 'border-purple-300'
    },
    delivered: {
      label: t('delivered'),
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-100',
      border: 'border-orange-300'
    },
    canceled: {
      label: t('Canceled'),
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-100',
      border: 'border-red-300'
    }
  };

  const getProgress = (status) => {
    const statuses = ['pending', 'processing', 'confirmed', 'out_for_delivery', 'delivered'];
    const normalizedStatus = status?.toLowerCase() || 'pending';
    const index = statuses.indexOf(normalizedStatus);
    return index >= 0 ? ((index + 1) / statuses.length) * 100 : 0;
  };

  const getCurrentStatus = (order) => {
    if (order.order_status === 'canceled') {
      return statusConfig.canceled;
    }
    const status = order.order_status || 'pending';
    return statusConfig[status] || statusConfig.pending;
  };

  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  const renderOrderItem = (order, isHistory = false) => {
    const currentStatus = getCurrentStatus(order);
    const StatusIcon = currentStatus.icon;
    const canCancel = order.isCancellable && !isHistory && order.order_status !== 'canceled';
    const remainingTime = getRemainingCancelTime(order);

    return (
      <div
        key={`${order.id}-${order.order_type || 'pending'}`}
        className="mb-6 overflow-hidden transition-shadow duration-300 bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md"
      >
        <div className="p-4 sm:p-6">
          {/* Order Header */}
          <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {t('Order')} #{order.id}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {order.order_date} • {formatTime(order.order_date, order.date)}
              </p>
              <p className="text-sm text-gray-600 capitalize">
                {t('Type')}: {order.order_type?.replace('_', ' ')} • {t('Branch')}: {order.branch_name}
              </p>

              {/* عرض وقت الإلغاء المتبقي */}
              {canCancel && remainingTime && (
                <p className="mt-1 text-sm text-green-600">
                  {t('CancelAvailableFor')}: {remainingTime.minutes}:{remainingTime.seconds.toString().padStart(2, '0')} {t('minutes')}
                </p>
              )}

              {/* رسالة انتهاء وقت الإلغاء */}
              {!canCancel && order.order_status === 'pending' && (
                <p className="mt-1 text-sm text-red-600">
                  {t('CancelTimeExpired')}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className={`${currentStatus.bg} ${currentStatus.border} border-2 rounded-full px-3 py-1 flex items-center gap-2 shadow-sm`}>
                <StatusIcon className={`h-4 w-4 ${currentStatus.color}`} />
                <span className={`text-sm font-semibold ${currentStatus.color}`}>
                  {currentStatus.label}
                </span>
              </div>

              {/* زر الإلغاء بجوار الحالة */}
              {canCancel && (
                <button
                  onClick={() => handleOpenCancelModal(order.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 transition-all duration-200 border-2 border-red-50 rounded-full bg-red-50 hover:bg-red-600 hover:text-white hover:border-red-600 active:scale-95 shadow-sm group"
                >
                  <AlertCircle className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                  {t('CancelOrder')}
                </button>
              )}
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            {order.products?.map((product, index) => (
              <div key={`${product.id}-${index}`} className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0">
                <img
                  src={product.image_link}
                  alt={product.name}
                  className="flex-shrink-0 object-cover w-20 h-20 rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900">{product.name}</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {t('Quantity')}: {product.count}
                  </p>
                  <p className="mt-2 text-lg font-bold text-mainColor">
                    {formatPrice(product.total_product || order.price_after_tax)} EGP
                  </p>
                </div>
              </div>
            ))}

            {/* Addons */}
            {order.addons?.length > 0 && (
              <div className="mt-4">
                <h5 className="mb-2 font-medium text-gray-700">{t('addons')}:</h5>
                <div className="space-y-2">
                  {order.addons.map((addon) => (
                    <div key={addon.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">+ {addon.name}</span>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(addon.price_after_tax)} EGP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-lg font-bold text-gray-900">
              <span>{t('TotalAmount')}</span>
              <span className="text-mainColor">{formatPrice(order.amount)} EGP</span>
            </div>
            {order.delivery_price && (
              <div className="flex items-center justify-between mt-1 text-sm text-gray-600">
                <span>{t('DeliveryFee')}</span>
                <span>{formatPrice(order.delivery_price)} EGP</span>
              </div>
            )}
            {order.total_discount > 0 && (
              <div className="flex items-center justify-between mt-1 text-sm text-green-600">
                <span>{t('Discount')}</span>
                <span>-{formatPrice(order.total_discount)} EGP</span>
              </div>
            )}
          </div>

          {/* Cancellation/Rejection Reasons */}
          {order.customer_cancel_reason && (
            <div className="p-3 mt-4 border-l-4 border-red-500 rounded-r bg-red-50">
              <div className="flex items-center gap-2">
                <MdWarning className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-medium text-red-700">{t('CancellationReason')}</h3>
              </div>
              <p className="mt-1 text-sm text-red-600">{order.customer_cancel_reason}</p>
            </div>
          )}

          {order.rejected_reason && (
            <div className="p-3 mt-4 border-l-4 border-red-500 rounded-r bg-red-50">
              <div className="flex items-center gap-2">
                <MdWarning className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-medium text-red-700">{t('RejectedReason')}</h3>
              </div>
              <p className="mt-1 text-sm text-red-600">{order.rejected_reason}</p>
            </div>
          )}

          {/* Progress Timeline for Active Orders */}
          {!isHistory && (
            <div className="pt-4 mt-6 border-t border-gray-100">
              <h4 className="mb-4 text-sm font-semibold text-gray-700">{t('OrderProgress')}</h4>
              <div className="relative">
                <div className="absolute top-3 left-0 right-0 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-700 ease-out bg-mainColor"
                    style={{ width: `${getProgress(order.order_status)}%` }}
                  ></div>
                </div>
                <div className="relative flex justify-between">
                  {Object.entries(statusConfig).map(([statusKey, config], idx) => {
                    if (!['pending', 'processing', 'confirmed', 'out_for_delivery', 'delivered'].includes(statusKey)) return null;
                    const Icon = config.icon;
                    const isActive = getProgress(order.order_status) >= ((idx + 1) / 4) * 100;
                    const isCurrent = order.order_status?.toLowerCase() === statusKey;

                    return (
                      <div key={statusKey} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive
                            ? `${config.bg} ${config.border} shadow-sm`
                            : 'bg-gray-100 border-gray-300'
                            } ${isCurrent ? 'scale-110 ring-2 ring-offset-2 ring-mainColor/30' : ''}`}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? config.color : 'text-gray-400'}`} />
                        </div>
                        <span className={`text-xs mt-2 font-medium text-center max-w-16 ${isActive ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                          {config.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Determine if we should show the full-page loader
  // We only show it on the initial load when no data is available yet
  const isLoadingInitialPending = loadingOrders && orders.length === 0;
  const isLoadingInitialHistory = loadingOrdersHistory && historyOrders.length === 0;
  const showFullPageLoader = activeTab === 'pending' ? isLoadingInitialPending : isLoadingInitialHistory;

  if (showFullPageLoader) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-t-4 border-b-4 rounded-full animate-spin border-mainColor"></div>
          <p className="text-gray-600">{t('Loadingyourorders')}</p>
        </div>
      </div>
    );
  }

  const hasPendingOrders = orders.length > 0;
  const hasHistoryOrders = historyOrders.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-2 py-2 md:px-6 md:py-6 w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex-shrink-0 p-2 transition-colors duration-200 rounded-xl hover:bg-gray-100"
              title={t('Back')}
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate sm:text-3xl text-mainColor">
                {t('myOrders')}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'pending'
                  ? `${orders.length} ${orders.length === 1 ? t('pendingorder') : t('pendingorders')}`
                  : `${historyOrders.length} ${historyOrders.length === 1 ? t('pastorder') : t('pastorders')}`
                }
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex p-1 mt-6 space-x-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 flex-1 justify-center rounded-lg py-2.5 text-sm font-medium transition-all ${activeTab === 'pending'
                ? 'bg-white text-mainColor shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Package className="w-4 h-4" />
              {t('PendingOrders')}
              {hasPendingOrders && (
                <span className="bg-mainColor text-white text-xs rounded-full px-2 py-0.5 min-w-5">
                  {orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 flex-1 justify-center rounded-lg py-2.5 text-sm font-medium transition-all ${activeTab === 'history'
                ? 'bg-white text-mainColor shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <History className="w-4 h-4" />
              {t('OrderHistory')}
              {hasHistoryOrders && (
                <span className="bg-gray-500 text-white text-xs rounded-full px-2 py-0.5 min-w-5">
                  {historyOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-2 py-2 md:px-6 md:py-6 w-full">
        {activeTab === 'pending' && (
          <div>
            {!hasPendingOrders ? (
              <div className="py-12 text-center">
                <Package className="w-24 h-24 mx-auto mb-4 text-gray-300" />
                <h3 className="mb-2 text-xl font-semibold text-gray-600">{t('No Pending Orders')}</h3>
                <p className="mb-6 text-gray-500">{t('You don\'t have any pending orders at the moment.')}</p>
                <button
                  onClick={() => navigate('/menu')}
                  className="px-6 py-3 text-white transition-colors rounded-lg bg-mainColor hover:bg-mainColor/90"
                >
                  {t('Browse Menu')}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.slice(0, visiblePendingCount).map((order) => renderOrderItem(order, false))}

                {orders.length > visiblePendingCount && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => setVisiblePendingCount(prev => prev + 15)}
                      className="px-8 py-3 text-sm font-bold text-white transition-all rounded-2xl bg-mainColor hover:bg-mainColor/90 hover:shadow-lg active:scale-95"
                    >
                      {t('ShowMore')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {!hasHistoryOrders ? (
              <div className="py-12 text-center">
                <History className="w-24 h-24 mx-auto mb-4 text-gray-300" />
                <h3 className="mb-2 text-xl font-semibold text-gray-600">{t('No Order History')}</h3>
                <p className="text-gray-500">{t('Your order history will appear here.')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {historyOrders.slice(0, visibleHistoryCount).map((order) => renderOrderItem(order, true))}

                {historyOrders.length > visibleHistoryCount && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => setVisibleHistoryCount(prev => prev + 15)}
                      className="px-8 py-3 text-sm font-bold text-gray-700 transition-all bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:shadow-md active:scale-95"
                    >
                      {t('ShowMore')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      {openCancelModal && (
        <Dialog open={true} onClose={handleCloseCancelModal} className="relative z-50">
          <DialogBackdrop className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm" />

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4 text-center sm:p-0">
              <DialogPanel className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                <div className="px-6 pt-8 pb-6 bg-white sm:p-8 sm:pb-6">
                  <div className="sm:flex sm:items-start">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-2xl shrink-0 sm:mx-0 sm:h-12 sm:w-12">
                      <MdWarning className="w-7 h-7 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-4 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-xl font-bold leading-6 text-gray-900">
                        {t('CancelOrder')}
                      </h3>
                      <div className="mt-3">
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {t('PleaseProvideReason')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label htmlFor="cancel-reason" className="block mb-2 text-sm font-medium text-gray-700">
                      {t('Reason')}:
                    </label>
                    <textarea
                      id="cancel-reason"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder={t('EnterReason')}
                      className="w-full px-4 py-3 text-sm text-gray-900 transition-all border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-red-100 focus:border-red-500 bg-gray-50/50 hover:bg-white resize-none"
                      rows="4"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 px-6 py-6 border-t border-gray-50 bg-gray-50/30 sm:flex-row sm:justify-end sm:px-8">
                  <button
                    type="button"
                    onClick={handleCloseCancelModal}
                    className="inline-flex justify-center w-full px-5 py-3 text-sm font-semibold text-gray-700 transition-colors bg-white border border-gray-200 rounded-2xl sm:w-auto hover:bg-gray-50"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(openCancelModal)}
                    disabled={!cancelReason.trim() || loadingCancel}
                    className="inline-flex justify-center w-full px-8 py-3 text-sm font-bold text-white transition-all bg-red-600 rounded-2xl sm:w-auto hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed hover:shadow-lg active:scale-95"
                  >
                    {loadingCancel ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
                        {t('Cancelling...')}
                      </div>
                    ) : t('ConfirmCancel')}
                  </button>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default MyOrderTracking;