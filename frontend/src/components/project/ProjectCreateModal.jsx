import React, { useState } from 'react';
import {
  Database,
  GitBranch,
  FileText,
  MessageCircle,
  Calendar,
  StickyNote,
  CheckSquare,
  Activity,
  X,
} from 'lucide-react';
import { createProject } from '../../api/projectApi';

// ✅ 모달 UI
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

// ✅ 위젯 아이콘 + 색상 정의
const WIDGET_OPTIONS = [
  { key: "erd", label: "ERD 설계", icon: <Database size={16} className="text-purple-600" /> },
  { key: "git", label: "GitHub 공유", icon: <GitBranch size={16} className="text-gray-700" /> },
  { key: "docs", label: "문서 관리", icon: <FileText size={16} className="text-green-700" /> },
  { key: "chat", label: "채팅", icon: <MessageCircle size={16} className="text-blue-500" /> },
  { key: "calendar", label: "캘린더", icon: <Calendar size={16} className="text-red-500" /> },
  { key: "memo", label: "메모", icon: <StickyNote size={16} className="text-yellow-600" /> },
  { key: "tasks", label: "작업", icon: <CheckSquare size={16} className="text-indigo-600" /> },
  { key: "timeline", label: "타임라인", icon: <Activity size={16} className="text-pink-500" /> },
];

const ProjectCreateModal = ({ onClose, onCreated }) => {
  const [projectName, setProjectName] = useState('');
  const [selectedWidgets, setSelectedWidgets] = useState([]);

  const toggleWidget = (key) => {
    setSelectedWidgets((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) return alert("프로젝트 이름을 입력하세요");

    try {
      const widgetData = {};
      const widgetOrder = ["overview"];
      WIDGET_OPTIONS.forEach((opt) => {
        const isSelected = selectedWidgets.includes(opt.key);
        widgetData[opt.key] = isSelected;
        if (isSelected) widgetOrder.push(opt.key);
      });

      const res = await createProject({
        name: projectName,
        description: null,
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
            className="w-full px-3 py-2 border rounded text-black"
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
                    ? "bg-blue-100 border-blue-400"
                    : "bg-white"
                } text-black hover:bg-gray-100`}
              >
                 {opt.label}
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
