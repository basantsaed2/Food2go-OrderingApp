import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

export const useCurrency = () => {
    const { t } = useTranslation();
    const maintenance = useSelector(state => state.maintenance?.data);
    
    return maintenance?.currency?.currancy_name || maintenance?.currency?.name || t('egp');
};
