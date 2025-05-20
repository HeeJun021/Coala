import React from "react";
import { FaPlusCircle } from "react-icons/fa";

const ErdAddCard = ({ onClick, fullCenter = false }) => {
  return (
    <div
      onClick={onClick}
      className={`border border-gray-300 rounded-xl
        cursor-pointer hover:shadow-md hover:bg-gray-50 transition
        ${fullCenter ? "w-60 h-40" : "w-[340px] h-[200px]"}
        flex items-center justify-center`}
    >
      <FaPlusCircle className="text-5xl text-gray-400" />
    </div>
  );
};

export default ErdAddCard;
