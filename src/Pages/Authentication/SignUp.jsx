import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaEnvelope, FaPhone, FaLock, FaUser, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../Context/Auth';
import { usePost } from '../../Hooks/usePost';
import { InputOtp } from 'primereact/inputotp';
import { MdFastfood } from 'react-icons/md';
import { useGet } from '../../Hooks/useGet';
import { useTranslation } from 'react-i18next';

const SignUpPage = () => {
    const { t, i18n } = useTranslation();
    const language = i18n.language === 'en';
    const auth = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const mainData = useSelector((state) => state.mainData?.data);
    const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');
    // API hooks
    const { refetch: fetchVerificationType, loading: loadingVerification, data: verificationData } = useGet({
        url: `${apiUrl}/api/customer_login`
    });

    const [code, setCode] = useState('');

    const [signState, setSignState] = useState('signUp');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [optionalPhone, setOptionalPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [configPassword, setConfigPassword] = useState('');
    const [token, setToken] = useState('');
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [verificationMethod, setVerificationMethod] = useState(null);

    const { postData: postEmail, loadingPost: loadingEmail, response: responseEmail } = usePost({
        url: `${apiUrl}/api/user/auth/signup/code`,
    });
    const { postData: postPhone, loadingPost: loadingPhone, response: responsePhone } = usePost({
        url: `${apiUrl}/api/user/auth/signup/phone_code`,
    });
    const { postData: postSignUp, loadingPost: loadingSignUp, response: responseSignUp } = usePost({
        url: `${apiUrl}/api/user/auth/signup`,
    });

    const customInput = ({ events, props }) => {
        const { invalid, ...inputProps } = props;
        const inputClass = invalid ? 'border-secoundColor' : 'border-gray-300';

        return (
            <input
                {...events}
                {...inputProps}
                key={props.id}
                className={`w-full pl-4 pr-4 py-3 rounded-lg text-black border ${inputClass} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200 text-center text-xl tracking-widest`}
                type="text"
                unstyled={props.unstyled ? 'true' : 'false'}
            />
        );
    };

    // Fetch verification method on component mount
    useEffect(() => {
        fetchVerificationType();
    }, [fetchVerificationType]);

    // Set verification method when data is available
    useEffect(() => {
        if (verificationData && verificationData.customer_login) {
            setVerificationMethod(verificationData.customer_login?.verification);
        }
    }, [verificationData]);

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validatePhone = (phone) => {
        const re = /^[+]?[0-9]{10,15}$/;
        return re.test(phone);
    };

    const handleSignUp = (e) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage('');

        const newErrors = {};
        if (!firstName) newErrors.firstName = t("PleaseEnterYourFirstName");
        if (!lastName) newErrors.lastName = t("PleaseEnterYourLastName");
        if (verificationMethod === 'phone') {
            if (!validatePhone(phone)) newErrors.phone = t("PleaseEnterAValidPhoneNumber");
        }
        if (verificationMethod === 'email') {
            if (!validateEmail(email)) newErrors.email = t("PleaseEnterAValidEmailAddress");
        }

        if (!password)
            newErrors.password = t("PleaseEnterAPassword");
        if (configPassword !== password) newErrors.configPassword = t("PasswordsDoNotMatch");

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const payload = {
            f_name: firstName,
            l_name: lastName,
            phone,
            phone_2: optionalPhone,
            email,
            password,
            conf_password: configPassword,
        };

        if (token) {
            Number(token) === code ? postSignUp(payload) : setErrors({ token: t("InvalidOTPCode") });
        } else {
            if (verificationMethod === 'email') {
                postEmail({ email: payload.email });
            }
            if (verificationMethod === 'phone') {
                postPhone({ phone: payload.phone });
            }
        }
    };

    useEffect(() => {
        if (responseSignUp) {
            auth.login(responseSignUp.data);
            navigate('/order_online', { replace: true });
        }
    }, [responseSignUp]);

    useEffect(() => {
        if (responseEmail) {
            setSignState('otp');
            setSuccessMessage(t("VerificationCodeSentToYourEmail"));
            setCode(responseEmail?.data?.code);
        }
    }, [responseEmail]);

    useEffect(() => {
        if (responsePhone) {
            setSignState('otp');
            setSuccessMessage(t("VerificationCodeSentToYourEmail"));
            setCode(responsePhone?.data?.code);
        }
    }, [responsePhone]);

    const renderContent = () => {
        if (loadingSignUp || loadingEmail || loadingPhone) {
            return (
                <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-thirdColor to-mainColor">
                    <div className="w-full max-w-md p-8 text-center bg-white shadow-xl rounded-2xl">
                        <svg
                            className="w-10 h-10 mx-auto animate-spin text-mainColor"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        <p className="mt-4 text-secoundColor">{t("Processing")}</p>
                    </div>
                </div>
            );
        }

        switch (signState) {
            case 'signUp':
                return (
                    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-thirdColor to-mainColor">
                        <div className="relative flex w-full max-w-6xl overflow-hidden shadow-2xl rounded-3xl">
                            {/* Left side - Illustration */}
                            <div className="relative flex-col items-center justify-center hidden p-8 overflow-hidden text-white md:flex md:w-2/5 bg-mainColor">
                                <div className="absolute inset-0 bg-gradient-to-b from-mainColor/20 to-secoundColor/30"></div>
                                <div className="relative z-10 text-center">
                                    <div className="flex justify-center mb-6">
                                        <MdFastfood className="w-24 h-24 text-white" />
                                    </div>
                                    <h2 className="mb-4 text-3xl font-bold">{`${selectedLanguage === "en" ? mainData?.name : mainData?.ar_name}`}</h2>
                                    <p className="text-thirdColor">{t("DeliciousMealsDeliveredToYourDoor")}</p>
                                </div>
                                <div className="absolute w-16 h-16 rounded-full top-10 left-10 bg-white/10"></div>
                                <div className="absolute w-20 h-20 rounded-full bottom-10 right-10 bg-white/10"></div>
                                <div className="absolute w-10 h-10 rounded-full top-1/3 right-6 bg-white/5"></div>
                            </div>

                            {/* Right side - Form */}
                            <div className="flex flex-col justify-center w-full p-8 bg-white md:w-3/5 md:p-12">
                                <div className="mb-8 text-center">
                                    <h1 className="mb-2 text-3xl font-bold text-secoundColor">
                                        {t("SignUpTo")} {selectedLanguage === "en" ? mainData?.name : mainData?.ar_name}
                                    </h1>
                                    <p className="text-secoundColor">
                                        {t("CreateYour")} {selectedLanguage === "en" ? mainData?.name : mainData?.ar_name} {t("Account")}
                                    </p>
                                </div>

                                <form onSubmit={handleSignUp} className="space-y-5">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                                {t("FirstName")}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <FaUser className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    placeholder={t("EnterYourFirstName")}
                                                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.firstName ? 'border-secoundColor' : 'border-gray-300'} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200`}
                                                />
                                            </div>
                                            {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                                {t("LastName")}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <FaUser className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    placeholder={t("EnterYourLastName")}
                                                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.lastName ? 'border-secoundColor' : 'border-gray-300'} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200`}
                                                />
                                            </div>
                                            {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
                                        </div>
                                    </div>



                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700">{t("PhoneNumber")}</label>

                                        <div className="relative">
                                            <div className={`absolute inset-y-0 left-0 flex items-center  pointer-events-none ${language ? 'left-0 pl-3' : 'right-0 pr-3'}`}>
                                                <FaPhone className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                dir={language ? 'ltr' : 'rtl'}
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder={t("EnterYourPhoneNumber")}
                                                className={`w-full   py-3 rounded-lg border ${language ? 'ltr  pl-10 pr-3' : 'rtl  pr-10 pl-3'}    ${errors.phone ? 'border-secoundColor' : 'border-gray-300'} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200`}
                                            />
                                        </div>
                                        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                                    </div>


                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700">{t("OptionalPhoneNumber")}</label>
                                        <div className="relative">
                                            <div className={`absolute inset-y-0 left-0 flex items-center  pointer-events-none ${language ? 'left-0 pl-3' : 'right-0 pr-3'}`}>
                                                <FaPhone className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                dir={language ? 'ltr' : 'rtl'}
                                                type="tel"
                                                value={optionalPhone}
                                                onChange={(e) => setOptionalPhone(e.target.value)}
                                                placeholder={t("EnterOptionalPhoneNumber")}
                                                className={`w-full  ${language ? 'ltr  pl-10 pr-3' : 'rtl  pr-10 pl-3'}    py-3 rounded-lg border  ${errors.optionalPhone ? 'border-secoundColor' : 'border-gray-300'} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200`}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700">{t("EmailAddress")}</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <FaEnvelope className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder={t("EnterYourEmail")}
                                                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.email ? 'border-secoundColor' : 'border-gray-300'} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200`}
                                            />
                                        </div>
                                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700">{t("Password")}</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <FaLock className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={t("EnterYourPassword")}
                                                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.password ? 'border-secoundColor' : 'border-gray-300'} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200`}
                                            />
                                        </div>
                                        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700">{t("ConfirmPassword")}</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <FaLock className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                value={configPassword}
                                                onChange={(e) => setConfigPassword(e.target.value)}
                                                placeholder={t("ConfirmYourPassword")}
                                                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.configPassword ? 'border-secoundColor' : 'border-gray-300'} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200`}
                                            />
                                        </div>
                                        {errors.configPassword && <p className="mt-1 text-sm text-red-500">{errors.configPassword}</p>}
                                    </div>

                                    {errors.general && (
                                        <div className="p-3 text-sm rounded-lg bg-red-50 text-red-500">{errors.general}</div>
                                    )}
                                    {successMessage && (
                                        <div className="p-3 text-sm text-green-700 rounded-lg bg-green-50">{successMessage}</div>
                                    )}

                                    <button
                                        type="submit"
                                        className="flex items-center justify-center w-full px-4 py-3 font-bold text-white transition duration-200 rounded-lg shadow-md bg-mainColor hover:bg-secoundColor hover:shadow-lg"
                                        disabled={loadingSignUp}
                                    >
                                        {loadingSignUp ? (
                                            <>
                                                <svg
                                                    className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                {t("SigningUp")}
                                            </>
                                        ) : t("SignUp")}
                                    </button>
                                </form>

                                <div className="mt-8 text-center">
                                    <p className="text-sm text-gray-600">
                                        {t("AlreadyHaveAnAccount")}{" "}
                                        <Link to="/login" className="font-medium text-secoundColor hover:text-mainColor">
                                            {t("LogIn")}
                                        </Link>
                                    </p>

                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'otp':
                return (
                    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-thirdColor to-mainColor">
                        <div className="w-full max-w-md p-4 bg-white shadow-xl rounded-2xl md:p-8">
                            <button
                                onClick={() => setSignState('signUp')}
                                className="flex items-center mb-6 text-secoundColor hover:text-mainColor"
                            >
                                <FaArrowLeft className="mr-2" /> {t("BackToSignUp")}
                            </button>

                            <div className="mb-8 text-center">
                                <div className="flex justify-center mb-4">
                                    <FaEnvelope className="w-12 h-12 text-mainColor" />
                                </div>
                                <h1 className="mb-2 text-2xl font-bold text-secoundColor">{t("VerificationCode")}</h1>
                                <p className="text-secoundColor">
                                    {t("WeHaveSentACodeToYour")} {verificationMethod === 'email' ? t("Email") : t("Phone")}
                                </p>

                            </div>

                            <form onSubmit={handleSignUp}>
                                <div className="mb-6">
                                    <label className="block mb-2 text-sm font-medium text-gray-700">{t("VerificationCode")}</label>
                                    <div className="relative">
                                        <InputOtp
                                            value={token}
                                            onChange={(e) => setToken(e.value)}
                                            length={5}
                                            integerOnly
                                            inputTemplate={customInput}
                                        />
                                    </div>
                                    {errors.token && <p className="mt-1 text-sm text-red-500">{errors.token}</p>}
                                </div>

                                {errors.general && (
                                    <div className="p-3 mb-4 text-sm rounded-lg bg-red-50 text-red-500">{errors.general}</div>
                                )}
                                {successMessage && (
                                    <div className="p-3 mb-4 text-sm text-green-700 rounded-lg bg-green-50">{successMessage}</div>
                                )}

                                <button
                                    type="submit"
                                    className="flex items-center justify-center w-full px-4 py-3 font-medium text-white transition duration-200 rounded-lg shadow-md bg-mainColor hover:bg-secoundColor"
                                    disabled={loadingSignUp}
                                >
                                    {loadingSignUp ? (
                                        <>
                                            <svg
                                                className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            {t("Verifying")}...
                                        </>
                                    ) : t("VerifyCode")}
                                </button>
                            </form>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return <div className="signup-page">{renderContent()}</div>;
};

export default SignUpPage;