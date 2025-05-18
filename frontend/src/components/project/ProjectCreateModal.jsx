// src/components/project/ProjectCreateModal.jsx
import React, { useState } from "react";
import Modal from "../common/Modal";
import { createProject } from "../../api/projectApi";

const WIDGET_OPTIONS = [
  { key: "erd", label: "ERD 설계" },
  { key: "git", label: "Git 연동" },
  { key: "memo", label: "메모" },
  { key: "calendar", label: "캘린더" },
];

const ProjectCreateModal = ({ onClose, onCreated }) => {
  const [projectName, setProjectName] = useState("");
  const [selectedWidgets, setSelectedWidgets] = useState([]);

  const toggleWidget = (key) => {
    setSelectedWidgets((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) return alert("프로젝트 이름을 입력하세요");

    try {
      const res = await createProject({
        name: projectName,
        widgets: selectedWidgets,
      });
      onCreated?.(res.data);
      onClose();
    } catch (err) {
      console.error("프로젝트 생성 실패", err);
    }
  };

  return (
    <Modal onClose={onClose} title="새 프로젝트 생성">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">프로젝트 이름</label>
          <input
            className="w-full px-3 py-2 border rounded"
            placeholder="프로젝트 이름을 입력하세요"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">위젯 선택</label>
          <div className="grid grid-cols-2 gap-2">
            {WIDGET_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => toggleWidget(opt.key)}
                className={`border px-4 py-2 rounded text-sm text-left hover:bg-gray-100 transition ${
                  selectedWidgets.includes(opt.key)
                    ? "bg-blue-100 border-blue-400"
                    : "bg-white"
                }`}
              >
                ✅ {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          프로젝트 생성
        </button>
      </div>
    </Modal>
  );
};

export default ProjectCreateModal;
