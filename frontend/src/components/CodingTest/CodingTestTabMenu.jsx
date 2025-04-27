import React from "react";

const CodingTestTabMenu = ({
  activeTab,
  setActiveTab,
  fetchSubmissions,
  language,
  handleLanguageChange,
}) => {
  return (
    <div className="flex gap-4 border-b border-gray-600 px-6">
      {["info", "submissions", "notes"].map((tab) => (
        <button
          key={tab}
          onClick={() => {
            setActiveTab(tab);
            if (tab === "submissions" || tab === "notes") {
              fetchSubmissions();
            }
          }}
          className={`py-3 ${
            activeTab === tab ? "border-b-2 border-white font-semibold" : ""
          }`}
        >
          {tab === "info"
            ? "문제 정보"
            : tab === "submissions"
            ? "제출 내역"
            : "오답노트"}
        </button>
      ))}
      {activeTab !== "notes" && (
        <div className="text-sm flex items-center gap-2 ml-auto">
          <select
            className="bg-[#4b5b6e] text-sm px-2 py-1 rounded text-white"
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default CodingTestTabMenu;
