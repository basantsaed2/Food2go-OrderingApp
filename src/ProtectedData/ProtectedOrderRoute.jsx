import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../Context/Auth';

const ProtectedOrderRoute = () => {
    const navigate = useNavigate();
    const maintenance = useSelector((state) => state.maintenance);
    const companyInfo = maintenance?.data?.company_info;
    const auth = useAuth();
    const [isToastShown, setIsToastShown] = useState(false);

    useEffect(() => {
        // Wait for data to load if needed, but if we have data and it's 0, redirect
        if (maintenance?.data && companyInfo?.order_online === 0) {
            if (!isToastShown) {
                auth.toastError('Online ordering is currently disabled.');
                setIsToastShown(true);
            }
            navigate('/', { replace: true });
        }
    }, [companyInfo, maintenance, navigate, auth, isToastShown]);

    // Optionally show loader while checking, but for now just render logic
    if (maintenance?.loading) {
        return null; // Or a spinner
    }

    return companyInfo?.order_online === 1 ? <Outlet /> : null;
};

export default ProtectedOrderRoute;
