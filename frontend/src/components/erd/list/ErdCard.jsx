import React from "react";
import { useNavigate } from "react-router-dom";
import { Pin, Trash2, CalendarDays, Table, History } from "lucide-react";
import { deleteErd } from "../../../api/erd/erdApi";

const ErdCard = ({ erd, onDelete, project }) => {
  const navigate = useNavigate();
  const projectId = project?.project_id || erd.project_id;

  const handleDelete = async (e) => {
    e.stopPropagation();
    const confirmed = window.confirm(`"${erd.name}" ERD를 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      await deleteErd(projectId, erd.erd_id);
      alert("삭제 완료");
      onDelete?.();
    } catch (error) {
      console.error("ERD 삭제 실패", error);
      alert("삭제 실패");
    }
  };

  const handleClick = () => {
    navigate(`/team-project/${projectId}/erd/${erd.erd_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="w-[340px] h-[200px] border border-gray-300 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between"
    >
      {/* 상단 헤더 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 truncate">
            <Pin size={18} className="text-red-500" />
            <span className="text-base font-semibold text-gray-800 truncate">
              {erd.name}
            </span>
          </div>
          <Trash2
            size={18}
            className="text-gray-400 hover:text-red-500 transition"
            onClick={handleDelete}
          />
        </div>
        <hr className="my-2 border-gray-200" />
      </div>

      {/* 하단 정보 + 설명 포함 */}
      <div className="text-sm text-gray-700 flex flex-col justify-between flex-1">
        <div
          className={`flex flex-col ${
            !erd.description ? "gap-6 pb-2" : "gap-2"
          }`}
        >
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-blue-500" />
            <span>
              <span className="font-medium">생성일:</span> {erd.created_at}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Table size={16} className="text-green-600" />
            <span>
              <span className="font-medium">테이블 수:</span> {erd.table_count}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <History size={16} className="text-purple-500" />
            <span className="truncate">
              <span className="font-medium">마지막 수정:</span> {erd.updated_at}
              {erd.updated_by && ` (${erd.updated_by})`}
            </span>
          </div>
        </div>

        {/* 설명 */}
        {erd.description && (
          <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 leading-snug line-clamp-3">
            {erd.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErdCard;
