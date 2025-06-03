import React, { useEffect, useState, useCallback } from "react";
import { getDocuments, createDocument } from "../../api/documentApi";
import DocCard from "./DocCard";

const DocsListPanel = ({ projectId, onSelect }) => {
  const [docs, setDocs] = useState([]);

  // ✅ useCallback으로 fetchDocs 정의 → useEffect 의존성 경고 제거
  const fetchDocs = useCallback(async () => {
    try {
      const res = await getDocuments(projectId);
      setDocs(res);
    } catch (err) {
      console.error("문서 목록 가져오기 실패", err);
    }
  }, [projectId]);

  const handleCreate = async () => {
    try {
      const newDoc = await createDocument(projectId, { title: "새 문서", content: "" });
      await fetchDocs();
      onSelect(newDoc.doc_id); // 생성 후 에디터로 이동
    } catch (err) {
      alert("문서 생성 실패");
    }
  };

  // ✅ useEffect 의존성에 fetchDocs 포함
  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-4">
        {docs.map((doc) => (
          <DocCard
            key={doc.doc_id}
            doc={doc}
            onClick={() => onSelect(doc.doc_id)}
            onRefresh={fetchDocs}
          />
        ))}
        <div
          onClick={handleCreate}
          className="w-60 h-40 flex items-center justify-center border-2 border-dashed text-blue-500 hover:bg-gray-50 cursor-pointer rounded-xl"
        >
          + 새 문서 만들기
        </div>
      </div>
    </div>
  );
};

export default DocsListPanel;
