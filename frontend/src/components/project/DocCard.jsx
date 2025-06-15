import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { updateDocument } from "../../api/documentApi";

const DocCard = ({ doc, onDelete }) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);

  const handleNavigate = () => {
    console.log("DocCard navigate info", doc);
    if (!editing && doc?.project_id && doc?.doc_id) {
      navigate(`/team-project/${doc.project_id}/doc/${doc.doc_id}`);
    }
  };

  const handleUpdateTitle = async () => {
    try {
      await updateDocument(doc.project_id, doc.doc_id, { title });
      setEditing(false);
    } catch (err) {
      alert("제목 수정 실패");
      console.error(err);
    }
  };

  return (
    <div
      className="relative w-60 h-40 p-4 bg-white rounded-xl shadow-md hover:shadow-lg border flex flex-col justify-between"
      onClick={handleNavigate}
    >
      {/* 삭제 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
        title="삭제"
      >
        <Trash2 size={18} />
      </button>

      {/* 제목 */}
      <div className="flex items-start gap-1">
        {editing ? (
          <div className="flex flex-col gap-1 w-full">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={handleUpdateTitle}
              className="text-sm font-semibold border rounded px-1 py-0.5"
              autoFocus
            />
          </div>
        ) : (
          <h3
            className="text-lg font-semibold text-gray-800 flex-1 break-words"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            title="더블클릭하면 제목 수정"
          >
            {title}
          </h3>
        )}
      </div>

      {/* 수정일자 */}
      <p className="text-sm text-gray-500 mt-2">
        {new Date(doc.updated_at).toLocaleString()}
      </p>
    </div>
  );
};

export default DocCard;
