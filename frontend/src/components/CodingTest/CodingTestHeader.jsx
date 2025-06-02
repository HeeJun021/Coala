import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const CodingTestHeader = ({ title }) => {
  return (
    <header className="flex items-center justify-between bg-gray-100 border-b border-gray-300 px-6 py-3">
      <div className="flex items-center gap-3">
        <Link
          to="/codingtest"
          className="text-gray-500 hover:text-gray-700 transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      </div>
    </header>
  );
};

export default CodingTestHeader;
