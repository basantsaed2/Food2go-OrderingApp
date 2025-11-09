import React, { useEffect, useState } from 'react';
import StaticSpinner from '../../Components/Spinners/StaticSpinner';
import { useGet } from '../../Hooks/useGet';
import { useSelector, useDispatch } from 'react-redux';
import { removeFavorite } from '../../Store/Slices/favoritesSlice'; // Import action
import ProductCard from '../../Components/ProductCard';
import { useTranslation } from 'react-i18next';

const FavoriteProducts = () => {
  const { t } = useTranslation();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');
  const token = useSelector(state => state?.user?.data?.token || '');
  const dispatch = useDispatch();

  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [error, setError] = useState(null);

  const {
    refetch: refetchFavorites,
    loading: apiLoading,
    data: dataFavorites,
    error: apiError
  } = useGet({
    url: `${apiUrl}/customer/home/fav_products?locale=${selectedLanguage}`,
  });

  // Refetch when language changes
  useEffect(() => {
    if (token) { // Only fetch if user is logged in
      refetchFavorites();
    }
  }, [selectedLanguage, refetchFavorites, token]);

  // Update favorites data
  useEffect(() => {
    setLoadingFavorites(apiLoading);
    if (apiError) {
      setError('Failed to load favorites. Please try again.');
      console.error('Favorites API error:', apiError);
    } else if (dataFavorites && dataFavorites.products) {
      setFavorites(dataFavorites.products);
      setError(null);
    } else if (!token) {
      setFavorites([]);
      setError(null);
    }
  }, [dataFavorites, apiLoading, apiError, token]);

  // Handle favorite toggle (remove from favorites list)
  const handleFavoriteToggle = async (product, newFavoriteState) => {
    if (!newFavoriteState) {
      // Remove from local state immediately
      setFavorites(prev => prev.filter(p => p.id !== product.id));
      
      // Remove from Redux state
      dispatch(removeFavorite(product.id));

      // Refetch from API to sync state
      await refetchFavorites();
    }
  };

  if (loadingFavorites) {
    return (
      <div className="flex items-center justify-center py-12">
        <StaticSpinner />
      </div>
    );
  }

  if (error && !token) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-gray-500">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">{t("Nofavorites")}</h3>
        <p className="mb-4 text-gray-500">{t("Pleaselogintoseeyourfavoriteproducts")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-red-500">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">{t("Somethingwentwrong")}</h3>
        <p className="mb-4 text-gray-500">{error}</p>
        <button
          onClick={() => refetchFavorites()}
          className="px-4 py-2 text-white transition-colors rounded-lg bg-mainColor hover:bg-mainColor/90"
        >
          {t("TryAgain")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen py-6 bg-gray-50">
      <div className="px-4 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-mainColor">{t('MyFavorites')}</h1>
          <p className="text-gray-600">
            {favorites.length > 0
              ? `${favorites.length} ${favorites.length === 1 ? t('item') : t('items')} ${t('inYourFavorites')}`
              : t('noFavoritesMessage')
            }
          </p>
        </div>

        {/* Products Grid */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={true}
                onFavoriteToggle={handleFavoriteToggle}
                language={selectedLanguage}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">{t("Nofavoritesyet")}</h3>
            <p className="mb-6 text-gray-500">{t('Startaddingitemsyoulovetoyourfavoriteslist')}</p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 text-white transition-colors rounded-lg bg-mainColor hover:bg-mainColor/90"
            >
              {t("BrowseProducts")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoriteProducts;