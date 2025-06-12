import React from "react";

const CodingTestTabMenu = ({
  activeTab,
  setActiveTab,
  fetchSubmissions,
  language,
  handleLanguageChange,
}) => {
  return (
    <div className="flex gap-4 items-center border-b border-gray-200 bg-gray-50 px-6">
      {["info", "submissions", "notes"].map((tab) => (
        <button
          key={tab}
          onClick={() => {
            setActiveTab(tab);
            if (tab === "submissions" || tab === "notes") {
              fetchSubmissions();
            }
          }}
          className={`py-3 text-sm transition-all ${
  activeTab === tab
    ? "border-b-2 border-green-600 text-green-700 font-semibold"
    : "text-gray-500 hover:text-gray-700"
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
        <div className="text-sm flex items-center gap-2 ml-auto py-3">
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 bg-white hover:border-gray-400 transition"
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
