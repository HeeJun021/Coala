import React from "react";

const TaskDetailModal = ({ task, onClose, onDelete }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[500px] max-h-[90vh] overflow-y-auto shadow-xl p-6 relative">

<div className="flex justify-between items-center mb-6">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-2xl"
          >
            &times;
          </button>
          <button
            onClick={() => {
              if (window.confirm("정말 이 작업을 삭제하시겠습니까?")) {
                onDelete(task.task_id); // ✅ [추가] onDelete prop 호출
              }
            }}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            작업 삭제
          </button>
        </div>

        <div className="mb-6">
         <h2 className="text-2xl font-bold">{task.title}</h2>
        </div>

        <p className="text-sm text-gray-500 mb-2">
          📁 프로젝트:{" "}
          <span className="text-black font-medium">{task.project_name}</span>
        </p>

        <p className="text-sm text-gray-500 mb-2">
          📅 시작일: <span className="text-black font-medium">{task.start_date || "미정"}</span>
        </p>

        <p className="text-sm text-gray-500 mb-2">
          📅 마감일: <span className="text-black font-medium">{task.due_date || "미정"}</span>
        </p>

        <p className="text-sm text-gray-500 mb-2">
          🚦 상태: <span className="text-black font-medium">{task.status}</span>
        </p>

        <p className="text-sm text-gray-500 mb-2">
          🔥 우선순위: <span className="text-black font-medium">{task.priority}</span>
        </p>

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