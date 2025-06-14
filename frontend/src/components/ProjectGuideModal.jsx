import React, { useState, useCallback, memo } from "react";
import { Dialog } from "@headlessui/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Folder,
  Info,
  CheckSquare,
  Activity,
  Calendar,
  StickyNote,
  MessageCircle,
  Database,
  GitBranch,
} from "lucide-react";

// Import images dynamically
const images = [
  require("../assets/projectguide/1.png"),
  require("../assets/projectguide/2.png"),
  require("../assets/projectguide/3.png"),
  require("../assets/projectguide/4.png"),
  require("../assets/projectguide/5.png"),
  require("../assets/projectguide/6.png"),
  require("../assets/projectguide/7.png"),
  require("../assets/projectguide/8.png"),
];

const guideSections = {
  "기능별 가이드": [
    {
      title: "프로젝트 대시보드",
      content:
        "대시보드에서는 전체 프로젝트 목록을 확인하고, 최근 작업 상태를 확인하거나 새 프로젝트를 생성할 수 있습니다. '내 작업', '수신함', '프로젝트 목록'은 사이드바에서 빠르게 접근할 수 있으며, 최근 할 일들을 필터링해 보여줍니다.",
      icon: <LayoutDashboard size={18} className="text-blue-500" />,
      imgSrc: images[0],
    },
    {
      title: "프로젝트 생성",
      content:
        "'+ 프로젝트 생성' 버튼을 클릭하면 프로젝트 이름과 위젯을 선택하여 새 프로젝트를 만들 수 있습니다. ERD, 문서, 채팅, 타임라인 등 필요한 기능만 선택해 맞춤형 프로젝트를 구성할 수 있습니다.",
      icon: <Folder size={18} className="text-green-600" />,
      imgSrc: images[1],
    },
    {
      title: "개요 탭",
      content:
        "개요 탭에서는 프로젝트 설명을 편집하고 팀원을 초대할 수 있으며, 기술 스택, 목표 등을 기록할 수 있습니다. 프로젝트 생성 후 바로 이 탭으로 이동하게 됩니다.",
      icon: <Info size={18} className="text-gray-600" />,
      imgSrc: images[2],
    },
    {
      title: "작업 관리",
      content:
        "'작업' 탭에서는 프로젝트 단위의 작업들을 섹션별로 확인할 수 있습니다. 각 작업은 마감일, 상태, 우선순위 등을 포함하며, 보드/캘린더/리스트 뷰로 전환하여 다양한 방식으로 관리할 수 있습니다.",
      icon: <CheckSquare size={18} className="text-indigo-600" />,
      imgSrc: images[3],
    },
    {
      title: "타임라인 뷰",
      content:
        "타임라인 탭에서는 작업들을 Gantt Chart 형태로 시각화하여 확인할 수 있습니다. 작업을 드래그하여 일정 조정이 가능하며, 의존 관계가 있는 작업은 자동으로 연동됩니다.",
      icon: <Activity size={18} className="text-pink-500" />,
      imgSrc: images[4],
    },
    {
      title: "캘린더 뷰",
      content:
        "'캘린더' 탭에서는 작업들을 날짜별로 확인할 수 있으며, FullCalendar를 기반으로 하여 월간 작업 흐름을 시각적으로 파악할 수 있습니다.",
      icon: <Calendar size={18} className="text-red-500" />,
      imgSrc: images[5],
    },
    {
      title: "문서 관리",
      content:
        "'문서' 탭에서는 Tiptap 기반의 에디터를 사용해 팀원들과 협업 문서를 작성하고 편집할 수 있습니다. 문서 블록은 스타일링과 서식 적용이 가능하며 자동 저장됩니다.",
      icon: <FileText size={18} className="text-green-700" />,
      imgSrc: images[6],
    },
    {
      title: "메모 관리",
      content:
        "간단한 메모는 '메모' 탭에서 기록할 수 있습니다. 각 메모는 블록 단위로 구성되며, 키보드 입력 중심의 빠른 기록과 수정이 가능합니다.",
      icon: <StickyNote size={18} className="text-yellow-600" />,
      imgSrc: images[7],
    },
    {
      title: "채팅 기능",
      content:
        "'채팅' 탭에서는 프로젝트 참여자와 실시간 메시지를 주고받을 수 있습니다. 초대 메시지, 수락/거절 카드도 이 탭을 통해 확인할 수 있습니다.",
      icon: <MessageCircle size={18} className="text-blue-500" />,
      imgSrc: images[8],
    },
    {
      title: "ERD 설계",
      content:
        "ERD 탭에서는 테이블과 컬럼, 관계를 시각적으로 설계하고 자동으로 SQL 또는 클래스 코드로 변환할 수 있습니다. 설계 내용은 자동 저장되며, 관계도 실시간 반영됩니다.",
      icon: <Database size={18} className="text-purple-600" />,
      imgSrc: images[9],
    },
    {
      title: "Git 연동",
      content:
        "'GitHub' 탭에서는 프로젝트를 GitHub 저장소와 연동할 수 있도록 지원합니다. 저장소 URL을 통해 팀원 간 버전 관리를 연동할 수 있으며, 향후 커밋 히스토리 기능이 추가될 예정입니다.",
      icon: <GitBranch size={18} className="text-gray-700" />,
      imgSrc: images[10],
    },
  ]
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

const ProjectGuideModal = ({ isOpen, onClose }) => {
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
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
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

export default ProjectGuideModal;