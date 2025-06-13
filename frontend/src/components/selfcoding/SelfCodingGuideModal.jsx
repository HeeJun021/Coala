import React, { useState, useCallback, memo } from "react";
import { Dialog } from "@headlessui/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  FileText,
  Github,
  Save,
  Settings,
  Eye,
} from "lucide-react";

const guideSections = {
  "기능별 가이드": [
    {
      title: "사이드바 메뉴",
      content: "좌측의 ☰ 메뉴를 클릭하면 File, Edit, View 등 다양한 기능을 사용할 수 있어요.",
      icon: <Menu size={18} className="text-gray-600" />,
      imgSrc: "/guide/selfcoding/selfcoding-menu.png",
    },
    {
      title: "파일 탐색기",
      content: "📁 아이콘을 클릭하면 파일 탐색기가 열려 폴더와 파일을 확인할 수 있어요.",
      icon: <FileText size={18} className="text-blue-500" />,
      imgSrc: "/guide/selfcoding/selfcoding-explorer.png",
    },
    {
      title: "파일 탐색기-상세",
      content: "폴더 및 파일에 오른쪽 클릭을 해 다양한 기능을 사용할 수 있어요.",
      icon: <FileText size={18} className="text-blue-500" />,
      imgSrc: "/guide/selfcoding/selfcoding-context-menu.png",
    },
    {
      title: "GitHub 연동",
      content: "아이콘을 통해 GitHub 저장소를 연동하고, 코드 업로드/다운로드가 가능해요.",
      icon: <Github size={18} className="text-black" />,
      imgSrc: "/guide/selfcoding/selfcoding-github.png",
    },
    {
      title: "로컬 저장",
      content: "💾 아이콘을 클릭하면 현재 코드를 로컬에 저장할 수 있어요.",
      icon: <Save size={18} className="text-green-600" />,
      imgSrc: "/guide/selfcoding/selfcoding-save.png",
    },
    {
      title: "코드 작성 및 실행",
      content: "중앙 코드 편집기에서 코드를 작성하고 저장하면 실행 탭 또는 프리뷰에서 결과를 볼 수 있어요.",
      icon: <Settings size={18} className="text-indigo-600" />,
      imgSrc: "/guide/selfcoding/selfcoding-editor.png",
    },
    {
      title: "프리뷰 화면",
      content: "HTML/CSS/JS 파일의 경우, 우측 프리뷰 탭에서 결과를 실시간으로 확인할 수 있어요.",
      icon: <Eye size={18} className="text-purple-500" />,
      imgSrc: "/guide/selfcoding/selfcoding-preview.png",
    },
  ],
  "Github 사용법": [
    {
      title: "새로운 저장소 만들기",
      content: "새로운 저장소 만들기 버튼을 눌러 원격 저장소에 새로운 저장소를 만들 수 있어요.",
      icon: <Github size={18} className="text-indigo-600" />,
      imgSrc: "/guide/selfcoding/selfcoding-github-save.png",
    },
    {
      title: "저장소에 업로드 하기기",
      content: "폴더 및 파일을 선택해 Github 원격 저장소에 업로드할 수 있어요.",
      icon: <Github size={18} className="text-purple-500" />,
      imgSrc: "/guide/selfcoding/selfcoding-github-save2.png",
    },
  ],
};

const TabSection = memo(({ tab, setTab }) => (
  <div className="w-1/3 border-r p-4 bg-gray-50 overflow-y-auto">
    <h2 className="text-lg font-bold mb-4">가이드 항목</h2>
    {Object.keys(guideSections).map((key) => (
      <button
        key={key}
        className={`w-full text-left px-3 py-2 rounded ${
          tab === key ? "bg-blue-100 font-semibold" : "hover:bg-gray-100"
        }`}
        onClick={() => setTab(key)}
      >
        {key}
      </button>
    ))}
  </div>
));

const ContentSection = memo(({ tab, stepIndex, guides }) => {
  const current = guides[stepIndex];
  return (
    <div className="flex-1 overflow-y-auto">
      <div>
        <div className="flex items-center gap-2 mb-4">
          {current.icon}
          <h3 className="text-xl font-bold">{current.title}</h3>
        </div>
        {current.imgSrc && (
          <img
            src={current.imgSrc}
            alt={current.title}
            className="w-full max-h-[360px] object-contain border rounded shadow mb-4"
          />
        )}
        <p className="text-gray-700">{current.content}</p>
      </div>
    </div>
  );
});

const SelfCodingGuideModal = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState("기능별 가이드");
  const [stepIndex, setStepIndex] = useState(0);

  const guides = guideSections[tab];
  const showNavigation = guides.length > 1;

  const handleTabChange = useCallback((newTab) => {
    setTab(newTab);
    setStepIndex(0);
  }, []);

  const handlePrevStep = useCallback(() => {
    setStepIndex((prev) => prev - 1);
  }, []);

  const handleNextStep = useCallback(() => {
    setStepIndex((prev) => prev + 1);
  }, []);

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-40" aria-hidden="true" />
      <div className="relative z-50 bg-white rounded-xl w-[1000px] h-[700px] flex shadow-2xl">
        <TabSection tab={tab} setTab={handleTabChange} />

        <div className="flex-1 p-6 relative flex flex-col justify-between overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          >
            <X size={20} />
          </button>

          <ContentSection tab={tab} stepIndex={stepIndex} guides={guides} />

          {showNavigation && (
            <div className="flex justify-between items-center mt-6">
              <button
                disabled={stepIndex === 0}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                onClick={handlePrevStep}
              >
                <ChevronLeft size={16} /> 이전
              </button>

              <span className="text-sm text-gray-500">
                {stepIndex + 1} / {guides.length}
              </span>

              <button
                disabled={stepIndex === guides.length - 1}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
                onClick={handleNextStep}
              >
                다음 <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default SelfCodingGuideModal;
