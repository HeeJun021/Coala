import React, { useRef, useEffect } from "react";

const SelfCodingSettingsPanel = ({ onClose }) => {
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
      className="absolute bottom-12 left-[48px] z-50 bg-white border border-gray-300 shadow-md rounded w-40"
    >
      {["Preferences", "Theme", "Keyboard Shortcuts", "Account"].map((item) => (
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

export default SelfCodingSettingsPanel;