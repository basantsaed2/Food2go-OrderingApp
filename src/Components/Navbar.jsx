import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ShoppingCart, Heart, User, Phone, MapPin, Globe, Star, ChefHat, LogOut, Settings, Package } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setLanguage, setLanguages } from '../Store/Slices/languageSlice';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import mainLogo from '../assets/Images/mainLogo.jpeg'
import { useAuth } from '../Context/Auth';

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const user = useSelector(state => state.user?.data?.user);
    const mainData = useSelector(state => state.mainData?.data);
    const cart = useSelector(state => state.cart);
    const languages = useSelector(state => state.language?.data || []);
    const selectedLanguage = useSelector(state => state.language?.selected || 'en');
    const [pages] = useState(['/login', '/signup']);
    const auth = useAuth();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // SEPARATE STATES FOR DESKTOP AND MOBILE LANGUAGE DROPDOWNS
    const [isDesktopLanguageDropdownOpen, setIsDesktopLanguageDropdownOpen] = useState(false);
    const [isMobileLanguageDropdownOpen, setIsMobileLanguageDropdownOpen] = useState(false);

    // Refs for click outside detection
    const profileDropdownRef = useRef(null);
    const desktopLanguageDropdownRef = useRef(null);
    const mobileLanguageDropdownRef = useRef(null);

    // Calculate real cart count
    const cartCount = cart?.itemCount || 0;

    // Check if current language is RTL
    const isRTL = selectedLanguage === 'ar';

    // Sync login state with user data
    useEffect(() => {
        setIsLoggedIn(!!user?.token);
    }, [user?.token]);

    // Click outside handler for dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
            if (desktopLanguageDropdownRef.current && !desktopLanguageDropdownRef.current.contains(event.target)) {
                setIsDesktopLanguageDropdownOpen(false);
            }
            if (mobileLanguageDropdownRef.current && !mobileLanguageDropdownRef.current.contains(event.target)) {
                setIsMobileLanguageDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Find current language object from languages array
    const currentLanguageName = selectedLanguage.toUpperCase();

    const menuItems = [
        {
            icon: MapPin,
            i18nKey: 'branches',
            path: '/branches'
        },
        {
            icon: ChefHat,
            i18nKey: 'menu',
            path: '/menu'
        },
        {
            icon: ShoppingCart,
            i18nKey: 'orderOnline',
            path: '/order_online'
        },
    ];

    const handleLanguageChange = (newLangCode) => {
        dispatch(setLanguage(newLangCode));
        // Close both dropdowns when language is changed
        setIsDesktopLanguageDropdownOpen(false);
        setIsMobileLanguageDropdownOpen(false);
    };

    // Handle navigation
    const handleNavigation = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
        setIsProfileDropdownOpen(false);
    };

    // Handle login/logout
    const handleLogin = () => {
        navigate('/login');
        setIsMobileMenuOpen(false);
    };

    const handleLogout = () => {
        auth.logout();
        navigate('/');
        setIsMobileMenuOpen(false);
        setIsProfileDropdownOpen(false);
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
        // Close language dropdowns when opening profile dropdown
        setIsDesktopLanguageDropdownOpen(false);
        setIsMobileLanguageDropdownOpen(false);
    };

    // SEPARATE TOGGLE FUNCTIONS FOR DESKTOP AND MOBILE
    const toggleDesktopLanguageDropdown = () => {
        setIsDesktopLanguageDropdownOpen(!isDesktopLanguageDropdownOpen);
        if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
        // Close mobile language dropdown when opening desktop one
        setIsMobileLanguageDropdownOpen(false);
    };

    const toggleMobileLanguageDropdown = () => {
        setIsMobileLanguageDropdownOpen(!isMobileLanguageDropdownOpen);
        if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
        // Close desktop language dropdown when opening mobile one
        setIsDesktopLanguageDropdownOpen(false);
    };

    // Function to render logo with name
    const renderLogo = () => {
        return (
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-3`}>
                <div className="flex items-center justify-center bg-white rounded-full shadow-md">
                    {mainData?.logo_link ? (
                        <img
                            src={mainData.logo_link}
                            alt={mainData?.name || "Logo"}
                            className="object-contain w-8 h-8 rounded-full sm:h-10 sm:w-10"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <ChefHat
                        className="w-8 h-8 sm:h-10 sm:w-10"
                        style={{
                            color: 'var(--color-main)',
                            display: mainData?.logo_link ? 'none' : 'flex'
                        }}
                    />
                </div>
                <span className="text-xl font-bold text-whiteColor lg:text-2xl">
                    {selectedLanguage === "en" ? mainData?.name : mainData?.ar_name || t('brandName')}
                </span>
            </div>
        );
    };

    // Function to render user profile image
    const renderUserProfile = () => {
        if (!isLoggedIn) return null;

        return (
            <div className="relative">
                {user?.profile_image ? (
                    <img
                        src={user.profile_image}
                        alt={user.f_name}
                        className="object-cover w-8 h-8 border-2 border-white rounded-full sm:w-10 sm:h-10"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                <div
                    className="flex items-center justify-center w-8 h-8 bg-white border-2 border-white rounded-full sm:w-10 sm:h-10"
                    style={{ display: user?.profile_image ? 'none' : 'flex' }}
                >
                    <User
                        className="w-5 h-5 sm:h-6 sm:w-6"
                        style={{ color: 'var(--color-main)' }}
                    />
                </div>

                {/* Online indicator */}
                <div className="absolute w-3 h-3 bg-green-500 border-2 border-white rounded-full -bottom-1 -right-1"></div>
            </div>
        );
    };

    // Enhanced dropdown component with RTL support
    const ProfileDropdown = () => (
        <div
            ref={profileDropdownRef}
            className={`absolute top-full ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-60 transition-all duration-200 ${isProfileDropdownOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2 pointer-events-none'
                }`}
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-right text-gray-900 truncate">
                    {user?.name || t('user')}
                </p>
                <p className="text-sm text-right text-gray-500 truncate">
                    {user?.email || 'user@example.com'}
                </p>
            </div>

            <Link
                to="/profile"
                className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors group`}
                onClick={() => handleNavigation('/profile')}
            >
                <div className="flex items-center justify-center w-8 h-8 transition-colors rounded-lg group-hover:bg-opacity-20">
                    <User className="w-4 h-4" style={{ color: 'var(--color-main)' }} />
                </div>
                <span className="flex-1 font-medium text-right">{t('myProfile')}</span>
            </Link>

            <Link
                to="/orders"
                className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors group`}
                onClick={() => handleNavigation('/orders')}
            >
                <div className="flex items-center justify-center w-8 h-8 transition-colors rounded-lg group-hover:bg-opacity-20">
                    <Package className="w-4 h-4" style={{ color: 'var(--color-main)' }} />
                </div>
                <span className="flex-1 font-medium text-right">{t('myOrders')}</span>
            </Link>

            <div className="pt-2 mt-2 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors group`}
                >
                    <div className="flex items-center justify-center w-8 h-8 transition-colors rounded-lg group-hover:bg-opacity-20">
                        <LogOut className="w-4 h-4" style={{ color: 'var(--color-main)' }} />
                    </div>
                    <span className="flex-1 font-medium text-right">{t('logout')}</span>
                </button>
            </div>
        </div>
    );

    // SEPARATE LANGUAGE DROPDOWN COMPONENTS FOR DESKTOP AND MOBILE
    const DesktopLanguageDropdown = () => (
        <div
            ref={desktopLanguageDropdownRef}
            className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-2 w-32 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-60 transition-all duration-200 ${isDesktopLanguageDropdownOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2 pointer-events-none'
                }`}
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
            {languages.map((lang) => (
                <button
                    key={lang.name}
                    onClick={() => handleLanguageChange(lang.name)}
                    className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-1 w-full px-8 py-2 transition-colors ${selectedLanguage === lang.name
                        ? 'bg-gray-100'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    style={selectedLanguage === lang.name ? { color: 'var(--color-main)' } : {}}
                >
                    <span className="text-lg">{lang.flag || '🌐'}</span>
                    <span className="flex-1 font-medium text-right">{lang.name.toUpperCase()}</span>
                </button>
            ))}
        </div>
    );

    const MobileLanguageDropdown = () => (
        <div
            ref={mobileLanguageDropdownRef}
            className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-2 w-32 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-60 transition-all duration-200 ${isMobileLanguageDropdownOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2 pointer-events-none'
                }`}
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
            {languages.map((lang) => (
                <button
                    key={lang.name}
                    onClick={() => handleLanguageChange(lang.name)}
                    className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-3 w-full px-8 py-2 transition-colors ${selectedLanguage === lang.name
                        ? 'bg-gray-100'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    style={selectedLanguage === lang.name ? { color: 'var(--color-main)' } : {}}
                >
                    <span className="text-lg">{lang.flag || '🌐'}</span>
                    <span className="flex-1 font-medium text-right">{lang.name.toUpperCase()}</span>
                </button>
            ))}
        </div>
    );

    return (
        <>
            {pages.some(page => location.pathname === page) ? (
                ''
            ) : (
                <nav
                    className="relative z-40 shadow-lg"
                    style={{ backgroundColor: 'var(--color-main)' }}
                    dir={isRTL ? 'rtl' : 'ltr'}
                >
                    <div className="px-4 mx-auto max-w-7xl md:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16 lg:h-20">
                            {/* Logo with Name */}
                            <Link to="/" className="flex-shrink-0 transition-opacity hover:opacity-90">
                                {renderLogo()}
                            </Link>

                            {/* Desktop Navigation */}
                            <div className={`hidden xl:flex xl:items-center xl:${isRTL ? 'space-x-4' : 'space-x-reverse'} space-x-4`}>
                                {menuItems.map((item, index) => (
                                    <Link
                                        key={index}
                                        to={item.path}
                                        className={`text-whiteColor hover:text-gray-200 transition-all duration-200 font-medium flex items-center ${isRTL ? 'space-x-4' : 'space-x-reverse'} space-x-4 group relative`}
                                    >
                                        <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                                        <span className={isRTL ? 'mr-1' : 'ml-1'}>{t(item.i18nKey)}</span>
                                    </Link>
                                ))}
                            </div>

                            {/* Desktop Right Side Icons */}
                            <div className={`hidden xl:flex xl:items-center ${isRTL ? 'space-x-reverse' : 'space-x-6'} space-x-6`}>
                                {/* Favorites */}
                                {user && (
                                    <>
                                        <Link
                                            to="/favorite_product"
                                            className="relative p-2 text-whiteColor transition-colors hover:text-gray-200 group"
                                        >
                                            <Heart className="w-6 h-6 transition-transform group-hover:scale-110" />
                                        </Link>

                                        {/* Cart */}
                                        <Link
                                            to="/cart"
                                            className="relative p-2 text-whiteColor transition-colors hover:text-gray-200 group"
                                        >
                                            <ShoppingCart className="w-6 h-6 transition-transform group-hover:scale-110" />
                                            {cartCount > 0 && (
                                                <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} bg-red-500 text-whiteColor text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold`}>
                                                    {cartCount}
                                                </span>
                                            )}
                                        </Link>
                                    </>
                                )}

                                {/* Language Toggle - Desktop */}
                                <div className="relative" ref={desktopLanguageDropdownRef}>
                                    <button
                                        onClick={toggleDesktopLanguageDropdown}
                                        className={`text-whiteColor hover:text-gray-200 transition-colors flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-2'} space-x-2 bg-white bg-opacity-20 rounded-full px-4 py-2 group`}
                                    >
                                        <Globe className="w-4 h-4" />
                                        <span className="font-medium">{currentLanguageName}</span>
                                    </button>
                                    <DesktopLanguageDropdown />
                                </div>

                                {/* Profile/Login */}
                                {isLoggedIn ? (
                                    <div className="relative" ref={profileDropdownRef}>
                                        <button
                                            onClick={toggleProfileDropdown}
                                            className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-3 text-whiteColor hover:text-gray-200 transition-colors group p-1 rounded-lg`}
                                        >
                                            {renderUserProfile()}
                                            <span className="hidden font-medium lg:block">
                                                {user?.name || t('profile')}
                                            </span>
                                            <div className={`transform transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>
                                        <ProfileDropdown />
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleLogin}
                                        className="px-6 py-2 font-medium text-whiteColor transition-all duration-200 bg-white border border-white rounded-full bg-opacity-20 hover:bg-opacity-30 border-opacity-30"
                                        style={{ color: 'var(--color-main)' }}
                                    >
                                        <span style={{ color: 'white' }}>{t('login')}</span>
                                    </button>
                                )}
                            </div>

                            {/* Mobile Menu Button Area */}
                            <div className={`xl:hidden flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-4'} space-x-4`}>
                                {/* Cart Icon */}
                                {user && (
                                    <Link to="/cart" className="relative p-2 text-whiteColor">
                                        <ShoppingCart className="w-5 h-5" />
                                        {cartCount > 0 && (
                                            <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} bg-red-500 text-whiteColor text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold`}>
                                                {cartCount}
                                            </span>
                                        )}
                                    </Link>
                                )}

                                {/* Mobile Language Toggle */}
                                <div className="relative" ref={mobileLanguageDropdownRef}>
                                    <button
                                        onClick={toggleMobileLanguageDropdown}
                                        className={`text-whiteColor hover:text-gray-200 transition-colors flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-2'} space-x-2 bg-white bg-opacity-20 rounded-full px-4 py-2 group`}
                                    >
                                        <Globe className="w-4 h-4" />
                                        <span className="font-medium">{currentLanguageName}</span>
                                    </button>
                                    <MobileLanguageDropdown />
                                </div>

                                {/* Mobile Menu Button */}
                                <button
                                    onClick={toggleMobileMenu}
                                    className="p-2 text-whiteColor transition-colors bg-white rounded-lg hover:text-gray-200 bg-opacity-10"
                                >
                                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
            )}

            {/* Enhanced Mobile Sidebar - Starts after navbar */}
            {pages.some(page => location.pathname === page) ? (
                ''
            ) : (
                <div
                    className={`fixed inset-0 z-50 xl:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                    style={{ top: '4rem' }}
                    dir={isRTL ? 'rtl' : 'ltr'}
                >
                    {/* Backdrop */}
                    <div
                        className={`absolute inset-0 bg-black transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-50' : 'opacity-0'
                            }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Sidebar */}
                    <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-80 max-w-full bg-white shadow-2xl transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
                        }`}>
                        <div className="flex flex-col h-full">
                            {/* Scrollable Content - Starts immediately without header */}
                            <div className="flex-1 overflow-y-auto scrollPage">
                                {/* Profile Section */}
                                <div className="p-6 border-b border-gray-100">
                                    {isLoggedIn ? (
                                        <div className="flex items-center">
                                            {renderUserProfile()}
                                            <button onClick={() => navigate('/profile')} className="flex-1 min-w-0 mr-3">
                                                <p className="font-semibold text-right text-gray-900 truncate">
                                                    {user?.name || t('user')}
                                                </p>
                                                <p className="text-sm text-right text-gray-600 truncate">
                                                    {user?.email || t('manageAccount')}
                                                </p>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleLogin}
                                            className="w-full py-3 font-medium text-whiteColor transition-all duration-200 rounded-lg shadow-lg hover:opacity-90"
                                            style={{ backgroundColor: 'var(--color-main)' }}
                                        >
                                            {t('loginSignUp')}
                                        </button>
                                    )}
                                </div>

                                {/* Menu Items */}
                                <div className="p-4 space-y-2">
                                    {menuItems.map((item, index) => (
                                        <Link
                                            key={index}
                                            to={item.path}
                                            className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-4'} space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <div className="flex items-center justify-center w-12 h-12 transition-colors rounded-xl group-hover:bg-opacity-20">
                                                <item.icon className="w-6 h-6" style={{ color: 'var(--color-main)' }} />
                                            </div>
                                            <span className="flex-1 text-lg font-medium text-right text-gray-800">
                                                {t(item.i18nKey)}
                                            </span>
                                        </Link>
                                    ))}

                                    {/* Favorites */}
                                    {isLoggedIn && user && (
                                        <>
                                            <Link
                                                to="/favorite_product"
                                                className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-4'} space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group relative`}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <div className="flex items-center justify-center w-12 h-12 transition-colors rounded-xl group-hover:bg-opacity-20">
                                                    <Heart className="w-6 h-6" style={{ color: 'var(--color-main)' }} />
                                                </div>
                                                <span className="flex-1 text-lg font-medium text-right text-gray-800">
                                                    {t('favorites')}
                                                </span>
                                            </Link>

                                            <Link
                                                to="/orders"
                                                className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-4'} space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group relative`}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <div className="flex items-center justify-center w-12 h-12 transition-colors rounded-xl group-hover:bg-opacity-20">
                                                    <Package className="w-6 h-6" style={{ color: 'var(--color-main)' }} />
                                                </div>
                                                <span className="flex-1 text-lg font-medium text-right text-gray-800">
                                                    {t('Orders')}
                                                </span>
                                            </Link>

                                            {/* Logout in Sidebar for logged-in users */}
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-4'} space-x-4 p-3 rounded-xl hover:bg-red-50 transition-all duration-200 group w-full text-right`}
                                            >
                                                <div className="flex items-center justify-center w-12 h-12 transition-colors rounded-xl group-hover:bg-opacity-20">
                                                    <LogOut className="w-6 h-6 text-red-600" />
                                                </div>
                                                <span className="flex-1 text-lg font-medium text-red-600">
                                                    {t('logout')}
                                                </span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-2 border-t border-gray-100 bg-gray-50">
                                <div className="flex items-center justify-center space-x-3 text-gray-600">
                                    <Link to="https://food2go.online/" target="_blank" className="flex items-center justify-center gap-2">
                                        <h1 className="text-gray-600">{t("Poweredby")}</h1>
                                        <img src={mainLogo} className="w-16 h-16" alt="Main Logo" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;