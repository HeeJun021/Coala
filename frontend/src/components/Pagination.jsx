import React from "react";

const Pagination = ({ totalPages, currentPage, onPageChange }) => {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center mt-4 space-x-2">
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => onPageChange && onPageChange(number)}
          className={`px-3 py-1 rounded-md ${
            currentPage === number
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {number}
        </button>
      ))}
    </div>
  );
};

export default Pagination;
