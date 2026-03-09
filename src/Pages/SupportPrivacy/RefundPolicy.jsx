import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // 1. Import useLocation
import { useGet } from '../../Hooks/useGet';
import { useSelector } from 'react-redux';

const RefundPolicy = () => {
    const location = useLocation(); // 2. Get the current route object
    const mainData = useSelector(state => state.mainData?.data);
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const { refetch: refetchData, loading: loadingData, data } = useGet({
        url: `${apiUrl}/customer/home/policies`,
    });

    const [displayData, setDisplayData] = useState(null);
    const [title, setTitle] = useState("");

    useEffect(() => {
        refetchData();
    }, [refetchData]);

    useEffect(() => {
        if (data && data.policies) {
            // 3. Logic to switch data based on the path
            if (location.pathname.includes("delivery_policy")) {
                setDisplayData(data.policies?.delivery_policy);
                setTitle("Delivery & Shipping Policy");
            } else {
                setDisplayData(data.policies?.return_policy);
                setTitle("Refund & Cancellation Policy");
            }
        }
    }, [data, location.pathname]); // Trigger whenever data or route changes

    if (loadingData) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white">
            <h1 className="text-2xl font-bold mb-4">{title}</h1>
            <div className="prose max-w-none">
                {/* Use dangerouslySetInnerHTML if your API returns HTML strings */}
                {displayData ? (
                    <div dangerouslySetInnerHTML={{ __html: displayData }} />
                ) : (
                    <p>No policy details available.</p>
                )}
            </div>
        </div>
    );
};

export default RefundPolicy;