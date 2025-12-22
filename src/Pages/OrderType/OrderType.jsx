import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGet } from '../../Hooks/useGet';
import { useDelete } from '../../Hooks/useDelete';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../Context/Auth';
import { setOrderType, setSelectedAddress, setSelectedBranch } from '../../Store/Slices/orderTypeSlice';
import StaticSpinner from '../../Components/Spinners/StaticSpinner';
import BranchItem from './sections/BranchItem';
import AddressItem from './sections/AddressItem';
import ConfirmationDialog from './sections/ConfirmationDialog';
import { MdDeliveryDining } from 'react-icons/md';
import { Plus } from 'lucide-react';
import { GiMeal } from 'react-icons/gi';
const OrderType = () => {
  const { t } = useTranslation();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useAuth();
  const user = useSelector((state) => state.user?.data);
  const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');
  const selectedAddressId = useSelector((state) => state.orderType?.selectedAddressId);
  const selectedBranchId = useSelector((state) => state.orderType?.selectedBranchId);
  const [addresses, setAddresses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [orderTypes, setOrderTypes] = useState([]);
  const [selectedOrderType, setSelectedOrderType] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [categories, setCategories] = useState([]);

  // Fetch initial data
  const {
    refetch: refetchAddress,
    loading: loadingAddress,
    data: addressData,
    error: addressError,
  } = useGet({
    url: `${apiUrl}/customer/address/addresses?locale=${selectedLanguage}`,
    required: !!user?.token,
    autoFetch: false
  });

  const {
    refetch: refetchBranches,
    loading: loadingBranches,
    data: branchesData,
    error: branchesError,
  } = useGet({
    url: `${apiUrl}/customer/address/lists1?locale=${selectedLanguage}`,
  });

  // const {
  //   refetch: refetchCategories,
  //   loading: loadingCategories,
  //   data: categoriesData,
  // } = useGet({
  //   url: `${apiUrl}/customer/home/categories?locale=${selectedLanguage}`,
  // });

  // Delete address hook
  const { deleteData } = useDelete();

  // Normalize order type
  const normalizeOrderType = useCallback((typeString) => {
    if (!typeString) return '';
    return typeString
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim();
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const savedOrderType = localStorage.getItem('orderType');
    const savedAddressId = localStorage.getItem('selectedAddressId');
    const savedBranchId = localStorage.getItem('selectedBranchId');
    if (savedOrderType) {
      setSelectedOrderType(savedOrderType);
      dispatch(setOrderType(savedOrderType));
    }
    if (savedAddressId) {
      dispatch(setSelectedAddress(parseInt(savedAddressId)));
    }
    if (savedBranchId) {
      dispatch(setSelectedBranch(parseInt(savedBranchId)));
    }
  }, [dispatch]);

  // Fetch data on mount and language change
  useEffect(() => {
    if (user?.token) {
      refetchAddress();
    }
    refetchBranches();
    // refetchCategories();
  }, [selectedLanguage, refetchAddress, refetchBranches]);

  // Process address data
  useEffect(() => {
    if (addressData && !loadingAddress) {
      setAddresses(addressData.addresses || []);
    }
    if (addressError) {
      auth.toastError(t('failedToLoadAddresses'));
    }
  }, [addressData, loadingAddress, addressError, auth, t]);

  // Process branches and order types data
  useEffect(() => {
    if (branchesData && !loadingBranches) {
      setOrderTypes(branchesData.order_types || []);
      setBranches(branchesData.branches || []);
      if (!selectedOrderType && branchesData.order_types?.length > 0) {
        const defaultType = branchesData.order_types.find((type) => type.type === 'take_away') || branchesData.order_types[0];
        if (defaultType) {
          setSelectedOrderType(defaultType.type);
          dispatch(setOrderType(defaultType.type));
        }
      }
    }
    if (branchesError) {
      auth.toastError(t('failedToLoadBranches'));
    }
  }, [branchesData, loadingBranches, branchesError, auth, t, selectedOrderType, dispatch]);

  // Process categories data
  // useEffect(() => {
  //   if (categoriesData && !loadingCategories) {
  //     setCategories(categoriesData.categories || []);
  //   }
  // }, [categoriesData, loadingCategories]);

  // Handle order type selection
  const handleOrderTypeSelect = useCallback(
    (typeObj) => {
      if (typeObj.type === 'delivery' && !user?.token) {
        navigate('/login', { replace: true });
        return;
      }
      setSelectedOrderType(typeObj.type);
      dispatch(setOrderType(typeObj.type));
    },
    [dispatch, navigate, user?.token]
  );

  // Handle address selection
  const handleAddressSelect = useCallback(
    (address) => {
      if (address.branch_status === 0) {
        auth.toastError(address.block_reason || t('AddressBlockedDefault'));
        return;
      }
      dispatch(setSelectedAddress(address.id));
      // const firstCategoryId = categories[0]?.id;
      const query = `address_id=${address.id}&order_type=delivery`;
      // navigate(firstCategoryId ? `/products/${firstCategoryId}?${query}` : `/products/${address.id}?${query}`, { replace: true });
      // navigate(`/products?${query}`, { replace: true });

      // Save to localStorage for persistence
      localStorage.setItem('selectedAddressId', address.id);
      localStorage.setItem('selectedBranchId', '');
      localStorage.setItem('orderType', 'delivery');
      navigate('/home', { replace: true });
    },
    [dispatch, navigate, auth, t]
  );

  // Handle branch selection
  const handleBranchSelect = useCallback(
    (branch) => {
      if (branch.status === 0) {
        auth.toastError(branch.block_reason || t('BranchBlockedDefault'));
        return;
      }
      dispatch(setSelectedBranch(branch.id));
      // const firstCategoryId = categories[0]?.id;
      const query = `branch_id=${branch.id}&order_type=take_away`;
      // navigate(firstCategoryId ? `/products/${firstCategoryId}?${query}` : `/products/${branch.id}?${query}`, { replace: true });
      // navigate(`/products?${query}`, { replace: true });

      // Save to localStorage for persistence
      localStorage.setItem('selectedBranchId', branch.id);
      localStorage.setItem('selectedAddressId', '');
      localStorage.setItem('orderType', 'take_away');
      navigate('/home', { replace: true });
    },
    [dispatch, navigate, auth, t]
  );

  // Handle address deletion
  const handleDeleteAddress = useCallback((addressId) => {
    setAddressToDelete(addressId);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteAddress = useCallback(async () => {
    if (!addressToDelete) return;
    setDeletingAddressId(addressToDelete);
    const success = await deleteData(
      `${apiUrl}/customer/address/delete/${addressToDelete}`,
      `${addresses.find((loc) => loc.id === addressToDelete)?.address} ${t('DeletedSuccess')}`
    );
    if (success) {
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressToDelete));
      if (addressToDelete === selectedAddressId) {
        dispatch(setSelectedAddress(null));
      }
    }
    setShowDeleteConfirm(false);
    setAddressToDelete(null);
    setDeletingAddressId(null);
  }, [addressToDelete, deleteData, apiUrl, selectedAddressId, dispatch, t, addresses]);

  // Handle add new address
  const handleAddAddress = useCallback(() => {
    if (!user?.token) {
      navigate('/login', { replace: true });
      return;
    }
    navigate('/add_address');
  }, [navigate, user?.token]);

  // Get icon for order type
  const getOrderTypeIcon = (type) => {
    if (type === 'delivery') return <MdDeliveryDining size={64} />;
    if (type === 'take_away') return <GiMeal size={64} />;
    return null;
  };

  // Skeleton Loading State
  if (loadingAddress || loadingBranches) {
    return (
      <div className="flex flex-col w-full gap-3 mb-5">
        <div className="flex flex-col w-full gap-5 p-4 lg:flex-row">
          <div className="flex flex-col items-center justify-center w-full gap-5 pt-4 lg:w-1/2 gap-x-3 md:p-6">
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center justify-center w-full gap-x-4 md:gap-x-6">
              {[1, 2].map((i) => (
                <div key={i} className="min-w-40 h-40 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center w-full gap-5 lg:w-1/2 gap-x-3">
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full h-20 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-3 mb-5">
      <div className="flex flex-col w-full gap-5 p-4 lg:flex-row">
        {/* Order Type Selection */}
        <div className="flex flex-col items-center justify-center w-full gap-5 pt-4 lg:w-1/2 gap-x-3 md:p-6">
          <h1 className="text-2xl font-semibold text-gray-800">{t('orderType')}</h1>
          <div className="flex items-center justify-center w-full gap-x-4 md:gap-x-6">
            {orderTypes.map((typeObj) =>
              typeObj.status === 1 ? (
                <button
                  key={typeObj.id}
                  className={`flex min-w-40 h-40 flex-col items-center justify-center gap-2 text-xl font-TextFontRegular px-4 py-2 rounded-lg cursor-pointer border-2 transition-all ease-in-out duration-300 ${selectedOrderType === typeObj.type
                    ? 'text-mainColor border-mainColor bg-white'
                    : 'text-mainColor bg-gray-100 border-gray-100 hover:bg-mainColor hover:text-white'
                    }`}
                  onClick={() => handleOrderTypeSelect(typeObj)}
                  role="button"
                  aria-label={t(normalizeOrderType(typeObj.type).toLowerCase())}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleOrderTypeSelect(typeObj)}
                >
                  {getOrderTypeIcon(typeObj.type)}
                  <span>{t(normalizeOrderType(typeObj.type).toLowerCase())}</span>
                </button>
              ) : null
            )}
          </div>
        </div>

        {/* Address/Branch Selection */}
        <div className="flex flex-col justify-center w-full gap-5 lg:w-1/2 gap-x-3">
          {selectedOrderType === 'delivery' && user?.token && (
            <>
              <h1 className="text-2xl font-semibold text-gray-800">{t('deliveryAddresses')}</h1>
              <div className="flex justify-end w-full">
                <button
                  onClick={handleAddAddress}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white transition rounded-lg bg-mainColor hover:bg-mainColor/90"
                  aria-label={t('addNewAddress')}
                >
                  <Plus className="h-5 w-5" />
                  <span>{t('addNewAddress')}</span>
                </button>
              </div>
              <div className="w-full max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-1 gap-3 max-h-[500px] overflow-y-auto scrollPage">
                {addresses.map((addr) => (
                  <AddressItem
                    key={addr.id}
                    address={{ ...addr, deleting: deletingAddressId === addr.id }}
                    isSelected={selectedAddressId === addr.id}
                    onSelect={handleAddressSelect}
                    onDelete={handleDeleteAddress}
                  />
                ))}
              </div>
            </>
          )}
          {selectedOrderType === 'take_away' && (
            <div className="flex flex-col items-start w-full gap-3 justify-evenly">
              <h1 className="text-2xl font-semibold text-gray-800">{t('branches')}</h1>
              <div className="w-full max-h-[500px] overflow-y-auto scrollPage flex flex-col gap-3">
                {branches.map((branch) => (
                  <BranchItem
                    key={branch.id}
                    branch={branch}
                    isSelected={selectedBranchId === branch.id}
                    onClick={() => handleBranchSelect(branch)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onConfirm={confirmDeleteAddress}
        onCancel={() => setShowDeleteConfirm(false)}
        message={
          <>
            {t('Areyousureyouwanttodeletethislocation?')}
            <div className="mt-1 text-sm font-semibold text-gray-800">
              {addresses.find((loc) => loc.id === addressToDelete)?.address || '-'}
            </div>
          </>
        }
      />
    </div>
  );
};

export default OrderType;