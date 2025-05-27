import React, { useState, useEffect, useCallback } from "react";
import CreateErdModal from "./CreateErdModal";
import { createErd, getErds } from "../../../api/erd/erdApi"; // ✅ API 임포트
import { useParams, useNavigate } from "react-router-dom";

const ErdListSidebar = ({ onClose }) => {
  const [showModal, setShowModal] = useState(false);
  const [erdList, setErdList] = useState([]); // ✅ 동적 목록 상태

  const { projectId } = useParams(); // ✅ URL 파라미터로 projectId 사용
  const navigate = useNavigate();

  const fetchErdList = useCallback(async () => {
  try {
    const data = await getErds(projectId);
    setErdList(data);
  } catch (err) {
    console.error("ERD 목록 불러오기 실패:", err);
  }
}, [projectId]);


  useEffect(() => {
  fetchErdList();
}, [fetchErdList]);


  const handleCreateErd = async (erdData) => {
  try {
    const newErd = await createErd(projectId, erdData); // ✅ 실제 생성
    console.log("🆕 새 ERD 생성됨:", newErd);
    setShowModal(false); // 모달 닫기
    fetchErdList(); // 목록 갱신
  } catch (err) {
    console.error("ERD 생성 실패:", err);
    alert("ERD 생성 중 오류가 발생했습니다.");
  }
};


  return (
    <>
      <div className="fixed top-0 left-0 h-full w-64 bg-[#1f1f2b] text-white shadow-lg z-50 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <span className="text-lg font-bold">🧭 ERD 목록</span>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-white">
            ✖
          </button>
        </div>

        {/* 리스트 */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {erdList.map((erd) => (
            <div
              key={erd.erd_id}
              className="cursor-pointer px-3 py-2 bg-[#2a2a3c] rounded hover:bg-[#3a3a4c]"
              onClick={() => navigate(`/team-project/${projectId}/erd/${erd.erd_id}`)}

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
