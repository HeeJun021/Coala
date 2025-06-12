import React from "react";
import { Play } from "lucide-react";

const CodingTestTabMenu = ({
  activeTab,
  setActiveTab,
  fetchSubmissions,
  language,
  handleLanguageChange,
  handleRunCode,
  isRunning,
  problem,
}) => {
  return (
    <div className="flex justify-between items-center border-b border-gray-200 bg-gray-50 px-6 py-2">
      {/* 좌측 탭 버튼들 */}
      <div className="flex gap-4 items-center">
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
      </div>

      {/* 우측: 실행 버튼 + 언어 선택 */}
      {activeTab !== "notes" && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCode}
            disabled={!problem || isRunning}
            className={`flex items-center gap-1 text-xs px-3 py-2 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition ${
              !problem || isRunning ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Play size={14} color="#4f46e5" strokeWidth={2.5} />
            테스트케이스 실행
          </button>

          <select
            className="h-[36px] border border-gray-300 rounded px-2 text-sm text-gray-700 bg-white hover:border-gray-400 transition"
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
