import React, { useState, useCallback, memo } from "react";
import { Dialog } from "@headlessui/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Code,
  CheckCircle,
  PlayCircle,
  Library,
  Terminal,
} from "lucide-react";

// Import images dynamically
const images = [
  require("../assets/studymaterialsguide/1.png"),
  require("../assets/studymaterialsguide/2.png"),
  require("../assets/studymaterialsguide/3.png"),
  require("../assets/studymaterialsguide/4.png"),
  require("../assets/studymaterialsguide/5.png"),
  require("../assets/studymaterialsguide/6.png"),
  require("../assets/studymaterialsguide/7.png"),
  require("../assets/studymaterialsguide/8.png"),
  require("../assets/studymaterialsguide/9.png"),
  require("../assets/studymaterialsguide/10.png"),
  require("../assets/studymaterialsguide/11.png"),
  require("../assets/studymaterialsguide/12.png"),
  require("../assets/studymaterialsguide/13.png"),
  require("../assets/studymaterialsguide/14.png"),
  require("../assets/studymaterialsguide/15.png"),
  require("../assets/studymaterialsguide/16.png")
];

const guideSections = {
  "기능별 가이드": [
    {
      title: "학습자료 탐색",
      content: "좌측 사이드바에서 HTML, CSS, JavaScript, Python 등 다양한 프로그래밍 언어를 선택하여 학습자료와 예제를 탐색할 수 있습니다. 각 언어를 클릭하면 관련 학습자료와 예제 목록이 펼쳐지며, 원하는 항목을 선택해 학습을 시작할 수 있습니다. 완료된 항목은 체크 표시로 확인할 수 있습니다.",
      icon: <Library size={18} className="text-gray-600" />,
      imgSrc: images[0],
    },
    {
      title: "텍스트 학습",
      content: "학습자료 페이지에서 텍스트 섹션을 통해 프로그래밍 개념, 이론, 설명을 읽으며 학습할 수 있습니다. 내용은 초보자도 이해하기 쉽게 구성되어 있으며, 핵심 개념을 명확히 전달합니다.",
      icon: <FileText size={18} className="text-blue-500" />,
      imgSrc: images[1],
    },
    {
      title: "코드 학습",
      content: "코드 섹션에서는 예제 코드를 확인할 수 있습니다. HTML/CSS는 '코드 테스트' 버튼을, JavaScript/Python은 '터미널 실습' 버튼을 클릭하여 코드를 직접 실행하고 결과를 확인할 수 있습니다. 코드 편집과 실행을 통해 실습하며 학습 효과를 높일 수 있습니다.",
      icon: <Code size={18} className="text-green-600" />,
      imgSrc: images[2],
    },
    {
      title: "퀴즈 풀기",
      content: "퀴즈 섹션에서는 학습한 내용을 점검할 수 있는 객관식 문제를 제공합니다. 정답을 선택한 후 '정답 제출' 버튼을 눌러 결과를 확인하고, 오답 시 '다시 시도' 버튼으로 재도전할 수 있습니다. 모든 퀴즈를 통과하면 학습 완료로 표시됩니다.",
      icon: <CheckCircle size={18} className="text-purple-500" />,
      imgSrc: images[3], 
    },
    {
      title: "비디오 및 이미지 학습 자료",
      content: "비디오 섹션에서 강의 영상을 시청하거나 이미지 자료를 통해 시각적으로 학습할 수 있습니다. 영상은 재생 컨트롤을 제공하며, 원하는 부분을 반복 학습할 수 있습니다. 이미지 자료는 개념을 직관적으로 이해하는 데 도움을 줍니다.",
      icon: <PlayCircle size={18} className="text-red-500" />,
      imgSrc: images[4],
    },
  ],
  "코드 테스트": [
    {
      title: "코드 테스트란?",
      content: "코드 테스트 페이지에서는 HTML과 CSS 코드를 작성하고 실시간으로 결과를 프리뷰할 수 있습니다. 주어진 예제 코드를 수정하거나 새로 작성하여 다양한 스타일과 레이아웃을 실험해볼 수 있습니다. JavaScript 코드는 DOM 조작이 포함된 경우 실행이 제한될 수 있습니다.",
      icon: <Code size={18} className="text-green-600" />,
      imgSrc: images[5],
    },
    {
      title: "코드 편집",
      content: "코드 편집기에서 HTML/CSS 코드를 작성하거나 수정할 수 있습니다. 편집기는 구문 강조와 줄 번호를 제공하여 코딩이 편리합니다. 테마를 'Light' 또는 'Dark'로 변경하여 작업 환경을 조정할 수 있습니다.",
      icon: <Code size={18} className="text-blue-500" />,
      imgSrc: images[6],
    },
    {
      title: "실행 결과 확인",
      content: "작성한 HTML/CSS 코드는 '코드 실행' 버튼을 눌러 즉시 프리뷰로 확인할 수 있습니다. 결과는 iframe 내에 렌더링되며, 백그라운드 색상은 흰색으로 고정됩니다. 오류가 발생하면 오류 메시지가 표시됩니다.",
      icon: <PlayCircle size={18} className="text-purple-500" />,
      imgSrc: images[7],
    },
    {
      title: "초기화 및 언어 선택",
      content: "언어 선택 드롭다운에서 HTML 또는 CSS를 선택할 수 있습니다. '초기화' 버튼을 누르면 원래 제공된 예제 코드로 되돌아갑니다. 언어가 올바르게 선택되지 않으면 실행 시 경고 메시지가 표시됩니다.",
      icon: <CheckCircle size={18} className="text-teal-500" />,
      imgSrc: images[8],
    },
  ],
  "퀴즈": [
    {
      title: "퀴즈 기능이란?",
      content: "퀴즈 섹션은 학습한 내용을 복습하고 이해도를 점검할 수 있는 객관식 문제를 제공합니다. 각 퀴즈는 학습자료의 핵심 개념을 기반으로 하며, 문제를 풀며 지식을 강화할 수 있습니다.",
      icon: <CheckCircle size={18} className="text-purple-500" />,
      imgSrc: images[9],
    },
    {
      title: "퀴즈 풀기",
      content: "퀴즈는 여러 옵션 중 하나를 선택하여 푸는 방식입니다. 옵션을 클릭하면 선택된 상태로 표시되며, '정답 제출' 버튼을 눌러 결과를 확인할 수 있습니다. 로그인하지 않은 경우 퀴즈 제출이 제한됩니다.",
      icon: <BookOpen size={18} className="text-blue-500" />,
      imgSrc: null,
    },
    {
      title: "결과 확인 및 재시도",
      content: "정답 제출 후 즉시 정답 여부를 확인할 수 있습니다. 정답이면 '✅ 정답입니다!' 메시지가, 오답이면 '❌ 오답입니다!' 메시지가 표시됩니다. 오답일 경우 '다시 시도' 버튼을 눌러 새로운 답을 선택할 수 있습니다.",
      icon: <CheckCircle size={18} className="text-green-600" />,
      imgSrc: images[10],
    },
    {
      title: "학습 완료",
      content: "모든 퀴즈를 정답으로 맞히면 학습 완료 팝업이 표시되며, 사이드바와 학습자료 페이지에 체크 아이콘 표시가 나타납니다. 이는 학습 진행 상황을 시각적으로 확인할 수 있는 기능입니다.",
      icon: <CheckCircle size={18} className="text-teal-500" />, // Corrected to CheckCircle
      imgSrc: images[11],
    },
  ],
  "터미널 실습": [
    {
      title: "터미널 실습이란?",
      content: "터미널 실습 페이지에서는 JavaScript와 Python 코드를 실행하고 콘솔 출력을 확인할 수 있습니다. 주어진 예제 코드를 실행하거나 수정하여 다양한 입력값으로 테스트해볼 수 있습니다.",
      icon: <Terminal size={18} className="text-indigo-600" />,
      imgSrc: images[12],
    },
    {
      title: "코드 실행",
      content: "코드 편집기에서 JavaScript 또는 Python 코드를 작성한 후 '코드 실행' 버튼을 눌러 실행합니다. 실행 결과는 하단 터미널에 출력되며, 실행 중 상태를 표시합니다. HTML/DOM 관련 코드는 실행이 제한됩니다.",
      icon: <Code size={18} className="text-green-600" />,
      imgSrc: images[13],
    },
    {
      title: "터미널 출력",
      content: "터미널은 코드 실행 결과를 실시간으로 보여줍니다. 성공적인 실행 시 출력값이, 오류 발생 시 오류 메시지가 표시됩니다. 터미널은 서버와 WebSocket으로 연결되어 실시간 피드백을 제공합니다.",
      icon: <Terminal size={18} className="text-blue-500" />,
      imgSrc: images[14],
    },
    {
      title: "초기화 및 재연결",
      content: "‘초기화’ 버튼을 눌러 원래 예제 코드로 되돌릴 수 있습니다. 서버 연결이 끊기면 자동으로 재연결을 시도하며, 연결 상태는 터미널에 표시됩니다.",
      icon: <CheckCircle size={18} className="text-teal-500" />,
      imgSrc: images[15],
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

const StudyMaterialsGuideModal = ({ isOpen, onClose }) => {
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

export default StudyMaterialsGuideModal;