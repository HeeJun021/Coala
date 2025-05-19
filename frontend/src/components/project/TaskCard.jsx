import React from "react";

const TaskCard = ({ task, onClick }) => {
  return (
    <div
      onClick={() => onClick(task)}
      className="flex justify-between items-center bg-white border p-3 rounded shadow-sm cursor-pointer hover:bg-gray-50"
    >
      <div>
        <div className="font-medium text-sm">{task.title}</div>
        <div className="text-xs text-gray-500">{task.project_name}</div>
      </div>
      <div className="text-xs text-gray-400 text-right whitespace-nowrap">
        {task.due_date || "미정"}
      </div>
    </div>
  );
};

export default TaskCard;