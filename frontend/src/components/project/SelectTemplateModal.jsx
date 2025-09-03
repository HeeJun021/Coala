import React, { useState } from "react";
import { Plus } from "lucide-react";

const PREDEFINED_TEMPLATES = [
  {
    key: "roadmap",
    title: "Product Roadmap",
    description: "Visualize project milestones and timelines.",
    previewUrl: "https://example.com/roadmap-preview.png",
    widgets: ["timeline", "tasks"],
  },
  {
    key: "kanban",
    title: "Kanban Board",
    description: "Manage tasks with to-do, in-progress, done columns.",
    previewUrl: "https://example.com/kanban-preview.png",
    widgets: ["tasks"],
  },
  {
    key: "sprint-planning",
    title: "Sprint Planning",
    description: "Plan sprints with backlog and reviews.",
    previewUrl: "https://example.com/sprint-preview.png",
    widgets: ["tasks", "calendar"],
  },
  {
    key: "scrum-board",
    title: "Scrum Board",
    description: "Agile scrum methodology template.",
    previewUrl: "https://example.com/scrum-preview.png",
    widgets: ["tasks", "timeline"],
  },
  {
    key: "bug-tracker",
    title: "Bug Tracker",
    description: "Track and resolve bugs efficiently.",
    previewUrl: "https://example.com/bug-preview.png",
    widgets: ["tasks", "docs"],
  },
];

const SelectTemplateModal = ({ onClose, onSelect }) => {
  const [templates] = useState(PREDEFINED_TEMPLATES);
  const [isLoading] = useState(false);

  const handleSelect = (template) => {
    onSelect({
      title: template.title,
      description: template.description,
      widgets: template.widgets,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white text-black p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto shadow-xl">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Plus size={18} className="text-green-600" />
          템플릿 선택
        </h2>

        {isLoading ? (
          <p className="text-gray-500">템플릿 로딩 중...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template.key}
                onClick={() => handleSelect(template)}
                className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition flex flex-col"
              >
                {template.previewUrl && (
                  <img
                    src={template.previewUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <h3 className="font-medium text-gray-800">{template.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {template.description}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded text-sm"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectTemplateModal;