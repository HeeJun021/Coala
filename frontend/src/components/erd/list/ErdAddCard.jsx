import React from "react";
import { PlusCircle } from "lucide-react";

const ErdAddCard = ({ onClick, fullCenter = false }) => {
  return (
    <div
      onClick={onClick}
      className={`border border-gray-600 rounded-2xl cursor-pointer
        hover:shadow-xl hover:bg-[#2a2e3a] transition-colors duration-200
        ${fullCenter ? "w-60 h-40" : "w-[340px] h-[200px]"}
        flex items-center justify-center group`}
    >
      <PlusCircle className="w-12 h-12 text-gray-500 group-hover:text-blue-500 transition-colors" />
    </div>
  );
};

export default ErdAddCard;
