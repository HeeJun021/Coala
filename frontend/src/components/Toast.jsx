import React, { useEffect, useState } from "react";

const Toast = ({ message, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 2000); // 2초 후 자동 닫힘
    return () => clearTimeout(timeout);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded shadow-lg z-[9999] text-sm">
      {message}
    </div>
  );
};

export default Toast;
