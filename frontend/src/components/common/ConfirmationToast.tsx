// frontend/src/components/common/ConfirmationToast.tsx
import React from 'react';
import toast from 'react-hot-toast';

interface ConfirmationToastProps {
  toastId: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

const ConfirmationToast: React.FC<ConfirmationToastProps> = ({ toastId, message, onConfirm, onCancel }) => {
  const handleConfirm = () => {
    toast.dismiss(toastId);
    onConfirm();
  };

  const handleCancel = () => {
    toast.dismiss(toastId);
    if (onCancel) onCancel();
  };

  // THE FIX: We only return the inner content now. No wrapper div.
  return (
    <span className="confirmation-toast">
      {message}
      <div className="confirmation-buttons">
        <button className="cancel-button-danger" onClick={handleCancel}>
          Cancel
        </button>
        <button className="confirm-button-danger" onClick={handleConfirm}>
          Delete
        </button>
      </div>
    </span>
  );
};

export default ConfirmationToast;