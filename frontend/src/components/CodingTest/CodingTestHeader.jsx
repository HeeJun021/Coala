import React from "react";
import { Link } from "react-router-dom";
import { HiChevronLeft } from "react-icons/hi";

const CodingTestHeader = ({ title }) => {
  return (
    <header className="flex items-center justify-between bg-[#2c3544] px-6 py-3">
      <div className="flex items-center gap-3">
        <Link
          to="/codingtest"
          className="text-white text-2xl hover:text-gray-300 transition"
        >
          <HiChevronLeft size={28} />
        </Link>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
    </header>
  );
};

export default CodingTestHeader;
