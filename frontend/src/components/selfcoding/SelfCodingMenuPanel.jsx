import React, { useRef, useEffect } from "react";

const SelfCodingMenuPanel = ({ onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute top-[70px] left-[48px] z-50 bg-white border border-gray-300 shadow-md rounded w-40"
    >
      {["File", "Edit", "View", "Go", "Run", "Terminal", "Help"].map((item) => (
        <div
          key={item}
          className="px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
          onClick={onClose}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

export default SelfCodingMenuPanel;