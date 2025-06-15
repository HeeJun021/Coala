import React, { useEffect, useState, useCallback } from "react";
import DocCard from "./DocCard";
import CreateDocModal from "./CreateDocModal";
import {
  getDocuments,
  createDocument,
  deleteDocument,
} from "../../api/documentApi";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

const DocsListPanel = ({ project }) => {
  const projectId = project?.project_id;
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      // ✅ doc_id로 navigate
      navigate(`/team-project/${projectId}/doc/${newDoc.doc_id}`);
    } catch (err) {
      console.error("문서 생성 실패", err);
      alert("문서 생성에 실패했습니다.");
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteDocument(projectId, docId);
      await fetchDocs();
    } catch (err) {
      console.error("문서 삭제 실패", err);
      alert("삭제에 실패했습니다.");
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {docs.map((doc) => (
        <DocCard
          key={doc.doc_id} // ✅ key 수정 완료
          doc={doc}
          onDelete={() => handleDelete(doc.doc_id)}
        />
      ))}

      <button
        onClick={() => setShowCreateModal(true)}
        className="flex flex-col justify-center items-center border border-dashed border-gray-400 rounded-lg hover:border-blue-500 hover:bg-blue-50 py-10"
      >
        <Plus size={28} className="text-blue-500" />
        <span className="mt-2 text-sm text-blue-600">새 문서 만들기</span>
      </button>

      {showCreateModal && (
        <CreateDocModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};

export default DocsListPanel;
