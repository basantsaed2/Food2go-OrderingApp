import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import StaticSpinner from '../../Components/Spinners/StaticSpinner';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useGet } from '../../Hooks/useGet';
import ProductCard from '../../Components/ProductCard';
import { setTaxType } from '../../Store/Slices/taxTypeSlice';
import { useAuth } from '../../Context/Auth';
import { setSelectedBranch, setSelectedAddress, setOrderType } from '../../Store/Slices/orderTypeSlice';
import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';

const Products = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const auth = useAuth();
  const { t } = useTranslation();
  const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');
  const isRTL = selectedLanguage === 'ar';
  const user = useSelector(state => state.user?.data?.user);

  // Read from Redux state
  const orderType = useSelector((state) => state.orderType?.orderType);
  const selectedAddressId = useSelector((state) => state.orderType?.selectedAddressId);
  const selectedBranchId = useSelector((state) => state.orderType?.selectedBranchId);

  const [categoriesData, setCategoriesData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(id ? parseInt(id) : null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const scrollContainerRef = useRef(null);

  // Extract query parameters DIRECTLY from URL
  const queryParams = new URLSearchParams(location.search);
  const urlAddressId = queryParams.get('address_id');
  const urlBranchId = queryParams.get('branch_id');
  const urlOrderType = queryParams.get('order_type');

  // Use URL parameters first, fallback to Redux state
  const effectiveAddressId = urlAddressId ? parseInt(urlAddressId) : selectedAddressId;
  const effectiveBranchId = urlBranchId ? parseInt(urlBranchId) : selectedBranchId;
  const effectiveOrderType = urlOrderType || orderType;

  // Sync URL parameters with Redux state on component mount
  useEffect(() => {
    const savedOrderType = localStorage.getItem('orderType');
    const savedAddressId = localStorage.getItem('selectedAddressId');
    const savedBranchId = localStorage.getItem('selectedBranchId');

    if (urlOrderType && urlOrderType !== orderType) {
      dispatch(setOrderType(urlOrderType));
    } else if (savedOrderType && savedOrderType !== orderType) {
      dispatch(setOrderType(savedOrderType));
    }

    if (urlAddressId && parseInt(urlAddressId) !== selectedAddressId) {
      dispatch(setSelectedAddress(parseInt(urlAddressId)));
    } else if (savedAddressId && parseInt(savedAddressId) !== selectedAddressId) {
      dispatch(setSelectedAddress(parseInt(savedAddressId)));
    }

    if (urlBranchId && parseInt(urlBranchId) !== selectedBranchId) {
      dispatch(setSelectedBranch(parseInt(urlBranchId)));
    } else if (savedBranchId && parseInt(savedBranchId) !== selectedBranchId) {
      dispatch(setSelectedBranch(parseInt(savedBranchId)));
    }
  }, [dispatch, urlOrderType, urlAddressId, urlBranchId, orderType, selectedAddressId, selectedBranchId]);

  // Build API URL for categories
  const buildCategoriesUrl = useCallback(() => {
    let url = `${apiUrl}/customer/home/categories?locale=${selectedLanguage}`;
    if (effectiveAddressId && effectiveOrderType === 'delivery') {
      url += `&address_id=${effectiveAddressId}`;
    } else if (effectiveBranchId && effectiveOrderType === 'take_away') {
      url += `&branch_id=${effectiveBranchId}`;
    }
    return url;
  }, [apiUrl, selectedLanguage, effectiveAddressId, effectiveBranchId, effectiveOrderType]);

  // Build API URL for products
  const buildProductsUrl = useCallback(() => {
    if (!selectedCategory) return null;
    let url = `${apiUrl}/customer/home/products_in_category/${selectedCategory}?locale=${selectedLanguage}${user ? `&user_id=${user.id}` : ""}`;
    if (effectiveAddressId && effectiveOrderType === 'delivery') {
      url += `&address_id=${effectiveAddressId}`;
    } else if (effectiveBranchId && effectiveOrderType === 'take_away') {
      url += `&branch_id=${effectiveBranchId}`;
    }
    return url;
  }, [apiUrl, selectedCategory, selectedLanguage, effectiveAddressId, effectiveBranchId, effectiveOrderType, user]);

  // Fetch categories
  const {
    refetch: refetchCategories,
    loading: loadingCategories,
    data: dataCategories,
  } = useGet({
    url: buildCategoriesUrl(),
  });

  // Fetch products
  const {
    refetch: refetchProducts,
    loading: loadingProducts,
    data: dataProducts,
  } = useGet({
    url: buildProductsUrl(),
  });

  // Refetch when language or location changes
  useEffect(() => {
    refetchCategories();
  }, [selectedLanguage, effectiveAddressId, effectiveBranchId, effectiveOrderType, refetchCategories]);

  // Update categories data
  useEffect(() => {
    if (dataCategories && !loadingCategories) {
      setCategoriesData(dataCategories.categories || []);
      if (id && !selectedCategory) {
        setSelectedCategory(parseInt(id));
      }
    }
  }, [dataCategories, loadingCategories, id, selectedCategory]);

  // Auto-select first category if none selected
  useEffect(() => {
    if (!selectedCategory && categoriesData.length > 0) {
      const firstCategory = categoriesData[0].id;
      setSelectedCategory(firstCategory);
      const query = new URLSearchParams();
      if (effectiveOrderType === 'delivery' && effectiveAddressId) {
        query.set('address_id', effectiveAddressId);
        query.set('order_type', 'delivery');
      } else if (effectiveOrderType === 'take_away' && effectiveBranchId) {
        query.set('branch_id', effectiveBranchId);
        query.set('order_type', 'take_away');
      }
      navigate(`/products/${firstCategory}?${query.toString()}`, { replace: true });
    }
  }, [selectedCategory, categoriesData, effectiveOrderType, effectiveAddressId, effectiveBranchId, navigate]);

  // Manage products loading state
  useEffect(() => {
    if (loadingProducts) {
      setIsProductsLoading(true);
      setProductsData([]);
      setFilteredProducts([]);
    } else {
      setIsProductsLoading(false);
    }
  }, [loadingProducts]);

  // Update products data
  useEffect(() => {
    if (dataProducts && !loadingProducts) {
      const prods = dataProducts.products || [];
      setProductsData(prods);
      setFilteredProducts(prods);
      dispatch(setTaxType(dataProducts.tax));
    }
  }, [dataProducts, loadingProducts, dispatch]);

  // Debounced search filtering
  const filterProducts = useCallback(
    debounce((query, products, subCategoryId) => {
      let filtered = products;
      if (subCategoryId) {
        filtered = filtered.filter((product) => product.sub_category_id === subCategoryId);
      }
      if (query) {
        filtered = filtered.filter((product) =>
          product.name.toLowerCase().includes(query.toLowerCase())
        );
      }
      setFilteredProducts(filtered);
    }, 300),
    []
  );

  // Update filtered products when products, subcategory, or search query changes
  useEffect(() => {
    filterProducts(searchQuery, productsData, selectedSubCategory);
  }, [productsData, selectedSubCategory, searchQuery, filterProducts]);

  // Refetch products when category changes
  useEffect(() => {
    if (selectedCategory) {
      setProductsData([]);
      setFilteredProducts([]);
      setSelectedSubCategory(null);
      setSearchQuery('');

      refetchProducts();
    }
  }, [selectedCategory, refetchProducts]);

  // RTL-aware scroll functions for categories
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = isRTL ? 300 : -300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = isRTL ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Handle category click
  const handleCategoryClick = useCallback(
    (categoryId) => {
      setProductsData([]);
      setFilteredProducts([]);
      setSelectedSubCategory(null);
      setSearchQuery('');

      setSelectedCategory(categoryId);
      const query = new URLSearchParams();
      if (effectiveOrderType === 'delivery' && effectiveAddressId) {
        query.set('address_id', effectiveAddressId);
        query.set('order_type', 'delivery');
      } else if (effectiveOrderType === 'take_away' && effectiveBranchId) {
        query.set('branch_id', effectiveBranchId);
        query.set('order_type', 'take_away');
      }
      navigate(`/products/${categoryId}?${query.toString()}`);
      window.scrollTo(0, 0);
    },
    [navigate, effectiveAddressId, effectiveBranchId, effectiveOrderType]
  );

  // Handle subcategory click
  const handleSubCategoryClick = useCallback((subCategoryId) => {
    setSelectedSubCategory(subCategoryId);
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const currentCategory = categoriesData.find((cat) => cat.id === selectedCategory);
  const subCategories = currentCategory?.sub_categories || [];

  // Show loading only if we're actively loading categories and no categories exist yet
  if (loadingCategories && categoriesData.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <StaticSpinner />
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-screen bg-gray-50"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Categories Navigation */}
      <div className="sticky top-0 z-20 bg-white shadow-md py-4 px-4">
        <div className="w-full relative">
          <div className={`flex items-center justify-between mb-4`}>
            <h2 className={`text-xl font-bold text-mainColor ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('categories')}
            </h2>
            {categoriesData.length > 1 && (
              <div className={`flex ${isRTL ? 'space-x-reverse' : 'space-x-2'} space-x-2`}>
                <button
                  onClick={scrollLeft}
                  className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                  aria-label={isRTL ? t('scrollRight') : t('scrollLeft')}
                >
                  <ChevronLeft className={`h-5 w-5 text-gray-700 transform ${isRTL ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={scrollRight}
                  className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                  aria-label={isRTL ? t('scrollLeft') : t('scrollRight')}
                >
                  <ChevronRight className={`h-5 w-5 text-gray-700 transform ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {categoriesData.length > 0 ? (
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto scrollbar-hide pb-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                [isRTL ? 'paddingRight' : 'paddingLeft']: '0',
                [isRTL ? 'paddingLeft' : 'paddingRight']: '0'
              }}
            >
              <div className={`flex ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-3`}>
                {categoriesData.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-lg font-medium transition-colors ${selectedCategory === category.id
                      ? 'bg-mainColor text-whiteColor'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">{t('noCategoriesAvailable')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Location Warning Banner */}
      {(!effectiveAddressId && !effectiveBranchId) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className={isRTL ? 'mr-3' : 'ml-3'}>
              <p className={`text-sm text-yellow-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                <strong>{t('note')}:</strong> {t('locationWarningMessage')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subcategories */}
      {subCategories.length > 0 && (
        <div className="bg-white py-3 px-4 border-b">
          <div className="max-w-7xl mx-auto">
            <h3 className={`text-md font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('subcategories')}
            </h3>
            <div className="flex overflow-x-auto scrollbar-hide">
              <div className={`flex ${isRTL ? 'space-x-reverse' : 'space-x-2'} space-x-2`}>
                <button
                  onClick={() => setSelectedSubCategory(null)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${selectedSubCategory === null
                    ? 'bg-mainColor text-whiteColor'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                >
                  {t('all')}
                </button>
                {subCategories.map((subCategory) => (
                  <button
                    key={subCategory.id}
                    onClick={() => handleSubCategoryClick(subCategory.id)}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${selectedSubCategory === subCategory.id
                      ? 'bg-mainColor text-whiteColor'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                  >
                    {subCategory.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="w-full p-4">
        {/* Search Input */}
        <div className={`relative mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="w-full md:w-3/6 xl:w-2/6">
            <div className="relative flex-grow">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={t('searchProductsPlaceholder')}
                className={`w-full py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-mainColor focus:border-mainColor transition-all duration-300 bg-white shadow-sm placeholder-gray-400 text-gray-800 ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'
                  }`}
              />
              <Search className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'
                }`} />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className={`absolute top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors ${isRTL ? 'left-3' : 'right-3'
                    }`}
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {isProductsLoading ? (
          <div className="flex justify-center items-center py-12">
            <StaticSpinner />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={product.favourite}
                language={selectedLanguage}
              />
            ))}
          </div>
        ) : (
          <div className={`text-center py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="text-gray-500 text-lg">
              {searchQuery
                ? t('noProductsMatchSearch')
                : selectedCategory && productsData.length === 0
                  ? t('noProductsInCategory')
                  : t('selectCategoryToViewProducts')
              }
            </p>
            {selectedCategory && (!effectiveAddressId && !effectiveBranchId) && (
              <p className="text-gray-400 text-sm mt-2">
                {t('productsAvailableWithLocation')}
              </p>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Products;






// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import StaticSpinner from '../../Components/Spinners/StaticSpinner';
// import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
// import { useGet } from '../../Hooks/useGet';
// import ProductCard from '../../Components/ProductCard';
// import { setTaxType } from '../../Store/Slices/taxTypeSlice';
// import { useAuth } from '../../Context/Auth';
// import { setSelectedBranch, setSelectedAddress, setOrderType } from '../../Store/Slices/orderTypeSlice';
// import debounce from 'lodash/debounce';
// import { useTranslation } from 'react-i18next';

// const Products = () => {
//   const apiUrl = import.meta.env.VITE_API_BASE_URL;
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const location = useLocation();
//   const auth = useAuth();
//   const { t } = useTranslation();
//   const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');
//   const isRTL = selectedLanguage === 'ar';
//   const user = useSelector(state => state.user?.data?.user);
//   const mainData = useSelector(state => state.mainData?.data);
//   const continuesStatus = mainData?.continues_status;
//   const isSingleColumn = continuesStatus == 1;

//   // Read from Redux state
//   const orderType = useSelector((state) => state.orderType?.orderType);
//   const selectedAddressId = useSelector((state) => state.orderType?.selectedAddressId);
//   const selectedBranchId = useSelector((state) => state.orderType?.selectedBranchId);

//   const [categoriesData, setCategoriesData] = useState([]);
//   const [productsData, setProductsData] = useState([]);
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(id ? parseInt(id) : null);
//   const [selectedSubCategory, setSelectedSubCategory] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isProductsLoading, setIsProductsLoading] = useState(false);
//   const scrollContainerRef = useRef(null);

//   const [allProductsByCategory, setAllProductsByCategory] = useState({});
//   const [loadingAllProducts, setLoadingAllProducts] = useState(false);
//   const observerRefs = useRef({});
//   const categoryButtonRefs = useRef({});
//   const isInternalScroll = useRef(false);

//   // Extract query parameters DIRECTLY from URL
//   const queryParams = new URLSearchParams(location.search);
//   const urlAddressId = queryParams.get('address_id');
//   const urlBranchId = queryParams.get('branch_id');
//   const urlOrderType = queryParams.get('order_type');

//   // Use URL parameters first, fallback to Redux state
//   const effectiveAddressId = urlAddressId ? parseInt(urlAddressId) : selectedAddressId;
//   const effectiveBranchId = urlBranchId ? parseInt(urlBranchId) : selectedBranchId;
//   const effectiveOrderType = urlOrderType || orderType;

//   // Sync URL parameters with Redux state on component mount
//   useEffect(() => {
//     const savedOrderType = localStorage.getItem('orderType');
//     const savedAddressId = localStorage.getItem('selectedAddressId');
//     const savedBranchId = localStorage.getItem('selectedBranchId');

//     if (urlOrderType && urlOrderType !== orderType) {
//       dispatch(setOrderType(urlOrderType));
//     } else if (savedOrderType && savedOrderType !== orderType) {
//       dispatch(setOrderType(savedOrderType));
//     }

//     if (urlAddressId && parseInt(urlAddressId) !== selectedAddressId) {
//       dispatch(setSelectedAddress(parseInt(urlAddressId)));
//     } else if (savedAddressId && parseInt(savedAddressId) !== selectedAddressId) {
//       dispatch(setSelectedAddress(parseInt(savedAddressId)));
//     }

//     if (urlBranchId && parseInt(urlBranchId) !== selectedBranchId) {
//       dispatch(setSelectedBranch(parseInt(urlBranchId)));
//     } else if (savedBranchId && parseInt(savedBranchId) !== selectedBranchId) {
//       dispatch(setSelectedBranch(parseInt(savedBranchId)));
//     }
//   }, [dispatch, urlOrderType, urlAddressId, urlBranchId, orderType, selectedAddressId, selectedBranchId]);

//   // Build API URL for categories
//   const buildCategoriesUrl = useCallback(() => {
//     let url = `${apiUrl}/customer/home/categories?locale=${selectedLanguage}`;
//     if (effectiveAddressId && effectiveOrderType === 'delivery') {
//       url += `&address_id=${effectiveAddressId}`;
//     } else if (effectiveBranchId && effectiveOrderType === 'take_away') {
//       url += `&branch_id=${effectiveBranchId}`;
//     }
//     return url;
//   }, [apiUrl, selectedLanguage, effectiveAddressId, effectiveBranchId, effectiveOrderType]);

//   // Build API URL for products
//   const buildProductsUrl = useCallback(() => {
//     if (!selectedCategory) return null;
//     let url = `${apiUrl}/customer/home/products_in_category/${selectedCategory}?locale=${selectedLanguage}${user ? `&user_id=${user.id}` : ""}`;
//     if (effectiveAddressId && effectiveOrderType === 'delivery') {
//       url += `&address_id=${effectiveAddressId}`;
//     } else if (effectiveBranchId && effectiveOrderType === 'take_away') {
//       url += `&branch_id=${effectiveBranchId}`;
//     }
//     return url;
//   }, [apiUrl, selectedCategory, selectedLanguage, effectiveAddressId, effectiveBranchId, effectiveOrderType, user]);

//   // Fetch categories
//   const {
//     refetch: refetchCategories,
//     loading: loadingCategories,
//     data: dataCategories,
//   } = useGet({
//     url: buildCategoriesUrl(),
//   });

//   // Fetch products
//   const {
//     refetch: refetchProducts,
//     loading: loadingProducts,
//     data: dataProducts,
//   } = useGet({
//     url: buildProductsUrl(),
//   });

//   // Refetch when language or location changes
//   useEffect(() => {
//     refetchCategories();
//   }, [selectedLanguage, effectiveAddressId, effectiveBranchId, effectiveOrderType, refetchCategories]);

//   // Update categories data
//   useEffect(() => {
//     if (dataCategories && !loadingCategories) {
//       setCategoriesData(dataCategories.categories || []);
//       if (id && !selectedCategory) {
//         setSelectedCategory(parseInt(id));
//       }
//     }
//   }, [dataCategories, loadingCategories, id, selectedCategory]);

//   // Auto-select first category if none selected
//   useEffect(() => {
//     if (!selectedCategory && categoriesData.length > 0) {
//       const firstCategory = categoriesData[0].id;
//       setSelectedCategory(firstCategory);
//       const query = new URLSearchParams();
//       if (effectiveOrderType === 'delivery' && effectiveAddressId) {
//         query.set('address_id', effectiveAddressId);
//         query.set('order_type', 'delivery');
//       } else if (effectiveOrderType === 'take_away' && effectiveBranchId) {
//         query.set('branch_id', effectiveBranchId);
//         query.set('order_type', 'take_away');
//       }
//       navigate(`/products/${firstCategory}?${query.toString()}`, { replace: true });
//     }
//   }, [selectedCategory, categoriesData, effectiveOrderType, effectiveAddressId, effectiveBranchId, navigate]);

//   // Manage products loading state
//   useEffect(() => {
//     if (loadingProducts) {
//       setIsProductsLoading(true);
//       setProductsData([]);
//       setFilteredProducts([]);
//     } else {
//       setIsProductsLoading(false);
//     }
//   }, [loadingProducts]);

//   // Update products data
//   useEffect(() => {
//     if (dataProducts && !loadingProducts) {
//       const prods = dataProducts.products || [];
//       setProductsData(prods);
//       setFilteredProducts(prods);
//       dispatch(setTaxType(dataProducts.tax));
//     }
//   }, [dataProducts, loadingProducts, dispatch]);

//   // Fetch all products for continuous scroll mode
//   useEffect(() => {
//     const fetchAllCategoriesProducts = async () => {
//       if (!isSingleColumn || categoriesData.length === 0 || loadingAllProducts) return;

//       setLoadingAllProducts(true);
//       const productsMap = {};

//       // Helper to build URL for a specific category
//       const getUrlForCategory = (catId) => {
//         let url = `${apiUrl}/customer/home/products_in_category/${catId}?locale=${selectedLanguage}${user ? `&user_id=${user.id}` : ""}`;
//         if (effectiveAddressId && effectiveOrderType === 'delivery') {
//           url += `&address_id=${effectiveAddressId}`;
//         } else if (effectiveBranchId && effectiveOrderType === 'take_away') {
//           url += `&branch_id=${effectiveBranchId}`;
//         }
//         return url;
//       };

//       try {
//         // Fetch products for all categories in parallel (chunking might be better for huge lists, but simple for now)
//         const privacyRequests = categoriesData.map(async (cat) => {
//           try {
//             const res = await fetch(getUrlForCategory(cat.id), {
//               headers: {
//                 // Add auth headers if needed, similar to useGet/usePost or global fetch wrapper if exists
//                 // using simple fetch here for parallel execution
//                 'Accept': 'application/json',
//                 // 'Authorization': ... (if needed)
//               }
//             });
//             const json = await res.json();
//             // Assuming API returns { products: [...] } similar to dataProducts
//             productsMap[cat.id] = json.products || [];
//           } catch (err) {
//             console.error(`Failed to fetch products for cat ${cat.id}`, err);
//           }
//         });

//         await Promise.all(privacyRequests);
//         setAllProductsByCategory(productsMap);
//       } catch (err) {
//         console.error("Error fetching all products", err);
//       } finally {
//         setLoadingAllProducts(false);
//       }
//     };

//     if (isSingleColumn) {
//       fetchAllCategoriesProducts();
//     }
//   }, [isSingleColumn, categoriesData, apiUrl, selectedLanguage, user, effectiveAddressId, effectiveOrderType, effectiveBranchId]);

//   // Scroll Spy Observer
//   useEffect(() => {
//     if (!isSingleColumn || loadingAllProducts) return;

//     const observerOptions = {
//       root: null,
//       rootMargin: '-15% 0px -85% 0px', // Restricts active area to a narrow band near the top
//       threshold: 0
//     };

//     const observerCallback = (entries) => {
//       if (isInternalScroll.current) return;

//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           const catId = parseInt(entry.target.getAttribute('data-category-id'));
//           if (catId && catId !== selectedCategory) {
//             // Update local state without triggering navigation/fetch if possible,
//             // or navigate silently? The user requested "swip to category this name".
//             // We'll update selectedCategory which highlights the button.
//             setSelectedCategory(catId);
//           }
//         }
//       });
//     };

//     const observer = new IntersectionObserver(observerCallback, observerOptions);

//     Object.values(observerRefs.current).forEach(ref => {
//       if (ref) observer.observe(ref);
//     });

//     return () => observer.disconnect();
//   }, [isSingleColumn, loadingAllProducts, categoriesData, selectedCategory]);


//   // Debounced search filtering
//   const filterProducts = useCallback(
//     debounce((query, products, subCategoryId) => {
//       let filtered = products;
//       if (subCategoryId) {
//         filtered = filtered.filter((product) => product.sub_category_id === subCategoryId);
//       }
//       if (query) {
//         filtered = filtered.filter((product) =>
//           product.name.toLowerCase().includes(query.toLowerCase())
//         );
//       }
//       setFilteredProducts(filtered);
//     }, 300),
//     []
//   );

//   // Update filtered products when products, subcategory, or search query changes
//   useEffect(() => {
//     filterProducts(searchQuery, productsData, selectedSubCategory);
//   }, [productsData, selectedSubCategory, searchQuery, filterProducts]);

//   // Refetch products when category changes
//   useEffect(() => {
//     if (selectedCategory) {
//       setProductsData([]);
//       setFilteredProducts([]);
//       setSelectedSubCategory(null);
//       setSearchQuery('');

//       refetchProducts();
//     }
//   }, [selectedCategory, refetchProducts]);

//   // Scroll active category button into view
//   useEffect(() => {
//     if (selectedCategory && categoryButtonRefs.current[selectedCategory]) {
//       categoryButtonRefs.current[selectedCategory].scrollIntoView({
//         behavior: 'smooth',
//         block: 'nearest',
//         inline: 'center'
//       });
//     }
//   }, [selectedCategory]);

//   // RTL-aware scroll functions for categories
//   const scrollLeft = () => {
//     if (scrollContainerRef.current) {
//       const scrollAmount = isRTL ? 300 : -300;
//       scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
//     }
//   };

//   const scrollRight = () => {
//     if (scrollContainerRef.current) {
//       const scrollAmount = isRTL ? -300 : 300;
//       scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
//     }
//   };

//   // Handle category click
//   const handleCategoryClick = useCallback(
//     (categoryId) => {
//       setProductsData([]);
//       setFilteredProducts([]);
//       setSelectedSubCategory(null);
//       setSearchQuery('');

//       setSelectedCategory(categoryId);
//       const query = new URLSearchParams();
//       if (effectiveOrderType === 'delivery' && effectiveAddressId) {
//         query.set('address_id', effectiveAddressId);
//         query.set('order_type', 'delivery');
//       } else if (effectiveOrderType === 'take_away' && effectiveBranchId) {
//         query.set('branch_id', effectiveBranchId);
//         query.set('order_type', 'take_away');
//       }
//       navigate(`/products/${categoryId}?${query.toString()}`);

//       if (isSingleColumn) {
//         // Scroll to section
//         const sectionRef = observerRefs.current[categoryId];
//         if (sectionRef) {
//           isInternalScroll.current = true;
//           // Accounts for fixed header ~200px or so
//           const headerOffset = 180;
//           const elementPosition = sectionRef.getBoundingClientRect().top;
//           const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

//           window.scrollTo({
//             top: offsetPosition,
//             behavior: "smooth"
//           });

//           setTimeout(() => {
//             isInternalScroll.current = false;
//           }, 1000);
//         }
//       } else {
//         window.scrollTo(0, 0);
//       }
//     },
//     [navigate, effectiveAddressId, effectiveBranchId, effectiveOrderType, isSingleColumn]
//   );

//   // Handle subcategory click
//   const handleSubCategoryClick = useCallback((subCategoryId) => {
//     setSelectedSubCategory(subCategoryId);
//   }, []);

//   // Handle search input change
//   const handleSearchChange = (e) => {
//     setSearchQuery(e.target.value);
//   };

//   // Clear search input
//   const handleClearSearch = () => {
//     setSearchQuery('');
//   };

//   const currentCategory = categoriesData.find((cat) => cat.id === selectedCategory);
//   const subCategories = currentCategory?.sub_categories || [];

//   // Show loading only if we're actively loading categories and no categories exist yet
//   if (loadingCategories && categoriesData.length === 0) {
//     return (
//       <div className="flex justify-center items-center py-12">
//         <StaticSpinner />
//       </div>
//     );
//   }

//   return (
//     <div
//       className="w-full min-h-screen bg-gray-50"
//       dir={isRTL ? 'rtl' : 'ltr'}
//     >
//       {/* Categories Navigation */}
//       <div className={`${isSingleColumn ? 'fixed top-0 left-0 right-0 z-50' : 'sticky top-0 z-20'} bg-white shadow-md py-4 px-4`}>
//         <div className="w-full relative">
//           <div className={`flex items-center justify-between mb-4`}>
//             <h2 className={`text-xl font-bold text-mainColor ${isRTL ? 'text-right' : 'text-left'}`}>
//               {t('categories')}
//             </h2>
//             {categoriesData.length > 1 && (
//               <div className={`flex ${isRTL ? 'space-x-reverse' : 'space-x-2'} space-x-2`}>
//                 <button
//                   onClick={scrollLeft}
//                   className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
//                   aria-label={isRTL ? t('scrollRight') : t('scrollLeft')}
//                 >
//                   <ChevronLeft className={`h-5 w-5 text-gray-700 transform ${isRTL ? 'rotate-180' : ''}`} />
//                 </button>
//                 <button
//                   onClick={scrollRight}
//                   className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
//                   aria-label={isRTL ? t('scrollLeft') : t('scrollRight')}
//                 >
//                   <ChevronRight className={`h-5 w-5 text-gray-700 transform ${isRTL ? 'rotate-180' : ''}`} />
//                 </button>
//               </div>
//             )}
//           </div>

//           {categoriesData.length > 0 ? (
//             <div
//               ref={scrollContainerRef}
//               className="flex overflow-x-auto scrollbar-hide pb-2"
//               style={{
//                 scrollbarWidth: 'none',
//                 msOverflowStyle: 'none',
//                 [isRTL ? 'paddingRight' : 'paddingLeft']: '0',
//                 [isRTL ? 'paddingLeft' : 'paddingRight']: '0'
//               }}
//             >
//               <div className={`flex ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-3`}>
//                 {categoriesData.map((category) => (
//                   <button
//                     key={category.id}
//                     ref={el => categoryButtonRefs.current[category.id] = el}
//                     onClick={() => handleCategoryClick(category.id)}
//                     className={`flex-shrink-0 px-4 py-2 rounded-full text-lg font-medium transition-colors ${selectedCategory === category.id
//                       ? 'bg-mainColor text-whiteColor'
//                       : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
//                       }`}
//                   >
//                     {category.name}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           ) : (
//             <div className="text-center py-4">
//               <p className="text-gray-500">{t('noCategoriesAvailable')}</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Spacer for fixed header */}
//       {isSingleColumn && <div className="h-[80px] md:h-[60px]" />}

//       {/* Location Warning Banner */}
//       {(!effectiveAddressId && !effectiveBranchId) && (
//         <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
//           <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
//             <div className="flex-shrink-0">
//               <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//               </svg>
//             </div>
//             <div className={isRTL ? 'mr-3' : 'ml-3'}>
//               <p className={`text-sm text-yellow-700 ${isRTL ? 'text-right' : 'text-left'}`}>
//                 <strong>{t('note')}:</strong> {t('locationWarningMessage')}
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Subcategories */}
//       {subCategories.length > 0 && (
//         <div className="bg-white py-3 px-4 border-b">
//           <div className="max-w-7xl mx-auto">
//             <h3 className={`text-md font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
//               {t('subcategories')}
//             </h3>
//             <div className="flex overflow-x-auto scrollbar-hide">
//               <div className={`flex ${isRTL ? 'space-x-reverse' : 'space-x-2'} space-x-2`}>
//                 <button
//                   onClick={() => setSelectedSubCategory(null)}
//                   className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${selectedSubCategory === null
//                     ? 'bg-mainColor text-whiteColor'
//                     : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
//                     }`}
//                 >
//                   {t('all')}
//                 </button>
//                 {subCategories.map((subCategory) => (
//                   <button
//                     key={subCategory.id}
//                     onClick={() => handleSubCategoryClick(subCategory.id)}
//                     className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${selectedSubCategory === subCategory.id
//                       ? 'bg-mainColor text-whiteColor'
//                       : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
//                       }`}
//                   >
//                     {subCategory.name}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Products Grid */}
//       <div className="w-full p-4">
//         {/* Search Input */}
//         <div className={`relative mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
//           <div className="w-full md:w-3/6 xl:w-2/6">
//             <div className="relative flex-grow">
//               <input
//                 type="text"
//                 value={searchQuery}
//                 onChange={handleSearchChange}
//                 placeholder={t('searchProductsPlaceholder')}
//                 className={`w-full py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-mainColor focus:border-mainColor transition-all duration-300 bg-white shadow-sm placeholder-gray-400 text-gray-800 ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'
//                   }`}
//               />
//               <Search className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'
//                 }`} />
//               {searchQuery && (
//                 <button
//                   onClick={handleClearSearch}
//                   className={`absolute top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors ${isRTL ? 'left-3' : 'right-3'
//                     }`}
//                 >
//                   <X className="h-5 w-5 text-gray-400" />
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>

//         {(!isSingleColumn) && (isProductsLoading ? (
//           <div className="flex justify-center items-center py-12">
//             <StaticSpinner />
//           </div>
//         ) : filteredProducts.length > 0 ? (
//           <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`}>
//             {filteredProducts.map((product) => (
//               <ProductCard
//                 key={product.id}
//                 product={product}
//                 isFavorite={product.favourite}
//                 language={selectedLanguage}
//               />
//             ))}
//           </div>
//         ) : (
//           <div className={`text-center py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
//             <p className="text-gray-500 text-lg">
//               {searchQuery
//                 ? t('noProductsMatchSearch')
//                 : selectedCategory && productsData.length === 0
//                   ? t('noProductsInCategory')
//                   : t('selectCategoryToViewProducts')
//               }
//             </p>
//             {selectedCategory && (!effectiveAddressId && !effectiveBranchId) && (
//               <p className="text-gray-400 text-sm mt-2">
//                 {t('productsAvailableWithLocation')}
//               </p>
//             )}
//           </div>
//         ))}

//         {/* Continuous Scroll Layout */}
//         {isSingleColumn && !loadingAllProducts && categoriesData.map(category => {
//           const catProducts = allProductsByCategory[category.id] || [];
//           // Apply search filter if exists
//           const displayProducts = searchQuery
//             ? catProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
//             : catProducts;

//           if (displayProducts.length === 0) return null;

//           return (
//             <div
//               key={category.id}
//               ref={el => observerRefs.current[category.id] = el}
//               data-category-id={category.id}
//               className="mb-8"
//             >
//               <h3 className={`text-xl font-bold mb-4 px-2 text-gray-800 ${isRTL ? 'text-right' : 'text-left'}`}>
//                 {category.name}
//               </h3>
//               <div className="grid grid-cols-1 gap-4">
//                 {displayProducts.map(product => (
//                   <ProductCard
//                     key={product.id}
//                     product={product}
//                     isFavorite={product.favourite}
//                     language={selectedLanguage}
//                   />
//                 ))}
//               </div>
//             </div>
//           );
//         })}

//         {isSingleColumn && loadingAllProducts && (
//           <div className="flex justify-center items-center py-12">
//             <StaticSpinner />
//           </div>
//         )}
//       </div>

//       <style jsx>{`
//         .scrollbar-hide::-webkit-scrollbar {
//           display: none;
//         }
//       `}</style>
//     </div >
//   );
// };

// export default Products;