import React, { useEffect, useRef, useState } from "react";
import { usePost } from "../../Hooks/usePost";
import { useAuth } from "../../Context/Auth";
import { FiHome, FiMapPin, FiSearch, FiNavigation, FiAlertCircle } from "react-icons/fi";
import { MdWork, MdMyLocation, MdPlace } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { IoIosArrowBack, IoIosPin } from "react-icons/io";
import { useTranslation } from "react-i18next";
import { useGet } from "../../Hooks/useGet";
import { useSelector } from "react-redux";
import Select from "react-select";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const createCustomIcon = (color) => {
    return new L.Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path fill="${color}" d="M16 0C10.477 0 6 4.477 6 10c0 10 10 22 10 22s10-12 10-22c0-5.523-4.477-10-10-10zm0 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
        <circle fill="#ffffff" cx="16" cy="10" r="3"/>
      </svg>
    `)}`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
};

// Map click handler component
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        },
    });
    return null;
}

// Map updater component
function MapUpdater({ userLocation }) {
    const map = useMap();

    useEffect(() => {
        if (userLocation && userLocation.lat && userLocation.lng) {
            map.setView([userLocation.lat, userLocation.lng], 15);
        }
    }, [userLocation, map]);

    return null;
}

const AddNewAddress = () => {
    const { t } = useTranslation();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const locationIqApiKey = import.meta.env.VITE_LOCATIONIQ_API_KEY;
    const mainColor = "var(--color-main)";
    const selectedLanguage = useSelector((state) => state.language?.selected ?? "en");

    const { postData, loadingPost, response } = usePost({
        url: `${apiUrl}/customer/address/add`,
    });

    const { loading: loadingLists, data: dataLists, refetch: refetchLists } = useGet({
        url: `${apiUrl}/customer/address/lists2?locale=${selectedLanguage}`,
        required: true,
    });

    const auth = useAuth();
    const navigate = useNavigate();
    const mapRef = useRef(null);
    const searchInputRef = useRef(null);

    const [cityId, setCityId] = useState("");
    const [zoneId, setZoneId] = useState("");
    const [cities, setCities] = useState([]);
    const [zones, setZones] = useState([]);
    const [street, setStreet] = useState("");
    const [buildingNo, setBuildingNo] = useState("");
    const [floorNo, setFloorNo] = useState("");
    const [apartment, setApartment] = useState("");
    const [moreData, setMoreData] = useState("");
    const [addressType, setAddressType] = useState("home");
    const [userLocation, setUserLocation] = useState(null);
    const [locationName, setLocationName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [mapReady, setMapReady] = useState(false);

    // Default coordinates (Cairo, Egypt)
    const defaultLocation = { lat: 30.0444, lng: 31.2357 };

    // Custom styles for React Select
    const selectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderRadius: "12px",
            padding: "8px 4px",
            borderColor: state.isFocused ? mainColor : "#e5e7eb",
            borderWidth: state.isFocused ? "2px" : "1px",
            boxShadow: state.isFocused ? `0 0 0 3px ${mainColor}20` : "none",
            "&:hover": { borderColor: mainColor },
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? mainColor : state.isFocused ? `${mainColor}10` : "white",
            color: state.isSelected ? "white" : "#1f2937",
            padding: "12px 16px",
            "&:hover": { backgroundColor: `${mainColor}10` },
            zIndex: 9999,
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
        }),
    };

    // Address type options
    const addressTypeOptions = [
        {
            type: "home",
            icon: <FiHome size={20} />,
            label: t("Home"),
            color: `${mainColor}20`,
            textColor: mainColor,
        },
        {
            type: "work",
            icon: <MdWork size={20} />,
            label: t("Work"),
            color: "#10b98120",
            textColor: "#10b981",
        },
        {
            type: "other",
            icon: <FiMapPin size={20} />,
            label: t("Other"),
            color: "#8b5cf620",
            textColor: "#8b5cf6",
        },
    ];

    // Initialize map with default location
    useEffect(() => {
        setUserLocation(defaultLocation);
        setMapReady(true);
    }, []);

    // Fetch cities and zones
    useEffect(() => {
        refetchLists();
    }, [refetchLists]);

    useEffect(() => {
        if (dataLists && dataLists.cities && dataLists.zones) {
            setCities(
                dataLists.cities.map((city) => ({
                    value: city.id,
                    label: city.name.replace(/:[0-9]+$/, ""),
                }))
            );
            setZones(
                dataLists.zones
                    .filter((zone) => (cityId ? zone.city_id === cityId : true))
                    .map((zone) => ({
                        value: zone.id,
                        label: zone.zone,
                    }))
            );
        }
    }, [dataLists, cityId]);

    // Navigate after successful submission
    useEffect(() => {
        if (!loadingPost && response) {
            navigate("/order_online");
        }
    }, [loadingPost, response, navigate]);

    // Enhanced address search with better error handling
    const fetchAddressSuggestions = async (query) => {
        if (!query || query.trim().length < 2) {
            setAddressSuggestions([]);
            setSearchError("");
            return;
        }

        setIsSearching(true);
        setSearchError("");

        try {
            const selectedCity = cities.find((city) => city.value === cityId);
            const queryParams = new URLSearchParams({
                key: locationIqApiKey,
                q: query,
                format: "json",
                addressdetails: 1,
                limit: 8,
                countrycodes: "eg",
                "accept-language": selectedLanguage === "ar" ? "ar" : "en",
            });

            if (selectedCity) {
                queryParams.append("city", selectedCity.label);
            }

            const response = await fetch(
                `https://api.locationiq.com/v1/autocomplete?${queryParams.toString()}`
            );

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const suggestions = data.map((item) => ({
                value: item.place_id,
                label: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                addressDetails: item.address,
                type: "locationiq",
            }));

            setAddressSuggestions(suggestions);

            // Fallback to local search if no results
            if (suggestions.length === 0) {
                const localSuggestions = [
                    ...zones.filter(zone =>
                        zone.label.toLowerCase().includes(query.toLowerCase())
                    ).map(zone => ({
                        value: `zone-${zone.value}`,
                        label: `${zone.label} - ${t("Zone")}`,
                        lat: null,
                        lng: null,
                        addressDetails: { zone: zone.label },
                        type: "zone",
                    })),
                    ...cities.filter(city =>
                        city.label.toLowerCase().includes(query.toLowerCase())
                    ).map(city => ({
                        value: `city-${city.value}`,
                        label: `${city.label} - ${t("City")}`,
                        lat: null,
                        lng: null,
                        addressDetails: { city: city.label },
                        type: "city",
                    }))
                ];

                setAddressSuggestions(localSuggestions.slice(0, 6));

                if (localSuggestions.length === 0) {
                    setSearchError(t("No results found. Try a different search term or select from the map."));
                }
            }
        } catch (error) {
            console.error("Search error:", error);

            // Fallback to local search only
            const localResults = [
                ...zones.filter(zone =>
                    zone.label.toLowerCase().includes(query.toLowerCase())
                ),
                ...cities.filter(city =>
                    city.label.toLowerCase().includes(query.toLowerCase())
                )
            ].slice(0, 6).map(item => ({
                value: item.value,
                label: item.label,
                lat: null,
                lng: null,
                addressDetails: {},
                type: "local",
            }));

            setAddressSuggestions(localResults);

            if (localResults.length === 0) {
                setSearchError(t("No local results found. Please try a different search or click on the map."));
            } else {
                setSearchError(t("Using local results only. Online search unavailable."));
            }
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced search with proper cleanup
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                fetchAddressSuggestions(searchQuery.trim());
            } else {
                setAddressSuggestions([]);
                setSearchError("");
            }
        }, 800);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, cityId]);

    // Handle address selection from search
    const handleAddressSelect = (suggestion) => {
        if (!suggestion) return;

        setSearchQuery(suggestion.label);
        setLocationName(suggestion.label);
        setAddressSuggestions([]);
        setSearchError("");

        if (suggestion.lat && suggestion.lng) {
            // Has coordinates - update map location
            setUserLocation({
                lat: suggestion.lat,
                lng: suggestion.lng
            });

            // Auto-fill form fields if possible
            if (suggestion.addressDetails) {
                setStreet(suggestion.addressDetails.road || suggestion.addressDetails.street || "");

                // Auto-detect city
                const cityName = suggestion.addressDetails.city ||
                    suggestion.addressDetails.town ||
                    suggestion.addressDetails.village;
                if (cityName) {
                    const matchedCity = cities.find(city =>
                        city.label.toLowerCase().includes(cityName.toLowerCase()) ||
                        cityName.toLowerCase().includes(city.label.toLowerCase())
                    );
                    if (matchedCity) setCityId(matchedCity.value);
                }

                // Auto-detect zone
                const zoneName = suggestion.addressDetails.suburb ||
                    suggestion.addressDetails.neighbourhood ||
                    suggestion.addressDetails.quarter;
                if (zoneName) {
                    const matchedZone = zones.find(zone =>
                        zone.label.toLowerCase().includes(zoneName.toLowerCase()) ||
                        zoneName.toLowerCase().includes(zone.label.toLowerCase())
                    );
                    if (matchedZone) setZoneId(matchedZone.value);
                }
            }
        } else {
            // Local zone or city selection
            if (suggestion.type === "zone") {
                const zoneValue = suggestion.value.replace('zone-', '');
                setZoneId(zoneValue);
            } else if (suggestion.type === "city") {
                const cityValue = suggestion.value.replace('city-', '');
                setCityId(cityValue);
            }
        }
    };

    // Handle map click
    const handleMapClick = async (latlng) => {
        const newLocation = {
            lat: latlng.lat,
            lng: latlng.lng,
        };

        setUserLocation(newLocation);

        // Reverse geocode to get address name
        try {
            const address = await reverseGeocode(latlng.lat, latlng.lng);
            setLocationName(address);
            setSearchQuery(address);
        } catch (error) {
            const fallbackAddress = `${t("Location at")} ${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
            setLocationName(fallbackAddress);
            setSearchQuery(fallbackAddress);
        }
    };

    // Reverse geocode coordinates to address
    const reverseGeocode = async (lat, lng) => {
        if (!locationIqApiKey) {
            throw new Error("API key not configured");
        }

        try {
            const response = await fetch(
                `https://api.locationiq.com/v1/reverse.php?key=${locationIqApiKey}&lat=${lat}&lon=${lng}&format=json&accept-language=${selectedLanguage === "ar" ? "ar" : "en"}`
            );

            if (!response.ok) {
                throw new Error(`Reverse geocoding failed: ${response.status}`);
            }

            const data = await response.json();
            return data.display_name || `${t("Location at")} ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            return `${t("Location at")} ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    };

    // Get current location
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setUserLocation(newLocation);

                    try {
                        const address = await reverseGeocode(newLocation.lat, newLocation.lng);
                        setLocationName(address);
                        setSearchQuery(address);
                    } catch (error) {
                        const fallbackAddress = `${t("Current location")} - ${newLocation.lat.toFixed(4)}, ${newLocation.lng.toFixed(4)}`;
                        setLocationName(fallbackAddress);
                        setSearchQuery(fallbackAddress);
                    }
                },
                (error) => {
                    auth.toastError(t("Unable to access your location. Please enable location permissions."));
                }
            );
        } else {
            auth.toastError(t("Geolocation is not supported by your browser"));
        }
    };

    // Generate Google Maps link from coordinates
    const generateGoogleMapsLink = (lat, lng) => {
        return `https://www.google.com/maps?q=${lat},${lng}`;
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!locationName) {
            auth.toastError(t("Please select a location on the map or from search"));
            return;
        }
        if (!street) {
            auth.toastError(t("Please Enter Street Name"));
            return;
        }
        if (!buildingNo) {
            auth.toastError(t("Please Enter Building Number"));
            return;
        }
        if (!floorNo) {
            auth.toastError(t("Please Enter Floor Number"));
            return;
        }
        if (!zoneId) {
            auth.toastError(t("Please Select Zone"));
            return;
        }
        if (!cityId) {
            auth.toastError(t("Please Select City"));
            return;
        }

        const formData = new FormData();
        formData.append("address", locationName);
        formData.append("zone_id", zoneId);
        formData.append("street", street);
        formData.append("building_num", buildingNo);
        formData.append("floor_num", floorNo);
        formData.append("apartment", apartment);
        formData.append("additional_data", moreData);
        formData.append("type", addressType);
        formData.append("city_id", cityId);

        if (userLocation) {
            formData.append("latitude", userLocation.lat);
            formData.append("longitude", userLocation.lng);
            // Add Google Maps link
            const mapsLink = generateGoogleMapsLink(userLocation.lat, userLocation.lng);
            formData.append("map", mapsLink);
        }

        postData(formData, t("Address Added Successfully"));
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            >
                                <IoIosArrowBack className="w-6 h-6 text-mainColor" />
                            </button>
                            <h1 className="text-2xl font-bold text-mainColor">{t("Add New Address")}</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Map Section */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <MdPlace className="w-5 h-5 mr-2" style={{ color: mainColor }} />
                                    {t("Select Location")}
                                </h2>
                                <button
                                    onClick={getCurrentLocation}
                                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                    style={{ backgroundColor: `${mainColor}10`, color: mainColor }}
                                >
                                    <MdMyLocation className="w-4 h-4" />
                                    <span>{t("My Location")}</span>
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="relative mb-6">
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t("Search for addresses, places, zones...")}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                                        style={{ focusBorderColor: mainColor }}
                                    />
                                    {isSearching && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Search Error */}
                                {searchError && (
                                    <div className="mt-2 flex items-center space-x-2 text-red-600 text-sm">
                                        <FiAlertCircle className="w-4 h-4" />
                                        <span>{searchError}</span>
                                    </div>
                                )}

                                {/* Search Suggestions - Fixed z-index */}
                                {addressSuggestions.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {addressSuggestions.map((suggestion, index) => (
                                            <button
                                                key={suggestion.value || index}
                                                onClick={() => handleAddressSelect(suggestion)}
                                                className="w-full text-left p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors duration-200"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <FiMapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {suggestion.label}
                                                        </p>
                                                        {suggestion.addressDetails && (
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {suggestion.addressDetails.road || suggestion.addressDetails.city || t("Location")}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Map Container - Lower z-index */}
                            <div className="relative rounded-xl overflow-hidden border-2 border-gray-200" style={{ height: "400px", zIndex: 10 }}>
                                {mapReady && userLocation ? (
                                    <MapContainer
                                        center={[userLocation.lat, userLocation.lng]}
                                        zoom={13}
                                        style={{ height: "100%", width: "100%" }}
                                        ref={mapRef}
                                        key={`map-${userLocation.lat}-${userLocation.lng}`}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <Marker
                                            position={[userLocation.lat, userLocation.lng]}
                                            icon={createCustomIcon(mainColor)}
                                        />
                                        <MapClickHandler onMapClick={handleMapClick} />
                                        <MapUpdater userLocation={userLocation} />
                                    </MapContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center bg-gray-100">
                                        <div className="text-center">
                                            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-gray-500">{t("Loading map...")}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Map Instructions */}
                                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm" style={{ zIndex: 20 }}>
                                    <p className="text-xs text-gray-600 flex items-center">
                                        <FiNavigation className="w-3 h-3 mr-1" />
                                        {t("Click on the map to set location")}
                                    </p>
                                </div>
                            </div>

                            {/* Selected Location Display */}
                            {locationName && (
                                <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: `${mainColor}20`, backgroundColor: `${mainColor}05` }}>
                                    <div className="flex items-start space-x-3">
                                        <IoIosPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: mainColor }} />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{t("Selected Location")}</p>
                                            <p className="text-gray-700 text-sm mt-1">{locationName}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">{t("Address Details")}</h2>

                            {/* Address Type Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    {t("Address Type")}
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {addressTypeOptions.map((item) => (
                                        <button
                                            key={item.type}
                                            type="button"
                                            onClick={() => setAddressType(item.type)}
                                            className={`p-4 border-2 rounded-xl text-center transition-all duration-200 ${addressType === item.type
                                                ? "border-current scale-105"
                                                : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            style={{
                                                backgroundColor: addressType === item.type ? item.color : "transparent",
                                                color: addressType === item.type ? item.textColor : "#6b7280",
                                                borderColor: addressType === item.type ? item.textColor : "#e5e7eb",
                                            }}
                                        >
                                            <div className="flex flex-col items-center space-y-2">
                                                {item.icon}
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Form Inputs */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("City")} *
                                        </label>
                                        <Select
                                            options={cities}
                                            value={cities.find((city) => city.value === cityId)}
                                            onChange={(selected) => setCityId(selected ? selected.value : "")}
                                            placeholder={t("Select City")}
                                            styles={selectStyles}
                                            isClearable
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("Zone")} *
                                        </label>
                                        <Select
                                            options={zones}
                                            value={zones.find((zone) => zone.value === zoneId)}
                                            onChange={(selected) => setZoneId(selected ? selected.value : "")}
                                            placeholder={t("Select Zone")}
                                            styles={selectStyles}
                                            isClearable
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("Street Name")} *
                                        </label>
                                        <input
                                            type="text"
                                            value={street}
                                            onChange={(e) => setStreet(e.target.value)}
                                            placeholder={t("Enter street name")}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                                            style={{ focusBorderColor: mainColor }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("Building Number")} *
                                        </label>
                                        <input
                                            type="text"
                                            value={buildingNo}
                                            onChange={(e) => setBuildingNo(e.target.value)}
                                            placeholder={t("Building number")}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                                            style={{ focusBorderColor: mainColor }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("Floor Number")} *
                                        </label>
                                        <input
                                            type="text"
                                            value={floorNo}
                                            onChange={(e) => setFloorNo(e.target.value)}
                                            placeholder={t("Floor number")}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                                            style={{ focusBorderColor: mainColor }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t("Apartment")}
                                        </label>
                                        <input
                                            type="text"
                                            value={apartment}
                                            onChange={(e) => setApartment(e.target.value)}
                                            placeholder={t("Apartment (optional)")}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                                            style={{ focusBorderColor: mainColor }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("Additional Information")}
                                    </label>
                                    <textarea
                                        value={moreData}
                                        onChange={(e) => setMoreData(e.target.value)}
                                        placeholder={t("Landmarks, special instructions, etc. (optional)")}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 resize-none"
                                        style={{ focusBorderColor: mainColor }}
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loadingPost}
                                    className="w-full bg-mainColor py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                                >
                                    {loadingPost ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>{t("Saving...")}</span>
                                        </div>
                                    ) : (
                                        t("Save Address")
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddNewAddress;