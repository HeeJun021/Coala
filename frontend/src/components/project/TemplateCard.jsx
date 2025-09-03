import React, { useState } from "react";
import { Trash2, LayoutTemplate, CalendarDays } from "lucide-react";
// import { updateTemplate } from "../../api/templateApi"; // Hypothetical API

const TemplateCard = ({ template, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(template.title);

  const handleNavigate = () => {
    if (!editing) {
      // Optionally navigate to a view/edit page for the template
      // e.g., navigate(`/team-project/${template.project_id}/template/${template.template_id}`);
    }
  };

  const handleUpdateTitle = async () => {
    try {
      // await updateTemplate(template.project_id, template.template_id, { title });
      setEditing(false);
    } catch (err) {
      alert("제목 수정 실패");
      console.error(err);
    }
  };

  return (
    <div
      onClick={handleNavigate}
      className="w-[340px] h-[200px] border border-gray-300 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between"
    >
      {/* 상단 제목 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 truncate">
            <LayoutTemplate size={18} className="text-blue-500" />
            {editing ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={handleUpdateTitle}
                className="text-sm font-semibold border px-1 py-0.5 rounded w-full"
                autoFocus
              />
            ) : (
              <span
                className="text-base font-semibold text-gray-800 truncate"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                title="더블클릭해서 제목 수정"
              >
                {title}
              </span>
            )}
          </div>
          <Trash2
            size={18}
            className="text-gray-400 hover:text-red-500 transition"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
        </div>
        <hr className="my-2 border-gray-200" />
      </div>

      {/* 하단 정보 영역 */}
      <div className="text-sm text-gray-700 flex flex-col justify-between flex-1">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-blue-500" />
          <span>
            <span className="font-medium">추가일:</span>{" "}
            {new Date(template.added_at).toLocaleString()}
          </span>
        </div>

        {template.description && (
          <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 leading-snug line-clamp-3">
            {template.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateCard;