import React from "react";

const SnapshotItem = ({ snapshot, onSelect, index, isLast }) => {
  const { snapshot_id, created_at, is_active, user_name } = snapshot;
  const formattedTime = new Date(created_at).toLocaleString();

  return (
    <div className="flex items-start">
      {/* 좌측: 시간 */}
      <div className="flex-1 text-right pr-4 text-sm text-gray-200 pt-2">
        {formattedTime}
      </div>

      {/* 중앙: 버튼 + 아래 여백 */}
      <div className="flex flex-col items-center relative">
        {/* 버튼 */}
        <button
          onClick={() => onSelect(snapshot_id)}
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition
            ${
              is_active
                ? "bg-blue-500 border-blue-300 text-white shadow-md"
                : "bg-neutral-800 border-gray-500 text-gray-200 hover:bg-neutral-700"
            }`}
        >
          {index}
        </button>

        {/* 아래 선 */}
        {!isLast && (
          <div className="w-px h-[32px] bg-gray-400 mt-1" />
        )}
      </div>

      {/* 우측: 유저 */}
      <div className="flex-1 pl-4 text-sm text-gray-200 pt-2 flex items-center gap-1">
        <span className="text-purple-400">👤</span>
        {user_name || "알 수 없음"}
      </div>
    </div>
  );
};

export default SnapshotItem;
