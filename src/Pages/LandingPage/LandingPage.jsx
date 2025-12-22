import React from "react";
import MenuIcon from "../../assets/Icons/MenuIcon";
import DashIcon from "../../assets/Icons/DashIcon";
import AppleIcon from "../../assets/Icons/AppleIcon";
import GooglePlayIcon from "../../assets/Icons/GooglePlayIcon";
import mainLogo from '../../assets/Images/mainLogo.jpeg'
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next'; // <-- Importing useTranslation hook
import { useDispatch, useSelector } from 'react-redux';

const LandingPage = () => {
    const { t, i18n } = useTranslation(); // <-- use i18n to change language
    const mainData = useSelector(state => state.mainData?.data);
    const companyInfo = useSelector(state => state.maintenance?.data);
    const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');

    return (
        <div className={`w-full h-screen flex flex-col gap-6 items-center justify-center overflow-hidden`}>
            <div className={`w-full flex flex-col md:flex-row pb-0 p-2 md:p-6`}>

                <div className={`w-full md:w-1/2 flex flex-col items-center`}>
                    <img src={mainData?.logo_link} width={180} height={180} alt="Main Logo" />
                    <div className="flex items-center justify-center gap-2">
                        <h1 className="text-2xl font-semibold text-mainColor">{selectedLanguage === "en" ? mainData?.name : mainData?.ar_name}</h1>
                    </div>
                </div>

                <div className={`w-full md:w-1/2 flex flex-col gap-3 p-2 md:p-4 items-center justify-center`}>
                    <div className="flex gap-5">
                        <Link to="/electronic_menu" className="bg-thirdColor flex flex-col gap-3  items-center justify-center rounded-xl p-2 md:p-6">
                            <MenuIcon />
                            <h1 className="text-2xl text-mainColor">{t("electronicMenu")}</h1>
                        </Link>
                        <Link to="/order_online" className="bg-thirdColor flex flex-col gap-3  items-center justify-center rounded-xl p-2 md:p-6">
                            <DashIcon />
                            <h1 className="text-2xl text-mainColor">{t("orderNow")}</h1>
                        </Link>
                    </div>

                    <div className="flex gap-1 p-4 pb-0">
                        <Link to={companyInfo?.company_info?.android_switch === 1 && companyInfo?.company_info?.android_link ? companyInfo?.company_info?.android_link : ""} className={`${companyInfo?.company_info?.android_switch === 1 && companyInfo?.company_info?.android_link ? "" : "opacity-50 cursor-not-allowed"} `}
                            {...(companyInfo?.company_info?.android_switch === 1 && companyInfo?.company_info?.android_link ? { target: '_blank' } : {})}
                        >
                            <GooglePlayIcon />
                        </Link>
                        <Link to={companyInfo?.company_info?.ios_switch === 1 && companyInfo?.company_info?.ios_link ? companyInfo?.company_info?.ios_link : ""} className={`${companyInfo?.company_info?.ios_switch === 1 && companyInfo?.company_info?.ios_link ? "" : "opacity-50 cursor-not-allowed"} `}
                            {...(companyInfo?.company_info?.ios_switch === 1 && companyInfo?.company_info?.ios_link ? { target: '_blank' } : {})}
                        >
                            <AppleIcon />
                        </Link>
                    </div>
                </div>
            </div>

            <Link to="https://food2go.online/" target="_blank" className="flex items-center justify-center gap-2">
                <h1 className="text-gray-600">{t("Poweredby")}</h1>
                <img src={mainLogo} className="w-16 h-16" alt="Main Logo" />
            </Link>
        </div>
    )
}

export default LandingPage;