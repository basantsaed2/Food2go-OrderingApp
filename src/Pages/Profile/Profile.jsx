import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useGet } from '../../Hooks/useGet';
import { FaUserCircle, FaEdit, FaPhone, FaUser, FaShoppingBasket, FaWallet } from 'react-icons/fa';
import EditProfile from './EditProfile';

const Profile = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);

    const {
        refetch: refetchProfile,
        loading: loadingProfileData,
        data: dataProfile,
    } = useGet({
        url: `${apiUrl}/customer/profile/profile_data?locale=${selectedLanguage}`,
        required: true,
        autoFetch: true,
    });

    const stableDataProfile = useMemo(() => dataProfile, [JSON.stringify(dataProfile)]);

    useEffect(() => {
        if (stableDataProfile && stableDataProfile.data) {
            setProfileData((prev) => {
                if (JSON.stringify(prev) !== JSON.stringify(stableDataProfile.data)) {
                    return stableDataProfile.data;
                }
                return prev;
            });
        }
    }, [stableDataProfile]);

    useEffect(() => {
        refetchProfile();
    }, [selectedLanguage, refetchProfile]);

    const handleUpdateProfile = useCallback((updatedData) => {
        setProfileData((prev) => {
            const newData = { ...prev, ...updatedData.data };
            if (JSON.stringify(prev) !== JSON.stringify(newData)) {
                return newData;
            }
            return prev;
        });
    }, []);

    const profileContent = useMemo(() => {
        if (loadingProfileData) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="text-5xl animate-spin text-mainColor">
                        <FaUserCircle />
                    </div>
                </div>
            );
        }
        if (!profileData) {
            return (
                <div className="py-12 text-center">
                    <p className="text-lg text-gray-500 animate-fadeIn">{t('NoProfileData')}</p>
                </div>
            );
        }
        return (
            <div className="flex flex-col gap-6">
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold text-center text-mainColor animate-fadeIn">{t('myProfile')}</h1>
                    <div className="flex flex-col items-center gap-6 sm:flex-row">
                        {profileData.image_link ? (
                            <img
                                src={profileData.image_link}
                                alt="Profile"
                                className="object-cover w-32 h-32 transition-all duration-300 border-4 rounded-full border-mainColor/20 hover:border-mainColor/50 hover:scale-105"
                            />
                        ) : (
                            <FaUserCircle className="w-32 h-32 text-gray-300 transition-all duration-300 hover:scale-105" />
                        )}
                        <div className="text-center sm:text-left">
                            <h2 className="text-2xl font-semibold text-gray-800 md:text-3xl animate-fadeIn">
                                {profileData.f_name} {profileData.l_name}
                            </h2>
                            <p className="mt-1 text-gray-600 animate-fadeIn">{profileData.email}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="flex items-center gap-3 animate-fadeIn">
                            <FaPhone className="text-xl text-mainColor" />
                            <div>
                                <span className="text-sm font-medium text-gray-500">{t('Phone')}:</span>
                                <p className="text-gray-800">{profileData.phone || t('NotProvided')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 animate-fadeIn">
                            <FaPhone className="text-xl text-mainColor" />
                            <div>
                                <span className="text-sm font-medium text-gray-500">{t('Phone2')}:</span>
                                <p className="text-gray-800">{profileData.phone_2 || t('NotProvided')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 animate-fadeIn">
                            <FaUser className="text-xl text-mainColor" />
                            <div>
                                <span className="text-sm font-medium text-gray-500">{t('Bio')}:</span>
                                <p className="text-gray-800">{profileData.bio || t('NoBioProvided')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 animate-fadeIn">
                            <FaShoppingBasket className="text-xl text-mainColor" />
                            <div>
                                <span className="text-sm font-medium text-gray-500">{t('OrdersCount')}:</span>
                                <p className="text-gray-800">{profileData.orders_count || 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 animate-fadeIn">
                            <FaWallet className="text-xl text-mainColor" />
                            <div>
                                <span className="text-sm font-medium text-gray-500">{t('Wallet')}:</span>
                                <p className="text-gray-800">{profileData.wallet || 0} {t('Currency')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 animate-fadeIn">
                            <FaUser className="text-xl text-mainColor" />
                            <div>
                                <span className="text-sm font-medium text-gray-500">{t('Points')}:</span>
                                <p className="text-gray-800">{profileData.points || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center">
                    <button
                        onClick={() => setIsEditOpen(true)}
                        className="flex items-center justify-center w-full gap-2 py-3 mt-6 font-semibold text-white transition-all duration-300 rounded-lg md:w-1/4 bg-mainColor hover:bg-white hover:text-mainColor"
                    >
                        <FaEdit className="w-5 h-5" />
                        {t('EditProfile')}
                    </button>
                </div>
            </div>
        );
    }, [loadingProfileData, profileData, t]);

    return (
        <div className="flex justify-center min-h-screen p-4 bg-gradient-to-br from-mainColor/10 to-gray-100">
            <div className="w-full max-w-7xl p-4 transition-all duration-500 bg-white border-2 border-transparent shadow-xl rounded-2xl md:p-8 bg-clip-padding border-gradient-to-r from-mainColor to-mainColor/50 hover:shadow-2xl">
                {profileContent}
                <EditProfile
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    profileData={profileData}
                    onUpdate={handleUpdateProfile}
                />
            </div>
        </div>
    );
};

export default Profile;