import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, HelpCircle } from "lucide-react";
import CodingTestGuideModal from "./modal/CodingTestGuideModal"; // ✅ 모달 컴포넌트 import

const CodingTestHeader = ({ title }) => {
  const [showDot, setShowDot] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false); // ✅ 모달 상태

  useEffect(() => {
    const seen = localStorage.getItem("codingtest_guide_seen");
    setShowDot(seen !== "true");
  }, []);

  const handleOpenGuide = () => {
    setIsGuideOpen(true); // ✅ 모달 열기
    setShowDot(false);
    localStorage.setItem("codingtest_guide_seen", "true");
  };

  const handleCloseGuide = () => {
    setIsGuideOpen(false); // ✅ 모달 닫기
  };

  return (
    <>
      <header className="flex items-center justify-between bg-gray-100 border-b border-gray-300 px-6 py-3">
        {/* 왼쪽: 뒤로가기 + 제목 */}
        <div className="flex items-center gap-3">
          <Link
            to="/codingtest"
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        </div>

        {/* 오른쪽: 가이드 버튼 */}
        <button
          onClick={handleOpenGuide}
          className="relative text-sm text-black flex items-center gap-1 hover:text-gray-600"
        >
          <HelpCircle size={20} className="text-gray-500" />

          {showDot && (
            <div
              className="absolute top-0.5 -right-2.5 w-[8px] h-[8px] bg-rose-600 rounded-full shadow-md"
              style={{ transform: "translateY(-50%)" }}
            />
          )}
        </button>
      </header>

      {/* ✅ 가이드 모달 렌더 */}
      {isGuideOpen && <CodingTestGuideModal isOpen={isGuideOpen} onClose={handleCloseGuide} />}
    </>
  );
};

export default CodingTestHeader;
