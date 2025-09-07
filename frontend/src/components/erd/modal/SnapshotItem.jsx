import React from "react";
import { User2 } from "lucide-react";

const SnapshotItem = ({ snapshot, onSelect, index, isLast }) => {
  const { snapshot_id, created_at, is_active, user_name } = snapshot;
  const formattedTime = new Date(created_at).toLocaleString();

  return (
    <div className="flex items-start text-sm">
      {/* 좌측: 시간 */}
      <div className="flex-1 text-right pr-4 text-gray-500 pt-2">
        {formattedTime}
      </div>

      {/* 중앙: 버튼 + 아래 선 */}
      <div className="flex flex-col items-center relative">
        <button
          onClick={() => onSelect(snapshot_id)}
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition
            ${
              is_active
                ? "bg-blue-500 border-blue-300 text-white shadow-md"
                : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
            }`}
        >
          {index}
        </button>

        {!isLast && <div className="w-px h-[32px] bg-gray-300 mt-1" />}
      </div>

      {/* 우측: 사용자 정보 */}
      <div className="flex-1 pl-4 text-gray-600 pt-2 flex items-center gap-2">
        <User2 size={16} className="text-purple-600" />
        <span className="truncate">{user_name || "알 수 없음"}</span>
      </div>
    </div>
  );
};

export default SnapshotItem;
