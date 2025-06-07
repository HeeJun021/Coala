import React from "react";

const DocCard = ({ doc, onClick, onRefresh }) => {
  return (
    <div
      onClick={onClick}
      className="w-60 h-40 p-4 bg-white rounded-xl shadow-md hover:shadow-lg cursor-pointer flex flex-col justify-between border"
    >
      <h3 className="text-lg font-semibold text-gray-800">{doc.title}</h3>
      <p className="text-sm text-gray-500">{new Date(doc.updated_at).toLocaleString()}</p>
    </div>
  );
};

export default DocCard;
