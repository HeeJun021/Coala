import React from "react";
import { useNavigate } from "react-router-dom"; // ✅ 추가
import { FaThumbtack } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { AiOutlineCalendar, AiOutlineDatabase } from "react-icons/ai";
import { BsClockHistory } from "react-icons/bs";
import { deleteErd } from "../../../api/erd/erdApi";

const ErdCard = ({ erd, onDelete, project }) => {
  const navigate = useNavigate(); // ✅ 추가
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
    navigate(`/team-project/${projectId}/erd/${erd.erd_id}`); // ✅ ERD 상세 페이지로 이동
  };

  return (
    <div
      className="w-[340px] h-[200px] border rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition bg-white"
      onClick={handleClick} // ✅ 클릭 시 이동
    >
      <div className="flex justify-between items-center font-semibold text-sm mb-2">
        <div className="flex items-center gap-2">
          <FaThumbtack className="text-red-500" />
          <span className="text-base font-bold truncate">{erd.name}</span>
        </div>
        <MdDelete
          className="text-gray-400 hover:text-red-500 text-lg"
          onClick={handleDelete}
        />
      </div>
      <hr className="my-2" />

      {/* 아래 정보 영역 전체 높이에서 1/3씩 균등 분배 */}
      <div className="flex flex-col justify-between h-[100px] text-sm text-gray-700 font-medium">
        {/* 생성일 */}
        <div className="flex items-center gap-2 flex-1">
          <AiOutlineCalendar />
          <span>
            <span className="font-semibold text-gray-800">생성일:</span>{" "}
            <span className="font-normal">{erd.created_at}</span>
          </span>
        </div>

        {/* 테이블 수 */}
        <div className="flex items-center gap-2 flex-1">
          <AiOutlineDatabase />
          <span>
            <span className="font-semibold text-gray-800">테이블 수:</span>{" "}
            <span className="font-normal">{erd.table_count}</span>
          </span>
        </div>

        {/* 마지막 수정 */}
        <div className="flex items-center gap-2 flex-1">
          <BsClockHistory />
          <span>
            <span className="font-semibold text-gray-800">마지막 수정:</span>{" "}
            <span className="font-normal">
              {erd.updated_at}
              {erd.updated_by && ` (${erd.updated_by})`}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ErdCard;
