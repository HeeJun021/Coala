import React, { useState } from "react";
import ErdCard from "./ErdCard";
import ErdAddCard from "./ErdAddCard";
import CreateErdModal from "./CreateErdModal";
import { createErd } from "../../../api/erdApi";

const ErdListPanel = ({ erds, onSelect, onRefresh, project }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const safeErds = erds || [];
  const projectId = project?.project_id;

  const handleCreate = async (data) => {
    if (!projectId) {
      alert("project_id를 찾을 수 없습니다.");
      return;
    }

    try {
      await createErd(projectId, data);
      alert("ERD 생성 완료");
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
          <ErdAddCard onClick={() => setShowCreateModal(true)} fullCenter />
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
              onSelect={onSelect}
              onDelete={onRefresh}
              project={project}
            />
          ))}
          <ErdAddCard onClick={() => setShowCreateModal(true)} />
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
