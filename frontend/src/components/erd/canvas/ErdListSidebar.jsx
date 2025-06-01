import React, { useState, useEffect, useCallback } from "react";
import CreateErdModal from "./CreateErdModal";
import { createErd, getErds } from "../../../api/erd/erdApi";
import { useParams, useNavigate } from "react-router-dom";
import { X, Folder, FileText, PlusCircle  } from "lucide-react";

const ErdListSidebar = ({ onClose }) => {
  const [showModal, setShowModal] = useState(false);
  const [erdList, setErdList] = useState([]);
  const { projectId } = useParams();
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
      const newErd = await createErd(projectId, erdData);
      console.log("🆕 새 ERD 생성됨:", newErd);
      setShowModal(false);
      fetchErdList();
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
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Folder size={20} className="text-yellow-400" />
            ERD 목록
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {erdList.map((erd) => (
            <div
              key={erd.erd_id}
              className="cursor-pointer px-3 py-2 bg-[#2a2a3c] rounded hover:bg-[#3a3a4c] flex items-center gap-2"
              onClick={() => navigate(`/team-project/${projectId}/erd/${erd.erd_id}`)}
            >
              <FileText size={16} className="text-blue-400" />
              <span className="truncate">{erd.name}</span>
            </div>
          ))}
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold flex items-center justify-center gap-2"
          >
            <PlusCircle size={18} className="text-green-200" />
            새 ERD 만들기
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
