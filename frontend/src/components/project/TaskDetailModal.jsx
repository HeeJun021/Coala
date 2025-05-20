import React from "react";

const TaskDetailModal = ({ task, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[500px] max-h-[90vh] overflow-y-auto shadow-xl p-6 relative">
        {/* 상단 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
        >
          &times;
        </button>

        {/* 제목 */}
        <h2 className="text-2xl font-bold mb-4">{task.title}</h2>

        {/* 프로젝트명 */}
        <p className="text-sm text-gray-500 mb-2">
          📁 프로젝트: <span className="text-black font-medium">{task.project_name}</span>
        </p>

        {/* 마감일 */}
        <p className="text-sm text-gray-500 mb-2">
          📅 마감일: <span className="text-black font-medium">{task.due_date}</span>
        </p>

        {/* 상태 */}
        <p className="text-sm text-gray-500 mb-2">
          🚦 상태: <span className="text-black font-medium">{task.status}</span>
        </p>

        {/* 우선순위 */}
        <p className="text-sm text-gray-500 mb-2">
          🔥 우선순위: <span className="text-black font-medium">{task.priority}</span>
        </p>

        {/* 협업자 목록 */}
        {task.collaborators && task.collaborators.length > 0 && (
          <div className="text-sm text-gray-500 mb-4">
            👥 협업자: {task.collaborators.map((user) => (
              <span
                key={user.user_id}
                className="inline-block bg-gray-100 text-gray-800 text-xs rounded px-2 py-1 mr-2 mt-1"
              >
                {user.nickname}
              </span>
            ))}
          </div>
        )}

        {/* 설명 */}
        <div className="mt-4">
          <h3 className="font-semibold mb-1">📄 설명</h3>
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {task.description || "(작성된 설명이 없습니다.)"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;