import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TiptapEditor from "../components/project/TiptapEditorWithPagination";
import { ChevronLeft } from "lucide-react";

const ProjectDocPage = () => {
  const { id: projectId, docId } = useParams();
  const navigate = useNavigate();
  const [docTitle, setDocTitle] = useState("문서 제목");
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(docTitle);

  useEffect(() => {
    // ✅ docId로 문서 불러오는 API 연동 예정
    // setDocTitle("불러온 문서 제목");
  }, [docId]);

  const handleTitleSubmit = () => {
    setDocTitle(tempTitle);
    setEditingTitle(false);
    // ✅ PATCH /documents/:docId API로 제목 업데이트 가능
  };

  return (
    <div className="h-full flex flex-col">
      {/* ✅ 상단 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/team-project/${projectId}`)}
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

      {/* ✅ 본문 - 여백 제거된 영역 */}
      <div className="flex-1 overflow-y-auto">
        <TiptapEditor />
      </div>
    </div>
  );
};

export default ProjectDocPage;
