import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { setCategories, setRestaurantStatus } from '../../Store/Slices/CategoriesSlice';
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
  const mainData = useSelector((state) => state.mainData?.data);
  const isContinuous = mainData?.continues_status === 1;

  const orderType = useSelector((state) => state.orderType?.orderType);
  const selectedAddressId = useSelector((state) => state.orderType?.selectedAddressId);
  const selectedBranchId = useSelector((state) => state.orderType?.selectedBranchId);

  const [categoriesData, setCategoriesData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [groupedProducts, setGroupedProducts] = useState({}); // For continuous scroll

  const [selectedCategory, setSelectedCategory] = useState(id ? parseInt(id) : null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const scrollContainerRef = useRef(null);
  const categoryRefs = useRef({});
  const isClickScrolling = useRef(false);
  const clickScrollTimeout = useRef(null);

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

  // Build API URLs
  const buildCategoriesUrl = useCallback(() => {
    let url = `${apiUrl}/customer/home/categories?locale=${selectedLanguage}`;
    if (effectiveAddressId && effectiveOrderType === 'delivery') {
      url += `&address_id=${effectiveAddressId}`;
    } else if (effectiveBranchId && effectiveOrderType === 'take_away') {
      url += `&branch_id=${effectiveBranchId}`;
    }
    return url;
  }, [apiUrl, selectedLanguage, effectiveAddressId, effectiveBranchId, effectiveOrderType]);

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

  const buildWebProductsUrl = useCallback(() => {
    let url = `${apiUrl}/customer/home/web_products?locale=${selectedLanguage}${user ? `&user_id=${user.id}` : ""}`;
    if (effectiveAddressId && effectiveOrderType === 'delivery') {
      url += `&address_id=${effectiveAddressId}`;
    } else if (effectiveBranchId && effectiveOrderType === 'take_away') {
      url += `&branch_id=${effectiveBranchId}`;
    }
    return url;
  }, [apiUrl, selectedLanguage, effectiveAddressId, effectiveBranchId, effectiveOrderType, user]);

  // Fetch standard data
  const { refetch: refetchCategories, loading: loadingCategories, data: dataCategories } = useGet({
    url: !isContinuous ? buildCategoriesUrl() : null,
  });

  const { refetch: refetchProducts, loading: loadingProducts, data: dataProducts } = useGet({
    url: !isContinuous ? buildProductsUrl() : null,
  });

  // Fetch continuous data
  const { refetch: refetchWebProducts, loading: loadingWebProducts, data: dataWebProducts } = useGet({
    url: isContinuous ? buildWebProductsUrl() : null,
  });

  // Refetch when language or location changes
  useEffect(() => {
    if (isContinuous) refetchWebProducts();
    else refetchCategories();
  }, [selectedLanguage, effectiveAddressId, effectiveBranchId, effectiveOrderType, refetchCategories, refetchWebProducts, isContinuous]);

  // Handle standard categories data
  useEffect(() => {
    if (!isContinuous && dataCategories && !loadingCategories) {
      setCategoriesData(dataCategories.categories || []);
      dispatch(setRestaurantStatus({ open: dataCategories.open ?? true, closeMessage: dataCategories.close_message || '' }));

      // if ((dataCategories.open === false || dataCategories.open === 0) && dataCategories.close_message) {
      //   auth.toastError(`${t('restaurantIsClosedNow')} \n ${dataCategories.close_message}`);
      // }

      if (id && !selectedCategory) {
        setSelectedCategory(parseInt(id));
      }
    }
  }, [isContinuous, dataCategories, loadingCategories, id, selectedCategory, dispatch, auth, t]);

  // Auto-select first category if none selected (Standard mode)
  useEffect(() => {
    if (!isContinuous && !selectedCategory && categoriesData.length > 0) {
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
  }, [isContinuous, selectedCategory, categoriesData, effectiveOrderType, effectiveAddressId, effectiveBranchId, navigate]);

  // Handle continuous web products data
  useEffect(() => {
    if (isContinuous && dataWebProducts && !loadingWebProducts) {
      setCategoriesData(dataWebProducts.categories || []);

      const prods = dataWebProducts.products || [];
      setProductsData(prods);
      setFilteredProducts(prods);

      const grouped = prods.reduce((acc, p) => {
        if (!acc[p.category_id]) acc[p.category_id] = [];
        acc[p.category_id].push(p);
        return acc;
      }, {});
      setGroupedProducts(grouped);

      if (dataWebProducts.categories?.length > 0 && !selectedCategory) {
        setSelectedCategory(dataWebProducts.categories[0].id);
      }

      if (dataWebProducts.tax) dispatch(setTaxType(dataWebProducts.tax));
    }
  }, [isContinuous, dataWebProducts, loadingWebProducts, dispatch, selectedCategory]);

  // Intersection Observer for Continuous Scroll
  useEffect(() => {
    if (!isContinuous || categoriesData.length === 0 || searchQuery) return;

    const observerOptions = {
      root: null, // Note: IntersectionObserver with root: null uses viewport, which is fine as the scroll container fills the screen.
      rootMargin: '-200px 0px -60% 0px',
      threshold: 0
    };

    const observerCallback = (entries) => {
      if (isClickScrolling.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const categoryId = parseInt(entry.target.getAttribute('data-category-id'));
          setSelectedCategory(categoryId);

          const navButton = document.getElementById(`nav-category-${categoryId}`);
          if (navButton && scrollContainerRef.current) {
            navButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    Object.values(categoryRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [isContinuous, categoriesData, searchQuery]);

  // Manage products loading state (Standard mode)
  useEffect(() => {
    if (!isContinuous) {
      if (loadingProducts) {
        setIsProductsLoading(true);
        setProductsData([]);
        setFilteredProducts([]);
      } else {
        setIsProductsLoading(false);
      }
    } else {
      setIsProductsLoading(loadingWebProducts);
    }
  }, [loadingProducts, loadingWebProducts, isContinuous]);

  // Update standard products data
  useEffect(() => {
    if (!isContinuous && dataProducts && !loadingProducts) {
      const prods = dataProducts.products || [];
      setProductsData(prods);
      setFilteredProducts(prods);
      dispatch(setTaxType(dataProducts.tax));
    }
  }, [isContinuous, dataProducts, loadingProducts, dispatch]);

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

      // Update grouped products if continuous
      if (isContinuous) {
        const grouped = filtered.reduce((acc, p) => {
          if (!acc[p.category_id]) acc[p.category_id] = [];
          acc[p.category_id].push(p);
          return acc;
        }, {});
        setGroupedProducts(grouped);
      }
    }, 300),
    [isContinuous]
  );

  useEffect(() => {
    filterProducts(searchQuery, productsData, selectedSubCategory);
  }, [productsData, selectedSubCategory, searchQuery, filterProducts]);

  // Refetch standard products when category changes
  useEffect(() => {
    if (!isContinuous && selectedCategory) {
      setProductsData([]);
      setFilteredProducts([]);
      setSelectedSubCategory(null);
      setSearchQuery('');
      refetchProducts();
    }
  }, [isContinuous, selectedCategory, refetchProducts]);

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

  const handleCategoryClick = useCallback(
    (categoryId) => {
      setSelectedCategory(categoryId);
      if (isContinuous) {
        isClickScrolling.current = true;
        if (clickScrollTimeout.current) clearTimeout(clickScrollTimeout.current);
        clickScrollTimeout.current = setTimeout(() => {
          isClickScrolling.current = false;
        }, 1000); // Wait 1s for scroll to finish

        const targetRef = categoryRefs.current[categoryId];
        if (targetRef) {
          // Find the app's scrolling container (from App.jsx)
          const scrollContainer = targetRef.closest('.overflow-y-scroll') || window;

          // Get the exact bottom pixel of the sticky category header
          const catHeader = document.querySelector('.sticky.top-0.z-20');
          const headerBottom = catHeader ? catHeader.getBoundingClientRect().bottom : 150;

          // Calculate the exact distance to scroll so the section is right below the header
          const targetTop = targetRef.getBoundingClientRect().top;
          const delta = targetTop - headerBottom;

          const currentScroll = scrollContainer !== window ? scrollContainer.scrollTop : window.scrollY;
          const scrollToY = currentScroll + delta;

          scrollContainer.scrollTo({
            top: scrollToY,
            behavior: 'smooth'
          });
        }
      } else {
        setProductsData([]);
        setFilteredProducts([]);
        setSelectedSubCategory(null);
        setSearchQuery('');

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
      }
    },
    [navigate, effectiveAddressId, effectiveBranchId, effectiveOrderType, isContinuous]
  );

  const handleSubCategoryClick = useCallback((subCategoryId) => {
    setSelectedSubCategory(subCategoryId);
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const currentCategory = categoriesData.find((cat) => cat.id === selectedCategory);
  const subCategories = currentCategory?.sub_categories || [];

  if ((!isContinuous && loadingCategories && categoriesData.length === 0) || (isContinuous && loadingWebProducts && categoriesData.length === 0)) {
    return (
      <div className="flex justify-center items-center py-12">
        <StaticSpinner />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Categories Navigation */}
      <div className="sticky top-0 z-20 bg-white shadow-md py-5  md:py-8 px-4 ">
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
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className={`flex ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-3`}>
                {categoriesData.map((category) => (
                  <button
                    key={category.id}
                    id={`nav-category-${category.id}`}
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

      {/* Subcategories (Only in standard mode for now, or if it works globally) */}
      {!isContinuous && subCategories.length > 0 && (
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

      {/* Products Area */}
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
                className={`w-full py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-mainColor focus:border-mainColor transition-all duration-300 bg-white shadow-sm placeholder-gray-400 text-gray-800 ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}`}
              />
              <Search className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className={`absolute top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors ${isRTL ? 'left-3' : 'right-3'}`}
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
        ) : (
          isContinuous ? (
            // Continuous Scroll Rendering
            <div className="flex flex-col gap-8">
              {categoriesData.map(category => {
                const catProducts = groupedProducts[category.id] || [];
                if (catProducts.length === 0) return null;

                return (
                  <div
                    key={category.id}
                    ref={(el) => (categoryRefs.current[category.id] = el)}
                    data-category-id={category.id}
                    className="pt-4 scroll-mt-44"
                  >
                    <h2 className={`text-2xl font-bold text-gray-800 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {category.name}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {catProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          isFavorite={product.favourite}
                          language={selectedLanguage}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className={`text-center py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-gray-500 text-lg">{t('noProductsMatchSearch')}</p>
                </div>
              )}
            </div>
          ) : (
            // Standard Rendering
            filteredProducts.length > 0 ? (
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
            )
          )
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Products;
