import React, { useState } from "react";
import {
  Database,
  GitBranch,
  FileText,
  Calendar,
  CheckSquare,
  Activity,
  LayoutTemplate, // templates 아이콘 추가
  Code, // code_editor 아이콘 추가
  X,
} from "lucide-react";
import { createProject } from "../../api/projectApi";

// 모달 UI
const Modal = ({ onClose, title, children }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[500px] max-h-[90vh] overflow-y-auto p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-black"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4 text-black">{title}</h2>
        {children}
      </div>
    </div>
  );
};

// 위젯 아이콘 + 색상 정의
const WIDGET_OPTIONS = [
  {
    key: "erd",
    label: "ERD 설계",
    icon: <Database size={16} className="text-purple-600" />,
  },
  {
    key: "git",
    label: "GitHub 공유",
    icon: <GitBranch size={16} className="text-gray-700" />,
  },
  {
    key: "docs",
    label: "문서 관리",
    icon: <FileText size={16} className="text-green-700" />,
  },
  {
    key: "calendar",
    label: "캘린더",
    icon: <Calendar size={16} className="text-red-500" />,
  },
  {
    key: "tasks",
    label: "작업",
    icon: <CheckSquare size={16} className="text-indigo-600" />,
  },
  {
    key: "timeline",
    label: "타임라인",
    icon: <Activity size={16} className="text-pink-500" />,
  },
  {
    key: "templates",
    label: "템플릿",
    icon: <LayoutTemplate size={16} className="text-blue-600" />, // templates 추가
  },
  {
    key: "code_editor",
    label: "코드 에디터",
    icon: <Code size={16} className="text-green-600" />, // code_editor 추가
  },
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
    if (!projectName.trim()) return alert("프로젝트 이름을 입력하세요.");
    const widgetData = WIDGET_OPTIONS.reduce(
      (acc, opt) => ({ ...acc, [opt.key]: selectedWidgets.includes(opt.key) }),
      {}
    );
    const widgetOrder = ["overview", ...selectedWidgets];
    try {
      const res = await createProject({
        name: projectName,
        widgets: widgetData,
        widget_order: widgetOrder,
      });
      onCreated?.(res);
      onClose();
    } catch (err) {
      console.error("프로젝트 생성 실패", err);
      alert("프로젝트 생성에 실패했습니다.");
    }
  };

  return (
    <Modal onClose={onClose} title="새 프로젝트 생성">
      <div className="space-y-4 text-black">
        <div>
          <label className="block text-sm font-medium mb-1 text-black">
            프로젝트 이름
          </label>
          <input
            className="w-full px-3 py-2 border rounded text-black focus:outline-none focus:border-green-600"
            placeholder="프로젝트 이름을 입력하세요"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-black">
            위젯 선택
          </label>
          <div className="grid grid-cols-2 gap-2">
            {WIDGET_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => toggleWidget(opt.key)}
                className={`border px-4 py-2 rounded text-sm text-left transition ${
                  selectedWidgets.includes(opt.key)
                    ? "bg-green-50 border-green-400"
                    : "bg-white"
                } text-black hover:bg-gray-100`}
              >
                <span className="flex items-center gap-2">
                  {opt.icon}
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          프로젝트 생성
        </button>
      </div>
    </Modal>
  );
};

export default ProjectCreateModal;