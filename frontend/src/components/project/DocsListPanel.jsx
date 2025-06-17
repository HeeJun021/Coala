import React, { useEffect, useState, useCallback } from "react";
import DocCard from "./DocCard";
import CreateDocModal from "./CreateDocModal";
import {
  getDocuments,
  createDocument,
  deleteDocument,
} from "../../api/documentApi";
import { useNavigate } from "react-router-dom";
import { FilePlus } from "lucide-react";

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
    <>
      <div className="p-6 flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {docs.map((doc) => (
            <DocCard
              key={doc.doc_id}
              doc={doc}
              onDelete={() => handleDelete(doc.doc_id)}
            />
          ))}

          {/* ERD 스타일과 동일한 추가 버튼 */}
          <div
            onClick={() => setShowCreateModal(true)}
            className="w-[340px] h-[200px] border border-dashed border-gray-400 rounded-2xl flex flex-col justify-center items-center text-blue-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
          >
            <FilePlus className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">새 문서 만들기</span>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateDocModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
};

export default DocsListPanel;
