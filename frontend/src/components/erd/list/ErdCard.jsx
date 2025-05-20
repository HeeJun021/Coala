import React from "react";
import { FaThumbtack } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { AiOutlineCalendar, AiOutlineDatabase } from "react-icons/ai";
import { BsClockHistory } from "react-icons/bs";

const ErdCard = ({ erd, onSelect }) => {
  return (
    <div
      className="border rounded-xl p-3 shadow-sm hover:shadow-md cursor-pointer transition"
      onClick={() => onSelect(erd)}
    >
      <div className="flex justify-between items-center font-semibold text-sm mb-1">
        <div className="flex items-center space-x-1">
          <FaThumbtack className="text-red-500" />
          <span>ERD 이름: {erd.name}</span>
        </div>
        <MdDelete className="text-gray-400 hover:text-red-500" />
      </div>
      <hr className="my-1" />
      <div className="text-xs text-gray-600 space-y-1 mt-2">
        <div className="flex items-center space-x-1">
          <AiOutlineCalendar />
          <span>생성일: {erd.created_at}</span>
          <AiOutlineDatabase className="ml-3" />
          <span>테이블 수: {erd.table_count}</span>
        </div>
        <div className="flex items-center space-x-1">
          <BsClockHistory />
          <span>마지막 수정: {erd.updated_at}({erd.updated_by})</span>
        </div>
      </div>
    </div>
  );
};

export default ErdCard;
