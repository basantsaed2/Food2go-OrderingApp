import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import '@splidejs/react-splide/css';
import Banners from './Sections/Banners';
import Categories from './Sections/Categories';
import RecommendedProduct from './Sections/RecommendedProduct';
import OffersProducts from './Sections/OffersProducts';

const Home = () => {
  const { t } = useTranslation();
  const orderType = useSelector((state) => state.orderType?.orderType);
  const selectedAddressId = useSelector((state) => state.orderType?.selectedAddressId);
  const selectedBranchId = useSelector((state) => state.orderType?.selectedBranchId);
  const addresses = useSelector((state) => state.addresses?.data || []);
  const branches = useSelector((state) => state.branches?.data || []);

  const getSelectedLocationInfo = () => {
    if (orderType === 'delivery' && selectedAddressId) {
      const address = addresses.find(addr => addr.id === selectedAddressId);
      return address ? `Delivery to: ${address.address}` : 'Delivery address selected';
    } else if (orderType === 'take_away' && selectedBranchId) {
      const branch = branches.find(br => br.id === selectedBranchId);
      return branch ? `Pickup from: ${branch.name}` : 'Branch selected';
    }
    return null;
  };

  const locationInfo = getSelectedLocationInfo();

  return (
    <div className="flex flex-col items-center w-screen">
      <Banners />
      <Categories />
      <RecommendedProduct />
      <OffersProducts />
    </div>
  );
};

export default Home;