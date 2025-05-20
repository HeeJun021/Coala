import React, { useState } from "react";
import ErdCard from "./ErdCard";
import ErdAddCard from "./ErdAddCard";
import CreateErdModal from "./CreateErdModal"; // 🧩 모달 import

const ErdListPanel = ({ erds, onSelect }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const safeErds = erds || [];

  const handleCreate = (data) => {
    console.log("생성할 ERD:", data);
    // 실제 생성 API 호출 예정이면 여기서 실행
    setShowCreateModal(false);
  };

  // ERD가 없는 경우
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

  // ERD가 있는 경우
  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {safeErds.map((erd) => (
            <ErdCard key={erd.erd_id} erd={erd} onSelect={onSelect} />
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
