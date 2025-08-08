import React, { useState, useEffect, useCallback, useRef } from "react";
import CreateErdModal from "./CreateErdModal";
import DeleteErdModal from "./DeleteErdModal";
import { createErd, getErds, deleteErd } from "../../../api/erd/erdApi";
import { useParams, useNavigate } from "react-router-dom";
import { Folder, FileText, PlusCircle, Trash2, X } from "lucide-react";
import dayjs from "dayjs";

const ErdListSidebar = ({ isOpen = true, onClose }) => {
  const [showModal, setShowModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedErdId, setSelectedErdId] = useState(null);
  const [selectedErdName, setSelectedErdName] = useState("");
  const [erdList, setErdList] = useState([]);
  const [sidebarWidth, setSidebarWidth] = useState(270);

  const sidebarRef = useRef(null);
  const isResizing = useRef(false);
  const { projectId } = useParams();
  const navigate = useNavigate();

  const fetchErdList = useCallback(async () => {
    try {
      const data = await getErds(projectId);
      const sorted = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setErdList(sorted);
    } catch (err) {
      console.error("ERD 목록 불러오기 실패:", err);
    }
  }, [projectId]);

  useEffect(() => {
    fetchErdList();
  }, [fetchErdList]);

  const handleCreateErd = async (erdData) => {
    try {
      await createErd(projectId, erdData);
      setShowModal(false);
      fetchErdList();
    } catch (err) {
      console.error("ERD 생성 실패:", err);
      alert("ERD 생성 중 오류가 발생했습니다.");
    }
  };

  const openDeleteModal = (erdId, erdName, e) => {
    e.stopPropagation();
    setSelectedErdId(erdId);
    setSelectedErdName(erdName);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteErd(projectId, selectedErdId);
      fetchErdList();
    } catch (err) {
      console.error("ERD 삭제 실패:", err);
      alert("ERD 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedErdId(null);
      setSelectedErdName("");
    }
  };

  // 드래그 관련
  const handleMouseDown = () => {
    isResizing.current = true;
  };

  const handleMouseMove = (e) => {
    if (isResizing.current) {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 500) {
        setSidebarWidth(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={sidebarRef}
        style={{ width: sidebarWidth }}
        className="fixed top-0 left-0 h-full bg-[#1f1f2b] text-white shadow-lg z-50 flex flex-col"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Folder size={20} className="text-yellow-400" />
            ERD 목록
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-400 transition"
              title="닫기"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {erdList.map((erd) => (
            <div
              key={erd.erd_id}
              className="group cursor-pointer px-3 py-2 bg-[#2a2a3c] rounded hover:bg-[#3a3a4c] flex items-center justify-between"
              onClick={() => navigate(`/team-project/${projectId}/erd/${erd.erd_id}`)}
            >
              <div className="flex items-center gap-2 w-[70%] overflow-hidden">
                <FileText size={16} className="text-blue-400" />
                <span className="truncate">{erd.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {dayjs(erd.created_at).format("YY.MM.DD")}
                </span>
                <button
                  onClick={(e) => openDeleteModal(erd.erd_id, erd.name, e)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  title="삭제"
                >
                  <Trash2 size={16} />
                </button>
              </div>
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

        {/* 리사이징 핸들러 */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-gray-500 opacity-0 hover:opacity-50 transition"
        />
      </div>

      {/* 생성 모달 */}
      {showModal && (
        <CreateErdModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateErd}
        />
      )}

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <DeleteErdModal
          erdName={selectedErdName}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
};

export default ErdListSidebar;
