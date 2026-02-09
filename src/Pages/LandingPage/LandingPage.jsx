import React from "react";
import MenuIcon from "../../assets/Icons/MenuIcon";
import DashIcon from "../../assets/Icons/DashIcon";
import AppleIcon from "../../assets/Icons/AppleIcon";
import GooglePlayIcon from "../../assets/Icons/GooglePlayIcon";
import mainLogo from '../../assets/Images/mainLogo.jpeg'
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { MdOutlineRestaurantMenu } from "react-icons/md";
import { FaLock } from "react-icons/fa";

const LandingPage = () => {
    const { t } = useTranslation();
    const mainData = useSelector(state => state.mainData?.data);
    const companyInfo = useSelector(state => state.maintenance?.data);
    const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');

    // Logic helpers to determine if apps are enabled
    const androidEnabled = companyInfo?.company_info?.android_switch === 1 && companyInfo?.company_info?.android_link;
    const iosEnabled = companyInfo?.company_info?.ios_switch === 1 && companyInfo?.company_info?.ios_link;

    return (
        <div className="w-full h-screen flex flex-col gap-6 items-center justify-center overflow-hidden">
            <div className="w-full flex flex-col md:flex-row pb-0 p-2 md:p-6">

                {/* Left Side: Logo and Name */}
                <div className="w-full md:w-1/2 flex flex-col items-center">
                    <img src={mainData?.logo_link} width={180} height={180} alt="Main Logo" />
                    <div className="flex items-center justify-center gap-2">
                        <h1 className="text-2xl font-semibold text-mainColor">
                            {selectedLanguage === "en" ? mainData?.name : mainData?.ar_name}
                        </h1>
                    </div>
                </div>

                {/* Right Side: Navigation and Store Links */}
                <div className="w-full md:w-1/2 flex flex-col gap-3 p-2 md:p-4 items-center justify-center">
                    <div className="flex flex-col gap-5">
                        <div className="w-full flex gap-5">
                            <Link to="/electronic_menu" className="bg-thirdColor flex flex-col gap-3 items-center justify-center rounded-xl p-2 md:p-6">
                                <MenuIcon />
                                <h1 className="text-2xl text-mainColor">{t("electronicMenu")}</h1>
                            </Link>
                            <Link to="/menu" className="bg-thirdColor flex flex-col gap-3 items-center justify-center rounded-xl p-2 md:p-6">
                                <DashIcon />
                                <h1 className="text-2xl text-mainColor">{t("menu")}</h1>
                            </Link>
                        </div>

                        <div className="w-full">
                            <Link to="/order_online" className="bg-thirdColor flex gap-3 items-center justify-center rounded-xl p-2">
                                <MdOutlineRestaurantMenu size={36} className="text-mainColor" />
                                <h1 className="text-2xl text-mainColor">{t("orderNow")}</h1>
                            </Link>
                        </div>
                    </div>

                    {/* App Store Links Section */}
                    <div className="flex gap-2 p-4 pb-0 items-center justify-center">
                        {/* Google Play */}
                        <Link
                            to={androidEnabled ? companyInfo.company_info.android_link : "#"}
                            target={androidEnabled ? "_blank" : undefined}
                            className="relative block w-[150px] h-[60px] overflow-hidden rounded-lg" // Added block, overflow-hidden, and rounded
                            onClick={(e) => { if (!androidEnabled) e.preventDefault(); }}
                        >
                            <div className="w-full h-full flex items-center justify-center">
                                <GooglePlayIcon />
                            </div>

                            {!androidEnabled && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/70 cursor-not-allowed">
                                    <FaLock className="text-white text-2xl drop-shadow-md" />
                                </div>
                            )}
                        </Link>

                        {/* App Store */}
                        <Link
                            to={iosEnabled ? companyInfo.company_info.ios_link : "#"}
                            target={iosEnabled ? "_blank" : undefined}
                            className="relative block w-[150px] h-[60px] overflow-hidden rounded-lg" // Added block, overflow-hidden, and rounded
                            onClick={(e) => { if (!iosEnabled) e.preventDefault(); }}
                        >
                            <div className="w-full h-full flex items-center justify-center">
                                <AppleIcon />
                            </div>

                            {!iosEnabled && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/70 cursor-not-allowed">
                                    <FaLock className="text-white text-2xl drop-shadow-md" />
                                </div>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col items-center justify-center gap-2">
                <Link to="https://food2go.online/" target="_blank" className="flex items-center justify-center gap-2">
                    <h1 className="text-gray-600">{t("Poweredby")}</h1>
                    <img src={mainLogo} className="w-16 h-16" alt="Main Logo" />
                </Link>

                {/* Support and Privacy Policy Links */}
                {/* <div className="flex items-center justify-center gap-4 text-sm">
                    <Link to="/support" className="text-gray-500 hover:text-mainColor transition-colors">
                        {t("support")}
                    </Link>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <Link to="/policy" className="text-gray-500 hover:text-mainColor transition-colors">
                        {t("privacyPolicy")}
                    </Link>
                </div> */}
            </div>
        </div>
    );
}

export default LandingPage;