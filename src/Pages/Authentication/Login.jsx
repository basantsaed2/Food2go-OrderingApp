import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePost } from '../../Hooks/usePost';
import { useGet } from '../../Hooks/useGet';
import { FaEnvelope, FaPhone, FaLock, FaUser, FaGoogle, FaFacebook, FaUtensils, FaArrowLeft } from 'react-icons/fa';
import { RiCustomerService2Fill } from 'react-icons/ri';
import { MdEmail, MdOutlinePassword, MdFastfood } from 'react-icons/md';
import { BiSolidFoodMenu } from 'react-icons/bi';
import { TbPasswordUser } from 'react-icons/tb';
import { useAuth } from '../../Context/Auth';
import { InputOtp } from 'primereact/inputotp';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const auth = useAuth();
    const { t } = useTranslation();
    const mainData = useSelector(state => state.mainData?.data);
    const selectedLanguage = useSelector(state => state.language?.selected || 'en');
    const isRTL = selectedLanguage === 'en';

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

    // State management
    const [verificationMethod, setVerificationMethod] = useState(null);
    const [loginStep, setLoginStep] = useState('login');
    // RENAMED state from 'email' to 'identifier' for combined login input
    const [identifier, setIdentifier] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    // API hooks
    const { refetch: fetchVerificationType, loading: loadingVerification, data: verificationData } = useGet({
        url: `${apiUrl}/api/customer_login`
    });

    const { postData: postSendOtp, loadingPost: loadingSendOtp, response: responseSendOtp } = usePost({
        url: `${apiUrl}/customer/otp/create_code`
    });

    const { postData: postVerifyOtp, loadingPost: loadingVerifyOtp, response: responseVerifyOtp } = usePost({
        url: `${apiUrl}/customer/otp/check_code`
    });

    const { postData: postResetPassword, loadingPost: loadingResetPassword, response: responseResetPassword } = usePost({
        url: `${apiUrl}/customer/otp/change_password`
    });

    const { postData: postLogin, loadingPost: loadingLogin, response: responseLogin } = usePost({
        url: `${apiUrl}/api/user/auth/login`
    });

    // Fetch verification method on component mount
    useEffect(() => {
        fetchVerificationType();
    }, [fetchVerificationType]);

    // Set verification method when data is available
    useEffect(() => {
        if (verificationData && verificationData.customer_login) {
            setVerificationMethod(verificationData.customer_login?.verification);
            setLoginStep('login');
        }
    }, [verificationData]);

    useEffect(() => {
        if (responseLogin && responseLogin?.status === 200) {
            navigate('/order_online');
            auth.login(responseLogin.data);
        }
    }, [responseLogin, loadingLogin])

    useEffect(() => {
        if (responseSendOtp?.status === 200) {
            setLoginStep('otp');
            setSuccessMessage(t('verificationCodeSent', { method: verificationMethod }));
        }
    }, [responseSendOtp, loadingSendOtp, verificationMethod, t])

    useEffect(() => {
        if (responseVerifyOtp?.status === 200) {
            setLoginStep('newPassword');
            setSuccessMessage(t('codeVerifiedSuccessfully'));
        }
    }, [responseVerifyOtp, loadingVerifyOtp, t])

    useEffect(() => {
        if (responseResetPassword && responseResetPassword?.status === 200 && !loadingResetPassword) {
            setSuccessMessage(t('passwordResetSuccessfully'));
            setTimeout(() => {
                setLoginStep('login');
                setNewPassword('');
                setConfirmPassword('');
                setOtp('');
            }, 2000);
        }
    }, [responseResetPassword, loadingResetPassword, t])

    // Validate email format
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // Validate phone number format
    const validatePhone = (phone) => {
        const re = /^[+]?[0-9]{10,15}$/;
        return re.test(phone);
    };

    // Handle login form submission - MODIFIED TO SUPPORT EMAIL OR PHONE
    const handleLogin = async (e) => {
        e.preventDefault();

        setErrors({});

        // 1. Determine if the input is an email or a phone number
        const isEmailInput = validateEmail(identifier);
        const isPhoneInput = validatePhone(identifier);

        // Validation
        const newErrors = {};

        // Check if the input is EITHER a valid email OR a valid phone
        if (!isEmailInput && !isPhoneInput) {
            newErrors.identifier = t('validEmailOrPhoneRequired'); // Assumes translation key exists
        }
        if (!password) {
            newErrors.password = t('passwordRequired');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // 2. Prepare the final credentials payload
        const credentials = {
            password: password
        };

        if (isEmailInput) {
            credentials.email = identifier;
        } else if (isPhoneInput) {
            credentials.email = identifier;
        }

        // 3. Post the credentials
        postLogin(credentials);
    };

    // Handle forgot password
    const handleForgotPassword = async (e) => {
        e.preventDefault();

        setErrors({});

        // Validation
        const newErrors = {};
        if (verificationMethod === 'email' && !validateEmail(identifier)) { // Using identifier here for input
            newErrors.email = t('validEmailRequired');
        }
        if (verificationMethod === 'phone' && !validatePhone(phone)) {
            newErrors.phone = t('validPhoneRequired');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Update: Use the correct state based on the method
        const valueToSend = verificationMethod === 'email' ? identifier : phone;

        const payload = {
            [verificationMethod]: valueToSend
        };

        postSendOtp(payload);
    };

    // Handle OTP verification
    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        setErrors({});

        if (!otp) {
            setErrors({ otp: t('valid5DigitCodeRequired') });
            return;
        }

        // Use the identifier/phone value set in the previous step
        const valueForOtpCheck = verificationMethod === 'email' ? identifier : phone;

        const payload = {
            email: valueForOtpCheck,
            code: otp
        };

        postVerifyOtp(payload);
    };

    // Handle password reset
    const handleResetPassword = async (e) => {
        e.preventDefault();

        setErrors({});

        // Validation
        const newErrors = {};
        if (!newPassword) {
            newErrors.newPassword = t('newPasswordRequired');
        } else if (newPassword.length < 6) {
            newErrors.newPassword = t('passwordMinLength');
        }

        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = t('passwordsDoNotMatch');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const valueForReset = verificationMethod === 'email' ? identifier : phone;

        const payload = {
            [verificationMethod]: valueForReset,
            password: newPassword,
            code: otp
        };

        postResetPassword(payload);
    };

    // Render appropriate content based on login step
    const renderContent = () => {
        switch (loginStep) {
            case 'login':
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
                                    <p className="text-white">{t('deliciousMealsDelivered')}</p>
                                </div>

                                {/* Decorative elements */}
                                <div className="absolute w-16 h-16 rounded-full top-10 left-10 bg-white/10"></div>
                                <div className="absolute w-20 h-20 rounded-full bottom-10 right-10 bg-white/10"></div>
                                <div className="absolute w-10 h-10 rounded-full top-1/3 right-6 bg-white/5"></div>
                            </div>

                            {/* Right side - Form */}
                            <div className="flex flex-col justify-center w-full p-8 bg-white md:w-3/5 md:p-12">
                                <div className="mb-8 text-center">
                                    <h1 className="mb-2 text-3xl font-bold text-secoundColor">{t('welcomeBack')}</h1>
                                    <p className="text-secoundColor">{t('signInToContinue')} {`${selectedLanguage === "en" ? mainData?.name : mainData?.ar_name}`}</p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-5">
                                    <div>
                                        <label className={` mb-2 text-sm font-medium text-gray-700`} >{t('emailOrPhone')}</label>
                                        <div className="relative">
                                            <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                                                <FaUser className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text" // Changed type from email to text
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)} // Using new 'identifier' state
                                                placeholder={t('enterYourEmailOrPhone')} // Updated placeholder
                                                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border ${errors.identifier ? 'border-secoundColor' : 'border-gray-300'} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200`}
                                            />
                                        </div>
                                        {errors.identifier && <p className="mt-1 text-sm text-secoundColor">{errors.identifier}</p>}
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700">{t('password')}</label>
                                        <div className="relative">
                                            <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                                                <FaLock className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={t('enterYourPassword')}
                                                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border ${errors.password ? 'border-secoundColor' : 'border-gray-300'} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200`}
                                            />
                                        </div>
                                        {errors.password && <p className="mt-1 text-sm text-secoundColor">{errors.password}</p>}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            className="text-sm font-medium transition-colors text-secoundColor hover:text-mainColor"
                                            onClick={() => setLoginStep('forgot')}
                                        >
                                            {t('forgotPassword')}
                                        </button>
                                    </div>

                                    {errors.general && (
                                        <div className="p-3 text-sm rounded-lg bg-thirdColor text-secoundColor">
                                            {errors.general}
                                        </div>
                                    )}

                                    {successMessage && (
                                        <div className="p-3 text-sm text-green-700 rounded-lg bg-green-50">
                                            {successMessage}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="flex items-center justify-center w-full px-4 py-3 font-bold text-white transition duration-200 rounded-lg shadow-md bg-mainColor hover:bg-secoundColor hover:shadow-lg"
                                        disabled={loadingLogin}
                                    >
                                        {loadingLogin ? (
                                            <>
                                                <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {t('loggingIn')}
                                            </>
                                        ) : t('login')}
                                    </button>
                                </form>

                                <div className="mt-8 text-center">
                                    <p className="text-sm text-gray-600">
                                        {t('dontHaveAccount')}{' '}
                                        <Link to="/signup" className="font-medium text-secoundColor hover:text-mainColor">
                                            {t('signUp')}
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'forgot':
                return (
                    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-thirdColor to-mainColor">
                        <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
                            <button
                                onClick={() => setLoginStep('login')}
                                className={`flex items-center text-secoundColor hover:text-mainColor mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                <FaArrowLeft className={isRTL ? 'ml-2' : 'mr-2'} /> {t('backToLogin')}
                            </button>

                            <div className="mb-8 text-center">
                                <div className="flex justify-center mb-4">
                                    <TbPasswordUser className="w-12 h-12 text-mainColor" />
                                </div>
                                <h1 className="mb-2 text-2xl font-bold text-secoundColor">{t('resetPassword')}</h1>
                                <p className="text-secoundColor">{t('enterVerificationMethod', { method: verificationMethod })}</p>
                            </div>

                            <form onSubmit={handleForgotPassword}>
                                {verificationMethod === 'email' ? (
                                    <div className="mb-6">
                                        <label className={`w-full flex mb-2 text-sm font-medium text-gray-700 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                                            <p>{t('emailAddress')}</p>
                                        </label>
                                        <div className="relative">
                                            <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                                                <FaEnvelope className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                value={identifier} // Using 'identifier' here too
                                                onChange={(e) => setIdentifier(e.target.value)} // Using 'identifier' here too
                                                placeholder={t('enterYourEmail')}
                                                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border ${errors.email ? 'border-secoundColor' : 'border-gray-300'} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200`}
                                            />
                                        </div>
                                        {errors.email && <p className="mt-1 text-sm text-secoundColor">{errors.email}</p>}
                                    </div>
                                ) : (
                                    <div className="mb-6">
                                        <label className="block mb-2 text-sm font-medium text-gray-700">{t('phoneNumber')}</label>
                                        <div className="relative">
                                            <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                                                <FaPhone className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder={t('enterYourPhone')}
                                                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border ${errors.phone ? 'border-secoundColor' : 'border-gray-300'} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200`}
                                            />
                                        </div>
                                        {errors.phone && <p className="mt-1 text-sm text-secoundColor">{errors.phone}</p>}
                                    </div>
                                )}

                                {errors.general && (
                                    <div className="p-3 mb-4 text-sm rounded-lg bg-thirdColor text-secoundColor">
                                        {errors.general}
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="p-3 mb-4 text-sm text-green-700 rounded-lg bg-green-50">
                                        {successMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="flex items-center justify-center w-full px-4 py-3 font-medium text-white transition duration-200 rounded-lg shadow-md bg-mainColor hover:bg-secoundColor"
                                    disabled={loadingSendOtp}
                                >
                                    {loadingSendOtp ? (
                                        <>
                                            <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('sending')}
                                        </>
                                    ) : t('sendVerificationCode')}
                                </button>
                            </form>
                        </div>
                    </div>
                );

            case 'otp':
                return (
                    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-thirdColor to-mainColor">
                        <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
                            <button
                                onClick={() => setLoginStep('forgot')}
                                className={`flex items-center text-secoundColor hover:text-mainColor mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                <FaArrowLeft className={isRTL ? 'ml-2' : 'mr-2'} /> {t('back')}
                            </button>

                            <div className="mb-8 text-center">
                                <div className="flex justify-center mb-4">
                                    <MdEmail className="w-12 h-12 text-mainColor" />
                                </div>
                                <h1 className="mb-2 text-2xl font-bold text-secoundColor">{t('verificationCode')}</h1>
                                <p className="text-secoundColor">{t('verificationCodeSentTo', { method: verificationMethod })}</p>
                            </div>

                            <form onSubmit={handleVerifyOtp}>
                                <div className="mb-6">
                                    <div className={` flex ${isRTL ? " justify-start" : " justify-end"}`} >
                                        <label className={` mb-2 text-sm font-medium text-gray-700  `}  >{t('verificationCode')}</label>
                                    </div>
                                    <div className="relative">
                                        <InputOtp
                                            value={otp}
                                            onChange={(e) => setOtp(e.value)}
                                            length={5}
                                            integerOnly
                                            inputTemplate={customInput}
                                        />
                                    </div>
                                    {errors.otp && <p className="mt-1 text-sm text-secoundColor">{errors.otp}</p>}
                                </div>

                                {errors.general && (
                                    <div className="p-3 mb-4 text-sm rounded-lg bg-thirdColor text-secoundColor">
                                        {errors.general}
                                    </div>
                                )}

                                {successMessage && (
                                    <div className={`p-3 mb-4 text-sm text-green-700 rounded-lg bg-green-50 flex ${isRTL ? " justify-start" : " justify-end"}`}>
                                        <p> {successMessage}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="flex items-center justify-center w-full px-4 py-3 font-medium text-white transition duration-200 rounded-lg shadow-md bg-mainColor hover:bg-secoundColor"
                                    disabled={loadingVerifyOtp}
                                >
                                    {loadingVerifyOtp ? (
                                        <>
                                            <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('verifying')}
                                        </>
                                    ) : t('verifyCode')}
                                </button>

                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-600">
                                        {t('didntReceiveCode')}{' '}
                                        <button type="button" className="font-medium text-secoundColor hover:text-mainColor">
                                            {t('resend')}
                                        </button>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            case 'newPassword':
                return (
                    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-thirdColor to-mainColor">
                        <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
                            <button
                                onClick={() => setLoginStep('otp')}
                                className={`flex items-center text-secoundColor hover:text-mainColor mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                <FaArrowLeft className={isRTL ? 'ml-2' : 'mr-2'} /> {t('back')}
                            </button>

                            <div className="mb-8 text-center">
                                <div className="flex justify-center mb-4">
                                    <MdOutlinePassword className="w-12 h-12 text-mainColor" />
                                </div>
                                <h1 className="mb-2 text-2xl font-bold text-secoundColor">{t('setNewPassword')}</h1>
                                <p className="text-secoundColor">{t('enterNewPassword')}</p>
                            </div>

                            <form onSubmit={handleResetPassword}>
                                <div className="mb-4">
                                    <label className="block mb-2 text-sm font-medium text-gray-700">{t('newPassword')}</label>
                                    <div className="relative">
                                        <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                                            <FaLock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder={t('enterNewPassword')}
                                            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border ${errors.newPassword ? 'border-secoundColor' : 'border-gray-300'} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200`}
                                        />
                                    </div>
                                    {errors.newPassword && <p className="mt-1 text-sm text-secoundColor">{errors.newPassword}</p>}
                                </div>

                                <div className="mb-6">
                                    <label className="block mb-2 text-sm font-medium text-gray-700">{t('confirmNewPassword')}</label>
                                    <div className="relative">
                                        <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                                            <FaLock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder={t('confirmNewPassword')}
                                            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-lg border ${errors.confirmPassword ? 'border-secoundColor' : 'border-gray-300'} focus:ring-2 focus:ring-thirdColor focus:border-mainColor outline-none transition duration-200`}
                                        />
                                    </div>
                                    {errors.confirmPassword && <p className="mt-1 text-sm text-secoundColor">{errors.confirmPassword}</p>}
                                </div>

                                {errors.general && (
                                    <div className="p-3 mb-4 text-sm rounded-lg bg-thirdColor text-secoundColor">
                                        {errors.general}
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="p-3 mb-4 text-sm text-green-700 rounded-lg bg-green-50">
                                        {successMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="flex items-center justify-center w-full px-4 py-3 font-medium text-white transition duration-200 rounded-lg shadow-md bg-mainColor hover:bg-secoundColor"
                                    disabled={loadingResetPassword}
                                >
                                    {loadingResetPassword ? (
                                        <>
                                            <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('resettingPassword')}
                                        </>
                                    ) : t('resetPassword')}
                                </button>
                            </form>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return renderContent();
};

export default LoginPage;