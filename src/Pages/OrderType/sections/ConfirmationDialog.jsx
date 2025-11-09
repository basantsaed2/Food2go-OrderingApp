import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { PiWarningCircle } from 'react-icons/pi';

const ConfirmationDialog = ({ isOpen, onConfirm, onCancel, message }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onCancel} className="relative z-10">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-4">
          <DialogPanel className="w-full max-w-sm bg-white shadow-lg rounded-xl">
            <div className="flex flex-col items-center px-6 py-6">
              <PiWarningCircle size="50" className="mb-3 text-mainColor" />
              <div className="text-center text-gray-800">{message}</div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-4">
              <button
                className="px-4 py-2 text-sm text-white transition rounded-lg bg-mainColor hover:bg-mainColor/90"
                onClick={onConfirm}
              >
                {t('delete')}
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-700 transition bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {t('cancel')}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

ConfirmationDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  message: PropTypes.node.isRequired,
};

export default ConfirmationDialog;