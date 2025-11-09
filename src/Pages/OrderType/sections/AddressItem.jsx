import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { MdWork, MdDelete } from 'react-icons/md';
import { FiHome } from 'react-icons/fi';
import StaticSpinner from '../../../Components/Spinners/StaticSpinner';

const AddressItem = React.memo(({ address, isSelected, onSelect, onDelete }) => {
  const { t } = useTranslation();

  return (
    <div
      className={`group w-full flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 shadow-sm ${
        isSelected ? 'bg-mainColor text-white' : 'bg-gray-100 text-black hover:bg-mainColor hover:text-white hover:border-mainColor'
      }`}
      onClick={() => onSelect(address)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(address)}
      aria-label={t('selectAddress', { address: address.address })}
    >
      <div className="flex-shrink-0 p-2 rounded-md bg-mainColor group-hover:bg-mainColor">
        {address.type.toLowerCase() === 'home' ? (
          <FiHome className="w-6 h-6 text-white" />
        ) : (
          <MdWork className="w-6 h-6 text-white" />
        )}
      </div>
      <div className="flex flex-col w-full space-y-1 text-sm">
        <p className="font-semibold line-clamp-1">
          {address.address?.charAt(0).toUpperCase() + (address.address?.slice(1) || '')}
        </p>
        <p className="text-xs line-clamp-1">
          <strong>{t('Bldg')}:</strong> {address.building_num || '-'} |{' '}
          <strong>{t('Floor')}:</strong> {address.floor_num || '-'} |{' '}
          <strong>{t('Apt')}:</strong> {address.apartment || '-'}
        </p>
        <p className="text-xs line-clamp-1">
          <strong>{t('Extra')}:</strong> {address.additional_data || '-'}
        </p>
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200 group-hover:border-white">
          <span className="text-xs font-medium">
            {t('zoneprice')}: {address?.zone?.price || '-'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(address.id);
            }}
            className="transition hover:text-white"
            aria-label={t('deleteAddress')}
            disabled={address.deleting}
          >
            {address.deleting ? <StaticSpinner size="small" /> : <MdDelete size="18" />}
          </button>
        </div>
      </div>
    </div>
  );
});

AddressItem.propTypes = {
  address: PropTypes.shape({
    id: PropTypes.number.isRequired,
    address: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    building_num: PropTypes.string,
    floor_num: PropTypes.string,
    apartment: PropTypes.string,
    additional_data: PropTypes.string,
    zone: PropTypes.shape({
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    deleting: PropTypes.bool,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default AddressItem;