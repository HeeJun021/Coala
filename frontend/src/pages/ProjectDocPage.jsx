// 파일: src/pages/ProjectDocPage.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TiptapEditor from "../components/project/TiptapEditorWithPagination";
import { ChevronLeft } from "lucide-react";
import { getDocument, updateDocument } from "../api/documentApi";

const ProjectDocPage = () => {
  const { id, docId } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();
  const [docTitle, setDocTitle] = useState("문서 제목");
  const [docContent, setDocContent] = useState("<p>불러오는 중...</p>");
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(docTitle);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        console.log("📥 불러오는 문서:", projectId, docId);
        const data = await getDocument(projectId, docId);

        if (data.content === "<p>불러오는 중...</p>") {
          console.warn("⚠️ 서버에 저장된 내용이 초기값 상태입니다.");
        }

        setDocTitle(data.title);
        setTempTitle(data.title);
        setDocContent(data.content || "<p>내용 없음</p>");
      } catch (err) {
        console.error("문서 불러오기 실패", err);
        setDocContent("<p>문서를 불러올 수 없습니다.</p>");
      }
    };

    fetchDoc();
  }, [docId, projectId]);

  const handleTitleSubmit = async () => {
    try {
      await updateDocument(projectId, docId, { title: tempTitle });
      setDocTitle(tempTitle);
      setEditingTitle(false);
      alert("제목이 저장되었습니다.");
    } catch (err) {
      alert("제목 저장 실패");
      console.error(err);
    }
  };

  const handleGoBack = () => {
    navigate(`/team-project/${projectId}`, {
      state: {
        tab: "overview",
        subTab: "document",
        projectId,
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-black text-sm"
          >
            <ChevronLeft size={18} className="mr-1" />
            뒤로가기
          </button>

          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="border px-2 py-1 rounded text-sm"
              />
              <button
                onClick={handleTitleSubmit}
                className="text-green-600 hover:text-green-700 text-sm"
              >
                저장
              </button>
            </div>
          ) : (
            <h1
              className="text-xl font-semibold cursor-pointer hover:underline"
              onClick={() => {
                setTempTitle(docTitle);
                setEditingTitle(true);
              }}
            >
              {docTitle}
            </h1>
          )}
        </div>
        <div className="text-sm text-gray-400">문서 ID: {docId}</div>
      </div>

      {/* 본문 영역 */}
      <div className="flex-1 overflow-y-auto">
        <TiptapEditor
          projectId={projectId}
          docId={Number(docId)}
          title={docTitle}
          content={docContent}
        />
      </div>
    </div>
  );
};

export default ProjectDocPage;
