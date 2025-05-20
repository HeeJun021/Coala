import React from "react";
import { FaPlusCircle } from "react-icons/fa";

const ErdAddCard = ({ onClick, fullCenter = false }) => {
  return (
    <div
      onClick={onClick}
      className={`border border-gray-400 rounded-xl 
        cursor-pointer hover:shadow-md transition 
        ${fullCenter ? "w-60 h-40" : "w-[300px] h-40"} 
        flex items-center justify-center`}
    >
      <FaPlusCircle className="text-5xl text-gray-400" />
    </div>
  );
};

export default ErdAddCard;
