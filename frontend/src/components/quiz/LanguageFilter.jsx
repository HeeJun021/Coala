import React, { useState } from "react";

/**
 * @param {{onSelectLanguage: (id: number | null) => void}} props
 */
export default function LanguageFilter({ onSelectLanguage }) {
  // 언어 하드코딩: DB 대신 직접 정의
  const languages = [
    { id: null, label: "전체" },
    { id: 1, label: "HTML" },
    { id: 2, label: "CSS" },
    { id: 3, label: "JavaScript" },
    { id: 4, label: "Python" },
  ];

  const [activeId, setActiveId] = useState(null);

  const handleSelect = (id) => {
    setActiveId(id);
    onSelectLanguage?.(id);
  };

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {languages.map((lang) => {
        const isActive = activeId === lang.id;
        return (
          <button
            key={lang.id ?? "all"}
            onClick={() => handleSelect(lang.id)}
            className={[
              "px-3 py-1.5 rounded-full border text-sm transition-all",
              isActive
                ? "bg-green-600 text-white border-green-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:border-green-500",
            ].join(" ")}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
