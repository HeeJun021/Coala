// frontend/src/components/project/DocsListPanel.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import DocCard from "./DocCard";
import CreateDocModal from "./CreateDocModal";
import AlertModal from "../AlertModal";
import {
  getDocuments,
  createDocument,
  deleteDocument,
} from "../../api/documentApi";
import { useNavigate } from "react-router-dom";
import { FilePlus, FileText, Search, X } from "lucide-react";

const DocsListPanel = ({ project }) => {
  const projectId = project?.project_id;
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [deleteTargetDocId, setDeleteTargetDocId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 🔹 검색 + 정렬 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("latest"); // latest | title

  const fetchDocs = useCallback(async () => {
    if (!projectId) return;
    try {
      const result = await getDocuments(projectId);
      setDocs(result);
    } catch (err) {
      console.error("문서 목록 불러오기 실패", err);
    }
  }, [projectId]);

  const handleCreate = async ({ title, description }) => {
    try {
      const newDoc = await createDocument(projectId, { title, description });
      await fetchDocs();
      navigate(`/team-project/${projectId}/doc/${newDoc.doc_id}`);
    } catch (err) {
      console.error("문서 생성 실패", err);
      alert("문서 생성에 실패했습니다.");
    }
  };

  const confirmDelete = (docId) => {
    setDeleteTargetDocId(docId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await deleteDocument(projectId, deleteTargetDocId);
      await fetchDocs();
    } catch (err) {
      console.error("문서 삭제 실패", err);
      alert("삭제에 실패했습니다.");
    } finally {
      setShowDeleteModal(false);
      setDeleteTargetDocId(null);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // 🔹 검색 + 정렬 적용
  const filteredDocs = useMemo(() => {
    let result = [...docs];

    // 검색 필터
    if (searchTerm.trim()) {
      result = result.filter((d) =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 정렬 옵션
    if (sortOption === "latest") {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortOption === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title, "ko"));
    }

    return result;
  }, [docs, searchTerm, sortOption]);

  return (
    <div className="w-full">
      {/* 🔹 헤더 */}
<div className="mt-4 mb-4 px-8">
  <h2 className="text-xl font-bold flex items-center gap-2">
    <FileText size={20} className="text-gray-700" /> 문서 관리
  </h2>
</div>

{/* 🔹 검색 + 정렬 */}
<div className="border-t pt-4 px-8 flex items-center justify-between mb-2">
  {/* 검색바 */}
  <div className="relative w-[400px]">
    <Search
      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      size={18}
    />
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="문서 제목 검색..."
      className="w-full pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
    />
    {searchTerm && (
      <X
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
        size={18}
        onClick={() => setSearchTerm("")}
      />
    )}
  </div>

  {/* 정렬 옵션 */}
  <select
    value={sortOption}
    onChange={(e) => setSortOption(e.target.value)}
    className="border px-3 py-2 rounded-lg"
  >
    <option value="latest">최신순</option>
    <option value="title">ㄱㄴㄷ순</option>
  </select>
</div>

      {/* 🔹 본문 */}
      <div className="pt-6 mt-2">
        {filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-600">
            <p className="text-xl font-medium mb-4">
              검색 결과가 없거나 아직 생성된 문서가 없습니다.
              <br />
              새로운 문서를 추가해보세요!
            </p>
            {/* 중앙 생성 버튼 */}
            <div
              onClick={() => setShowCreateModal(true)}
              className="w-[340px] h-[200px] border border-dashed border-gray-400 rounded-2xl flex flex-col justify-center items-center text-blue-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
            >
              <FilePlus className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">새 문서 만들기</span>
            </div>
          </div>
        ) : (
          <div className="p-6 flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredDocs.map((doc) => (
                <DocCard
                  key={doc.doc_id}
                  doc={doc}
                  onDelete={() => confirmDelete(doc.doc_id)}
                />
              ))}

              {/* 추가 버튼 */}
              <div
                onClick={() => setShowCreateModal(true)}
                className="w-[340px] h-[200px] border border-dashed border-gray-400 rounded-2xl flex flex-col justify-center items-center text-blue-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
              >
                <FilePlus className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">새 문서 만들기</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 생성 모달 */}
      {showCreateModal && (
        <CreateDocModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {/* 삭제 확인 모달 */}
      <AlertModal
        isOpen={showDeleteModal}
        isConfirm
        message="정말 삭제하시겠습니까?"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteTargetDocId(null);
        }}
      />
    </div>
  );
};

export default DocsListPanel;
