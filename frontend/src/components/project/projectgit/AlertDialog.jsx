import React from 'react';

const AlertDialog = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'alert', // 'alert' 또는 'confirm'
  onConfirm, 
  confirmText = '확인',
  cancelText = '취소'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onClose();
    if (onConfirm) onConfirm();
  };

  const isConfirm = type === 'confirm';
  const headerColor = isConfirm ? 'text-blue-600' : 'text-red-600';
  const confirmButtonClass = isConfirm ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className={`text-xl font-semibold mb-4 text-center text-black`}>
          {title}
        </h2>
        
        <p className="text-gray-700 mb-6 text-base text-center whitespace-pre-line">
          {message}
        </p>

        <div className={`flex justify-end gap-2 ${isConfirm ? 'justify-between' : 'justify-center'}`}>
          {isConfirm && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;