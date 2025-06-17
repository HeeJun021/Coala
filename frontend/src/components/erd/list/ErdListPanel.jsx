import React, { useState } from "react";
import ErdCard from "./ErdCard";
import CreateErdModal from "./CreateErdModal";
import { createErd } from "../../../api/erd/erdApi";
import { FolderPlus } from "lucide-react";
import { useNavigate } from "react-router-dom"; // 상단에 추가

const ErdListPanel = ({ erds, onSelect, onRefresh, project }) => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const safeErds = [...(erds || [])].reverse(); // 최신 순 정렬
  const projectId = project?.project_id;

  const handleCreate = async (data) => {
    if (!projectId) {
      alert("project_id를 찾을 수 없습니다.");
      return;
    }

    try {
      await createErd(projectId, data);
      setShowCreateModal(false);
      onRefresh?.();
    } catch (error) {
      alert("ERD 생성 실패");
      console.error(error);
    }
  };

  if (safeErds.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-600">
          <p className="text-xl font-medium mb-4">
            아직 생성된 ERD가 없습니다.
            <br />
            새로운 ERD를 추가해보세요!
          </p>
          <div
            onClick={() => setShowCreateModal(true)}
            className="w-[340px] h-[200px] border border-dashed border-gray-400 rounded-2xl flex flex-col justify-center items-center text-blue-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
          >
            <FolderPlus className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">새 ERD 만들기</span>
          </div>
        </div>

        {showCreateModal && (
          <CreateErdModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreate}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="p-6 flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {safeErds.map((erd) => (
            <ErdCard
              key={erd.erd_id}
              erd={erd}
              onSelect={() => navigate(`/erd/${erd.erd_id}/${projectId}`)}
              onDelete={onRefresh}
              project={project}
            />
          ))}

          {/* 크기 통일된 추가 카드 */}
          <div
            onClick={() => setShowCreateModal(true)}
            className="w-[340px] h-[200px] border border-dashed border-gray-400 rounded-2xl flex flex-col justify-center items-center text-blue-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
          >
            <FolderPlus className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">새 ERD 만들기</span>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateErdModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
};

export default ErdListPanel;
