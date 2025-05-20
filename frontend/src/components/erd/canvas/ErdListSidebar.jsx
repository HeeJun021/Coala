import React, { useState } from "react";
import CreateErdModal from "./CreateErdModal"; // ← 추가

const ErdListSidebar = ({ onClose }) => {
  const [showModal, setShowModal] = useState(false);

  const handleCreateErd = (newErd) => {
    console.log("🆕 새 ERD 생성됨:", newErd);
    // TODO: DB에 저장하거나 상태 업데이트
  };

  const erdList = [
    { id: 1, name: "온라인 쇼핑몰 ERD" },
    { id: 2, name: "커뮤니티 시스템 ERD" },
    { id: 3, name: "회원 인증 시스템 ERD" },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 h-full w-64 bg-[#1f1f2b] text-white shadow-lg z-50 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <span className="text-lg font-bold">🧭 ERD 목록</span>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-white">✖</button>
        </div>

        {/* 리스트 */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {erdList.map((erd) => (
            <div
              key={erd.id}
              className="cursor-pointer px-3 py-2 bg-[#2a2a3c] rounded hover:bg-[#3a3a4c]"
            >
              📄 {erd.name}
            </div>
          ))}
        </div>

        {/* 하단: 새 ERD 생성 버튼 */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold"
          >
            + 새 ERD 만들기
          </button>
        </div>
      </div>

      {showModal && (
        <CreateErdModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateErd}
        />
      )}
    </>
  );
};

export default ErdListSidebar;
