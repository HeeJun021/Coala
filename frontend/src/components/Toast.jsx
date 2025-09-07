import React, { useEffect } from "react";

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      onClose();
    }, 2500);
    return () => clearTimeout(timeout);
  }, [onClose]);

  return (
    <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg shadow-lg z-[9999] text-sm">
      {message}
    </div>
  );
};

export default Toast;
