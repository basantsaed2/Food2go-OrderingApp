import React, { useState, useEffect, useRef } from "react";
import { useGet } from '../../Hooks/useGet';
import { usePost } from '../../Hooks/usePost';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StaticSpinner from "../../Components/Spinners/StaticSpinner";
import {
    Clock,
    CreditCard,
    FileText,
    Calendar,
    Truck,
    Store,
    Shield,
    CheckCircle,
    AlertCircle,
    Receipt,
    MapPin,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useAuth } from "../../Context/Auth";
import { setServiceFees } from "../../Store/Slices/cartSlice";

const CheckOut = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const cart = useSelector(state => state.cart);
    const taxSysType = useSelector(state => state.taxType?.data || 'included');
    const auth = useAuth();
    const { t, i18n } = useTranslation();

    // Get IDs from orderType slice with localStorage fallback
    const getOrderTypeFromStorage = () => {
        // First try Redux state
        const reduxOrderType = useSelector(state => state.orderType?.orderType);
        if (reduxOrderType) return reduxOrderType;

        // Fallback to localStorage
        const storedOrderType = localStorage.getItem('orderType');
        return storedOrderType || 'delivery'; // default to delivery if nothing found
    };

    const getAddressIdFromStorage = () => {
        // First try Redux state
        const reduxAddressId = useSelector(state => state.orderType?.selectedAddressId);
        if (reduxAddressId) return reduxAddressId;

        // Fallback to localStorage
        const storedAddressId = localStorage.getItem('selectedAddressId');
        // Convert to number if it exists, otherwise return null
        return storedAddressId ? parseInt(storedAddressId) : null;
    };

    const getBranchIdFromStorage = () => {
        // First try Redux state
        const reduxBranchId = useSelector(state => state.orderType?.selectedBranchId);
        if (reduxBranchId) return reduxBranchId;

        // Fallback to localStorage
        const storedBranchId = localStorage.getItem('selectedBranchId');
        // Convert to number if it exists, otherwise return null
        return storedBranchId ? parseInt(storedBranchId) : null;
    };

    const orderType = getOrderTypeFromStorage();
    const selectedAddressId = getAddressIdFromStorage();
    const selectedBranchId = getBranchIdFromStorage();

    // Fetch addresses and branches to get full objects
    const { data: addressesData } = useGet({
        url: `${apiUrl}/customer/address?locale=ar`,
        autoFetch: true
    });

    const { data: branchesData } = useGet({
        url: `${apiUrl}/customer/order_type?locale=ar`,
        autoFetch: true
    });

    // Find the actual objects using the stored IDs
    const selectedAddress = addressesData?.addresses?.find(addr => addr.id === selectedAddressId);
    const selectedBranch = branchesData?.branches?.find(branch => branch.id === selectedBranchId);

    const { refetch: refetchSchedule, loading: loadingSchedule, data: dataSchedule } = useGet({
        url: `${apiUrl}/customer/home/schedule_list`,
    });

    const { refetch: refetchPaymentMethod, loading: loadingPaymentMethod, data: dataPaymentMethod } = useGet({
        url: `${apiUrl}/customer/order_type`,
    });

    const { postData: postOrder, loadingPost: loadingOrder, response: responseOrder } = usePost({
        url: `${apiUrl}/customer/make_order?locale=ar`,
        type: true,
    });

    const getId = () => {
        if (orderType === 'delivery') return selectedAddressId;
        if (orderType === 'take_away') return selectedBranchId;
        return null;
    };

    const id = getId();

    const { postData: fetchServiceFees, response: serviceFeesResponse } = usePost({
        url: id ? `${apiUrl}/customer/home/service_fees/${id}?source=web` : '',
    });

    useEffect(() => {
        if (id) {
            fetchServiceFees({});
        }
    }, [id]);

    useEffect(() => {
        if (serviceFeesResponse && serviceFeesResponse.data && serviceFeesResponse.data.service_fees) {
            dispatch(setServiceFees(serviceFeesResponse.data.service_fees));
        }
    }, [serviceFeesResponse, dispatch]);

    const [scheduleList, setScheduleList] = useState([]);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [notes, setNotes] = useState("");
    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptFileName, setReceiptFileName] = useState("");
    const [showProcessingModal, setShowProcessingModal] = useState(false);
    const [pendingOrderData, setPendingOrderData] = useState(null);
    const [orderSummary, setOrderSummary] = useState({
        subtotal: 0,
        discount: 0,
        priceAfterDiscount: 0,
        tax: 0,
        delivery: 0,
        total: 0,
        paymentFee: 0,
        serviceFees: 0
    });

    // State for custom dropdowns
    const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
    const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);

    const receiptRef = useRef(null);
    const paymentDropdownRef = useRef(null);
    const scheduleDropdownRef = useRef(null);

    // Calculate payment fee function
    const calculatePaymentFee = (paymentMethod, orderTotal) => {
        if (paymentMethod?.feez_status === 1 && paymentMethod?.feez_amount) {
            // feez_amount is a percentage (like 10 for 10%)
            const feePercentage = paymentMethod.feez_amount;
            return (orderTotal * feePercentage) / 100;
        }
        return 0;
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(event.target)) {
                setShowPaymentDropdown(false);
            }
            if (scheduleDropdownRef.current && !scheduleDropdownRef.current.contains(event.target)) {
                setShowScheduleDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        refetchSchedule();
        refetchPaymentMethod();
    }, [refetchSchedule, refetchPaymentMethod]);

    useEffect(() => {
        if (dataPaymentMethod && dataPaymentMethod.payment_methods) {
            setPaymentMethods(dataPaymentMethod.payment_methods);

            // Set default payment method
            const cashMethod = dataPaymentMethod.payment_methods.find(m =>
                m.name.toLowerCase() === 'cash'
            );
            setSelectedPaymentMethod(cashMethod || dataPaymentMethod.payment_methods[0]);
        }
    }, [dataPaymentMethod]);

    useEffect(() => {
        if (dataSchedule?.schedule_list) {
            setScheduleList(dataSchedule.schedule_list);

            // Set default schedule
            const asapOption = dataSchedule.schedule_list.find(item =>
                item.name.toLowerCase().includes('asap') || item.name.toLowerCase().includes('now')
            ) || dataSchedule.schedule_list[0];
            setSelectedSchedule(asapOption);
        }
    }, [dataSchedule]);

    useEffect(() => {
        // Calculate order summary from cart
        if (cart.items.length > 0) {
            const deliveryPrice = orderType === 'delivery' ? (selectedAddress?.zone?.price || 0) : 0;

            // Calculate base amount
            const baseAmount = cart.total;

            // Calculate payment fee if payment method is selected and has fee
            let paymentFee = 0;
            if (selectedPaymentMethod) {
                const amountBeforeFee = taxSysType === "included"
                    ? (cart.subtotal - cart.totalDiscount || cart.priceAfterDiscount) + deliveryPrice
                    : cart.total + deliveryPrice;

                paymentFee = calculatePaymentFee(selectedPaymentMethod, amountBeforeFee);
            }

            // Calculate service fee
            let serviceFeesAmount = 0;
            if (cart.serviceFees) {
                if (cart.serviceFees.type === 'value') {
                    serviceFeesAmount = parseFloat(cart.serviceFees.amount);
                } else if (cart.serviceFees.type === 'precentage' || cart.serviceFees.type === 'percentage') {
                    // Check if there is data before calculating percentage, using subtotal
                    serviceFeesAmount = (cart.subtotal * parseFloat(cart.serviceFees.amount)) / 100;
                }
            }

            setOrderSummary({
                subtotal: cart.subtotal,
                discount: cart.totalDiscount,
                priceAfterDiscount: cart.priceAfterDiscount,
                tax: cart.totalTax,
                delivery: deliveryPrice,
                total: cart.total,
                paymentFee: paymentFee,
                serviceFees: serviceFeesAmount
            });
        }
    }, [cart, orderType, selectedAddress, selectedPaymentMethod, taxSysType]);

    // Custom Payment Method Select Component
    const PaymentMethodSelect = () => (
        <div className="relative" ref={paymentDropdownRef}>
            <button
                type="button"
                onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                className="flex items-center justify-between w-full p-4 transition-colors bg-white border border-gray-300 rounded-xl hover:border-mainColor"
            >
                <div className="flex items-center space-x-3">
                    {selectedPaymentMethod ? (
                        <>
                            <img
                                src={selectedPaymentMethod.logo_link}
                                alt={selectedPaymentMethod.name}
                                className="object-contain w-8 h-8"
                            />
                            <div className="flex flex-col items-start">
                                <span className="font-medium text-gray-900">
                                    {selectedPaymentMethod.name}
                                </span>
                                {selectedPaymentMethod?.feez_status === 1 && selectedPaymentMethod?.feez_amount > 0 && (
                                    <span className="text-xs text-orange-600">
                                        ({selectedPaymentMethod.feez_amount}% {t('fee')})
                                    </span>
                                )}
                            </div>
                        </>
                    ) : (
                        <span className="text-gray-500">{t('selectPaymentMethod')}</span>
                    )}
                </div>
                {showPaymentDropdown ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {showPaymentDropdown && (
                <div className="absolute z-10 w-full mt-1 overflow-auto bg-white border border-gray-300 shadow-lg rounded-xl max-h-60">
                    {paymentMethods.map((method) => (
                        <button
                            key={method.id}
                            type="button"
                            onClick={() => {
                                setSelectedPaymentMethod(method);
                                setShowPaymentDropdown(false);
                            }}
                            className={`w-full p-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${selectedPaymentMethod?.id === method.id ? 'bg-blue-50' : ''
                                }`}
                        >
                            <img
                                src={method.logo_link}
                                alt={method.name}
                                className="object-contain w-6 h-6"
                            />
                            <div className="flex flex-col items-start">
                                <span className="font-medium text-gray-900">{method.name}</span>
                                {method?.feez_status === 1 && method?.feez_amount > 0 && (
                                    <span className="text-xs text-orange-600">
                                        ({method.feez_amount}% {t('fee')})
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    // Custom Schedule Select Component
    const ScheduleSelect = () => (
        <div className="relative" ref={scheduleDropdownRef}>
            <button
                type="button"
                onClick={() => setShowScheduleDropdown(!showScheduleDropdown)}
                className="flex items-center justify-between w-full p-4 transition-colors bg-white border border-gray-300 rounded-xl hover:border-mainColor"
            >
                <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900">
                        {selectedSchedule ? selectedSchedule.name : t('selectScheduleTime')}
                    </span>
                </div>
                {showScheduleDropdown ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {showScheduleDropdown && (
                <div className="absolute z-10 w-full mt-1 overflow-auto bg-white border border-gray-300 shadow-lg rounded-xl max-h-60">
                    {scheduleList.map((schedule) => (
                        <button
                            key={schedule.id}
                            type="button"
                            onClick={() => {
                                setSelectedSchedule(schedule);
                                setShowScheduleDropdown(false);
                            }}
                            className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${selectedSchedule?.id === schedule.id ? 'bg-blue-50' : ''
                                }`}
                        >
                            <span className="font-medium text-gray-900">{schedule.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const handleReceiptChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReceiptFileName(file.name);
            convertFileToBase64(file);
        }
    };

    const handleReceiptClick = () => {
        receiptRef.current?.click();
    };

    const convertFileToBase64 = (file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result.split(',')[1];
            setReceiptFile(base64data);
        };
        reader.readAsDataURL(file);
    };

    const prepareOrderData = () => {
        // Calculate base amount first
        const baseAmount = taxSysType === "included"
            ? (orderSummary.subtotal - orderSummary.discount || orderSummary.priceAfterDiscount)
            : orderSummary.total;

        // Add delivery fee if applicable
        let totalAmount = baseAmount + (orderType === "delivery" ? (orderSummary.delivery || 0) : 0);

        // Add service fees
        totalAmount += (orderSummary.serviceFees || 0);
        // Calculate and add payment method fee
        const paymentFee = selectedPaymentMethod ?
            calculatePaymentFee(selectedPaymentMethod, totalAmount) : 0;
        // Add payment fee to total
        totalAmount += paymentFee;

        const products = cart.items.map(item => ({
            product_id: item.product.id,
            note: item.note,
            count: item.quantity,
            addons: Object.entries(item.addons)
                .filter(([_, addonData]) => addonData.checked)
                .map(([addonId, addonData]) => ({
                    addon_id: parseInt(addonId),
                    count: addonData.quantity || 1
                })),
            exclude_id: item.excludes,
            extra_id: Object.entries(item.extras)
                .filter(([_, quantity]) => quantity > 0)
                .map(([extraId]) => parseInt(extraId)),
            variation: Object.entries(item.variations).map(([variationId, optionIds]) => ({
                variation_id: parseInt(variationId),
                option_id: Array.isArray(optionIds) ? optionIds : [optionIds]
            }))
        }));

        return {
            notes: notes,
            payment_method_id: selectedPaymentMethod?.id,
            receipt: receiptFile,
            branch_id: orderType === 'take_away' ? selectedBranchId : "",
            address_id: orderType === 'delivery' ? selectedAddressId : "",
            amount: totalAmount,
            payment_fee: paymentFee,
            total_tax: cart.totalTax,
            total_discount: cart.totalDiscount,
            delivery_price: orderSummary.delivery,
            order_type: orderType,
            sechedule_slot_id: selectedSchedule?.id,
            products: products,
            source: "web",
            confirm_order: 0,
            service_fees: orderSummary.serviceFees || 0

        };
    };

    const handleSendOrder = async () => {
        if (!selectedPaymentMethod) {
            auth.toastError(t('pleaseSelectPaymentMethod'));
            return;
        }

        if (selectedPaymentMethod.type === "manuel" && selectedPaymentMethod.name !== "cash" && selectedPaymentMethod.name !== "cash on delivery" && !receiptFile) {
            auth.toastError(t('pleaseUploadReceiptForManualPayment'));
            return;
        }

        // Validate that required location is selected
        if (orderType === 'delivery' && !selectedAddressId) {
            auth.toastError('Please select a delivery address');
            return;
        }

        if (orderType === 'take_away' && !selectedBranchId) {
            auth.toastError('Please select a branch');
            return;
        }

        const orderData = prepareOrderData();

        try {
            await postOrder(orderData);
        } catch (error) {
            if (error?.response?.data?.errors === "You has order at proccessing") {
                setPendingOrderData(orderData);
                setShowProcessingModal(true);
            } else {
                console.error('Order error:', error);
                alert('Failed to place order. Please try again.');
            }
        }
    };

    const handleConfirmOrder = () => {
        setShowProcessingModal(false);
        postOrder({ ...pendingOrderData, confirm_order: 1 });
    };

    const handleCancelOrder = () => {
        setShowProcessingModal(false);
        navigate("/", { replace: true });
    };

    useEffect(() => {
        if (responseOrder) {
            if (responseOrder.data?.paymentLink) {
                window.open(responseOrder.data.paymentLink, "_blank");
            } else {
                navigate(`/order_traking/${responseOrder?.data?.success}`, {
                    replace: true,
                });
            }
        }
    }, [responseOrder, navigate]);

    if (loadingPaymentMethod || loadingSchedule) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <StaticSpinner />
            </div>
        );
    }

    // Calculate display totals for the order summary
    const baseTotal = taxSysType === "included"
        ? ((orderSummary.subtotal - orderSummary.discount) || orderSummary.priceAfterDiscount)
        : orderSummary.total;

    const deliveryFee = orderSummary.delivery || 0;
    const paymentFee = orderSummary.paymentFee || 0;
    const serviceFees = orderSummary.serviceFees || 0;
    const displayTotal = baseTotal + deliveryFee + paymentFee + serviceFees;

    return (
        <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="px-4 mx-auto max-w-8xl xl:px-8">
                {/* Header */}
                <div className="mb-6 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-gray-900">
                        {t('checkout')}
                    </h1>
                    <p className="text-lg text-gray-600">
                        {t('completeYourOrder')}
                    </p>
                </div>

                {/* Location Validation Warning */}
                {(orderType === 'delivery' && !selectedAddressId) ||
                    (orderType === 'take_away' && !selectedBranchId) ? (
                    <div className="p-4 mb-6 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
                            <p className="text-red-700">
                                {orderType === 'delivery'
                                    ? t('SelectDeliveryAddressBeforeProceeding')
                                    : t('SelectBranchBeforeProceeding')}
                            </p>

                        </div>
                    </div>
                ) : null}

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {/* Left Column - Order Details */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Order Summary Card */}
                        <div className="p-6 bg-white shadow-lg rounded-2xl">
                            <h2 className="flex items-center gap-3 mb-6 text-2xl font-bold text-gray-900">
                                <Receipt className="w-6 h-6 text-mainColor" />
                                {t('orderSummary')}
                            </h2>

                            <div className="space-y-4">
                                {cart.items.map((item) => (
                                    <div key={item.id} className="flex items-center p-4 rounded-lg bg-gray-50">
                                        <img
                                            src={item.product.image_link}
                                            alt={item.product.name}
                                            className="object-cover w-16 h-16 rounded-lg me-4"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                                            <p className="text-sm text-gray-600">{t('Qty')}: {item.quantity}</p>
                                            <p className="text-lg font-bold text-mainColor">
                                                {item.totalPrice.toFixed(2)} {t("egp")}
                                            </p>
                                        </div>
                                    </div>

                                ))}
                            </div>
                        </div>

                        {/* Delivery Information */}
                        <div className="p-6 bg-white shadow-lg rounded-2xl">
                            <h2 className="flex items-center gap-3 mb-6 text-2xl font-bold text-gray-900">
                                {orderType === 'delivery' ? (
                                    <Truck className="w-6 h-6 text-mainColor" />
                                ) : (
                                    <Store className="w-6 h-6 text-mainColor" />
                                )}
                                {orderType === 'delivery' ? t('deliveryInfo') : t('pickupInfo')}
                            </h2>

                            {orderType === 'delivery' && selectedAddress ? (
                                <div className="flex items-center p-4 space-x-4 rounded-lg bg-blue-50">
                                    <MapPin className="w-8 h-8 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-gray-900">{selectedAddress.address}</p>
                                        <p className="text-sm text-gray-600">{selectedAddress.additional_data}</p>
                                        {selectedAddress.zone?.price && (
                                            <p className="text-sm font-medium text-green-600">
                                                {t("Deliveryfee")}: {selectedAddress.zone.price} {t("egp")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : orderType === 'take_away' && selectedBranch ? (
                                <div className="flex items-center p-4 space-x-4 rounded-lg bg-blue-50">
                                    <Store className="w-8 h-8 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-gray-900">{selectedBranch.name}</p>
                                        <p className="text-sm text-gray-600">{selectedBranch.address}</p>
                                        <p className="text-sm text-gray-500">{selectedBranch.phone}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg bg-yellow-50">
                                    <p className="text-yellow-700">
                                        {orderType === 'delivery'
                                            ? t('NoDeliveryAddressSelected')
                                            : t('NoBranchSelected')}
                                    </p>
                                </div>

                            )}
                        </div>

                        {/* Schedule Time */}
                        <div className="p-6 bg-white shadow-lg rounded-2xl">
                            <h2 className="flex items-center gap-3 mb-6 text-2xl font-bold text-gray-900">
                                <Clock className="w-6 h-6 text-mainColor" />
                                {t('scheduleTime')}
                            </h2>

                            <ScheduleSelect />
                        </div>

                        {/* Payment Method */}
                        <div className="p-6 bg-white shadow-lg rounded-2xl">
                            <h2 className="flex items-center gap-3 mb-6 text-2xl font-bold text-gray-900">
                                <CreditCard className="w-6 h-6 text-mainColor" />
                                {t('paymentMethod')}
                            </h2>

                            <PaymentMethodSelect />

                            {/* Selected method details + description + receipt (for manual only) */}
                            {selectedPaymentMethod && (
                                <div className="mt-4 space-y-4">
                                    {/* Description - shown first */}
                                    {selectedPaymentMethod.description && (
                                        <div className="p-4 rounded-lg bg-gray-50">
                                            <p className="text-sm text-gray-700">
                                                {selectedPaymentMethod.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Manual payment → receipt upload right here and REQUIRED */}
                                    {(selectedPaymentMethod.type === "manuel" && selectedPaymentMethod.name !== "cash" && selectedPaymentMethod.name !== "cash on delivery") && (
                                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                                            <label className="block mb-2 text-sm font-semibold text-red-600">
                                                {t('uploadReceipt')} <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center space-x-4">
                                                <button
                                                    type="button"
                                                    onClick={handleReceiptClick}
                                                    className="px-4 py-2 text-sm font-medium transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                                                >
                                                    {receiptFileName ? t('changeFile') : t('chooseFile')}
                                                </button>
                                                <span className="text-sm text-gray-600">
                                                    {receiptFileName || t('noFileChosen')}
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                ref={receiptRef}
                                                onChange={handleReceiptChange}
                                                className="hidden"
                                                accept="image/*,.pdf"
                                                required={selectedPaymentMethod.type === "manuel" && selectedPaymentMethod.name !== "cash" && selectedPaymentMethod.name !== "cash on delivery"}
                                            />
                                            <p className="mt-2 text-xs text-gray-500">
                                                {t('Supported formats')}: JPG, PNG, PDF
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Additional Notes & Receipt */}
                        <div className="p-6 bg-white shadow-lg rounded-2xl">
                            <h2 className="flex items-center gap-3 mb-6 text-2xl font-bold text-gray-900">
                                <FileText className="w-6 h-6 text-mainColor" />
                                {t('additionalInformation')}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">
                                        {t('specialInstructions')}
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={t('addSpecialInstructions')}
                                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-mainColor"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Order Summary & Checkout */}
                    <div className="lg:col-span-1">
                        <div className="sticky p-4 md:p-6 bg-white shadow-lg rounded-2xl top-6">
                            <h2 className="mb-6 text-xl font-bold text-gray-900">
                                {t('orderTotal')}
                            </h2>

                            <div className="mb-6 space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>{t("Subtotal")} ({cart.itemCount} {t("items")})</span>
                                    <span>{orderSummary.subtotal.toFixed(2)} {t("egp")}</span>
                                </div>

                                {orderSummary.serviceFees > 0 && (
                                    <div className="flex justify-between text-blue-600">
                                        <span>{t('ServiceFees')}</span>
                                        <span>+{orderSummary.serviceFees.toFixed(2)} {t("egp")}</span>
                                    </div>
                                )}

                                {orderSummary.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>{t('discount')}</span>
                                        <span>-{orderSummary.discount.toFixed(2)} {t("egp")}</span>
                                    </div>
                                )}

                                {orderSummary.priceAfterDiscount > 0 && (
                                    <div className="flex justify-between text-blue-600">
                                        <span>{t('priceAfterDiscount')}</span>
                                        <span>{orderSummary.priceAfterDiscount.toFixed(2)} {t("egp")}</span>
                                    </div>
                                )}

                                {(orderSummary.tax > 0) && taxSysType !== "included" && (
                                    <div className="flex justify-between text-blue-600">
                                        <span>{t('tax')}</span>
                                        <span>+{orderSummary.tax.toFixed(2)} {t("egp")}</span>
                                    </div>
                                )}

                                {orderSummary.delivery > 0 && (
                                    <div className="flex justify-between text-purple-600">
                                        <span>{t('deliveryFee')}</span>
                                        <span>+{orderSummary.delivery.toFixed(2)} {t("egp")}</span>
                                    </div>
                                )}

                                {selectedPaymentMethod?.feez_status === 1 && selectedPaymentMethod?.feez_amount > 0 && (
                                    <div className="flex justify-between text-orange-600">
                                        <span>
                                            {t('paymentFee')} ({selectedPaymentMethod.feez_amount}%)
                                        </span>
                                        <span>
                                            +{orderSummary.paymentFee.toFixed(2)} {t("egp")}
                                        </span>
                                    </div>
                                )}

                                <div className="pt-3 border-t">
                                    <div className="flex justify-between text-lg font-bold text-gray-900">
                                        <span>{t('total')}</span>
                                        <span>
                                            {displayTotal.toFixed(2)} {t("egp")}
                                        </span>
                                    </div>
                                </div>

                            </div>

                            {/* Checkout Button */}
                            <button
                                onClick={handleSendOrder}
                                disabled={loadingOrder || !selectedPaymentMethod ||
                                    (orderType === 'delivery' && !selectedAddressId) ||
                                    (orderType === 'take_away' && !selectedBranchId)}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 ${loadingOrder || !selectedPaymentMethod ||
                                    (orderType === 'delivery' && !selectedAddressId) ||
                                    (orderType === 'take_away' && !selectedBranchId)
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-mainColor to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
                                    }`}
                            >
                                {loadingOrder ? (
                                    <div className="flex items-center justify-center">
                                        <StaticSpinner size="small" />
                                        <span className="ml-2">{t('processing')}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        {t('placeOrder')}
                                    </div>
                                )}
                            </button>

                        </div>
                    </div>
                </div>
            </div>

            {/* Processing Order Modal */}
            {showProcessingModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                            onClick={handleCancelOrder}
                        />

                        {/* Modal Panel */}
                        <div className={`inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl
               ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="w-8 h-8 text-yellow-500" />
                                </div>

                                {/* Title & Message */}
                                <div className={i18n.language === 'ar' ? 'mr-4' : 'ml-4'}>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {t("OrderAlreadyinProgress")}
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            {t("You currently have an order being processed. Are you sure you want to place another order?")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons - reverse order and spacing in Arabic */}
                            <div className={`flex mt-6 ${i18n.language === 'ar' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                                {/* Confirm Button */}
                                <button
                                    onClick={handleConfirmOrder}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md bg-mainColor hover:bg-white hover:text-mainColor focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    {t("PlaceNewOrder")}
                                </button>

                                {/* Cancel Button */}
                                <button
                                    onClick={handleCancelOrder}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                >
                                    {t("NoCancel")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckOut;