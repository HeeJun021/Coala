import React, { useState, useCallback, memo } from "react";
import { Dialog } from "@headlessui/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Table,
  MousePointerClick,
  GitCompareArrows,
  KeyRound,
  History,
  FileUp,
  Camera,
  Undo2,
  Redo2,
  ZoomIn,
  ArrowRight,
  Move,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";

const guideSections = {
  "기능별 가이드": [
    {
      title: "플로팅 툴 버튼",
      content: (
        <>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Table size={16} className="text-cyan-400" />
              <span>
                <strong>테이블 추가:</strong> 클릭 후 캔버스를 누르면 테이블이
                생성돼요.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <GitCompareArrows size={16} className="text-pink-400" />
              <span>
                <strong>관계 추가:</strong> 컬럼 A → B를 클릭해 관계를 생성할 수
                있어요.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <History size={16} className="text-yellow-400" />
              <span>
                <strong>히스토리:</strong> 이전 상태를 확인하고 복원할 수
                있어요.
              </span>
            </div>
          </div>
        </>
      ),
      icon: <Settings2 size={18} className="text-blue-500" />,
      imgSrc: "/guide/floating-button.png",
    },
    {
      title: "테이블 추가",
      content:
        "플로팅 메뉴에서 '테이블 추가'를 클릭 시 마우스 커서가 바뀌고, 캔버스를 클릭하면 테이블이 생성돼요.",
      icon: <Table size={18} className="text-cyan-400" />,
      imgSrc: (
        <div className="flex items-center justify-center gap-4">
          <img
            src="/guide/add-table-step1.png"
            alt="테이블 추가 단계 1"
            className="w-[45%] rounded border shadow"
          />
          <ArrowRight size={24} className="text-blue-400" />
          <img
            src="/guide/add-table-step2.png"
            alt="테이블 추가 단계 2"
            className="w-[45%] rounded border shadow"
          />
        </div>
      ),
    },
    {
      title: "컬럼 추가 및 삭제",
      content: (
        <div className="space-y-2 text-gray-700">
          <div>
            <strong>컬럼 추가:</strong> 테이블 안의{" "}
            <Plus size={14} className="inline text-green-500" /> 버튼을 눌러
            컬럼을 추가할 수 있어요.
          </div>
          <div>
            <strong>컬럼 삭제:</strong> 컬럼 우측의{" "}
            <Minus size={14} className="inline text-red-500" /> 버튼을 눌러
            컬럼을 삭제할 수 있어요.
          </div>
        </div>
      ),
      icon: <MousePointerClick size={18} className="text-indigo-500" />,
      imgSrc: "/guide/add-column.png",
    },
    {
      title: "관계 추가",
      content:
        "관계 추가 모드에서 컬럼 하나를 클릭하고, 다른 컬럼을 클릭하면 관계가 설정돼요.",
      icon: <GitCompareArrows size={18} className="text-pink-500" />,
      imgSrc: "/guide/add-relation.png",
    },
    {
      title: "PK 설정",
      content:
        "컬럼을 우클릭하면 나오는 메뉴에서 'PK 설정'을 선택해 기본키로 지정할 수 있어요.",
      icon: <KeyRound size={18} className="text-yellow-500" />,
      imgSrc: "/guide/set-pk.png",
    },
    {
      title: "히스토리 기록",
      content:
        "상단 툴바의 히스토리 기록 버튼을 누르면 현재 상태가 저장되고 로그에 남아요.",
      icon: <History size={18} className="text-pink-400" />,
      imgSrc: "/guide/save-history.png",
    },
    {
      title: "히스토리 보기 및 이동",
      content:
        "플로팅 메뉴의 히스토리 항목을 클릭하면 이전 설계 상태를 열람하거나 복원할 수 있어요.",
      icon: <History size={18} className="text-yellow-400" />,
      imgSrc: "/guide/history-modal.png",
    },
    {
      title: "SQL 내보내기",
      content:
        "플로팅 버튼의 SQL 아이콘을 클릭하면 설계된 ERD를 SQL 쿼리 형식으로 변환해볼 수 있어요.",
      icon: <FileUp size={18} className="text-gray-400" />,
      imgSrc: "/guide/export-sql.png",
    },
    {
      title: "이미지 내보내기",
      content:
        "ERD 전체를 이미지(PNG)로 저장할 수 있어요. 문서나 발표 자료에 붙여넣을 때 유용해요.",
      icon: <Camera size={18} className="text-green-400" />,
      imgSrc: "/guide/export-image.png",
    },
  ],
  단축키: [
    {
      title: "Undo",
      content: "Ctrl + Z",
      icon: <Undo2 size={18} className="text-red-500" />,
    },
    {
      title: "Redo",
      content: "Ctrl + Shift + Z",
      icon: <Redo2 size={18} className="text-green-500" />,
    },
    {
      title: "줌 인/아웃",
      content: "Ctrl + 마우스 휠",
      icon: <ZoomIn size={18} className="text-blue-500" />,
    },
  ],
  "조작 방법": [
    {
      title: "테이블 생성",
      content: "툴바의 + 버튼 클릭 후 캔버스를 클릭",
      icon: <Table size={18} className="text-cyan-500" />,
    },
    {
      title: "관계 설정",
      content: "관계 모드에서 컬럼 클릭 → 다른 컬럼 클릭",
      icon: <GitCompareArrows size={18} className="text-pink-500" />,
    },
    {
      title: "드래그 후 삭제",
      content: "테이블 선택 후 Delete 키로 삭제",
      icon: <Trash2 size={18} className="text-rose-500" />,
    },
    {
      title: "화면 이동",
      content: "캔버스에서 마우스 휠 클릭 후 드래그",
      icon: <Move size={18} className="text-blue-500" />,
    },
  ],
};

// 메모이제이션된 탭 섹션
const TabSection = memo(({ tab, setTab }) => {
  return (
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
  );
});

// 메모이제이션된 콘텐츠 섹션
const ContentSection = memo(({ tab, stepIndex, guides, isSlideMode }) => {
  const current = guides[stepIndex];
  return (
    <div className="flex-1 overflow-y-auto">
      {isSlideMode ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            {current.icon}
            <h3 className="text-xl font-bold">{current.title}</h3>
          </div>
          {current.imgSrc &&
            (typeof current.imgSrc === "string" ? (
              <img
                src={current.imgSrc}
                alt={current.title}
                className="w-full max-h-[360px] object-contain border rounded shadow mb-4"
              />
            ) : (
              <div className="mb-4">{current.imgSrc}</div>
            ))}
          <p className="text-gray-700">{current.content}</p>
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-bold mb-4">{tab}</h3>
          <ul className="space-y-3">
            {guides.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between border-b py-2"
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="font-medium text-gray-800">
                    {item.title}
                  </span>
                </div>
                <span className="text-gray-600">{item.content}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

const ErdGuideModal = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState("기능별 가이드");
  const [stepIndex, setStepIndex] = useState(0);

  const guides = guideSections[tab];
  const isSlideMode = tab === "기능별 가이드";
  const showNavigation = isSlideMode && guides.length > 1;

  // 이벤트 핸들러를 useCallback으로 감싸 최적화
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
      <div
        className="fixed inset-0 bg-black bg-opacity-40"
        aria-hidden="true"
      />
      <div className="relative z-50 bg-white rounded-xl w-[1000px] h-[700px] flex shadow-2xl">
        {/* 좌측 탭 */}
        <TabSection tab={tab} setTab={handleTabChange} />

        {/* 우측 콘텐츠 */}
        <div className="flex-1 p-6 relative flex flex-col justify-between overflow-y-auto">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          >
            <X size={20} />
          </button>

          {/* 콘텐츠 */}
          <ContentSection
            tab={tab}
            stepIndex={stepIndex}
            guides={guides}
            isSlideMode={isSlideMode}
          />

          {/* 네비게이션 */}
          {showNavigation && (
            <div className="flex justify-between items-center mt-6">
              <button
                disabled={stepIndex === 0}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                onClick={handlePrevStep}
              >
                <ChevronLeft size={16} />
                이전
              </button>

              {/* 🔢 현재 페이지 표시 */}
              <span className="text-sm text-gray-500">
                {stepIndex + 1} / {guides.length}
              </span>

              <button
                disabled={stepIndex === guides.length - 1}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
                onClick={handleNextStep}
              >
                다음
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default ErdGuideModal;
