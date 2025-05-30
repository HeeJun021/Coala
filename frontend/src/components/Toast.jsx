import React, { useEffect } from "react";

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      onClose(); // 단순히 상태만 초기화
    }, 2500);
    return () => clearTimeout(timeout);
  }, [onClose]);

  return (
    <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded shadow-lg z-[9999] text-sm">
      {message}
    </div>
  );
};

export default Toast;
