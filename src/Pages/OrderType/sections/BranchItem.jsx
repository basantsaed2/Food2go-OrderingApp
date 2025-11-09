import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const FALLBACK_IMAGE = 'https://via.placeholder.com/80';

const BranchItem = React.memo(({ branch, isSelected, onClick }) => {
  const { t } = useTranslation();

  return (
    <div
      className={`w-full flex items-center justify-start gap-x-3 text-xl font-TextFontRegular px-3 py-3 rounded-xl cursor-pointer transition-all ease-in-out duration-300 ${
        isSelected ? 'text-white bg-mainColor' : 'text-black bg-gray-100 hover:bg-mainColor hover:text-white'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={t('selectBranch', { name: branch.name })}
    >
      <img
        src={branch?.image_link || FALLBACK_IMAGE}
        alt={branch?.name || 'Branch Image'}
        className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover object-center"
        loading="lazy"
        onError={(e) => (e.target.src = FALLBACK_IMAGE)}
      />
      <div className="flex flex-col items-start justify-center">
        <span className="sm:text-lg xl:text-xl font-TextFontRegular">
          {branch.name.charAt(0).toUpperCase() + (branch.name.slice(1) || '')}
        </span>
        <span className="sm:text-xs xl:text-lg font-TextFontRegular text-gray-600 group-hover:text-white">
          {branch.address.charAt(0).toUpperCase() + (branch.address.slice(1) || '')}
        </span>
      </div>
    </div>
  );
});

BranchItem.propTypes = {
  branch: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    phone: PropTypes.string,
    image_link: PropTypes.string,
    status: PropTypes.number,
    block_reason: PropTypes.string,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default BranchItem;