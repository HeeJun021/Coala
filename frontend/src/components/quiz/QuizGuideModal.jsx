import React, { useState, useCallback, memo } from "react";
import { Dialog } from "@headlessui/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckSquare,
  Pencil,
} from "lucide-react";

const guideSections = {
  "연습 퀴즈": [
    {
        title: "문제의 유형",
        content: "연습 퀴즈는 O/X, 객관식, 단답형의 3가지 유형으로 구성돼요.",
        icon: <BookOpen size={18} className="text-indigo-500" />,
        imgSrc: "/guide/quiz/step0.png",
    },
    {
        title: "문제의 유형",
        content: "각 버튼을 눌러 문제를 활성화할 수 있어요.",
        icon: <BookOpen size={18} className="text-indigo-500" />,
        imgSrc: "/guide/quiz/step1.png",
    },
    {
      title: "난이도 및 개수 설정",
      content: "난이도(Lv1/Lv2/Lv3)와 문제 개수(2/3/5개)를 자유롭게 선택하여 퀴즈를 풀 수 있어요.",
      icon: <CheckSquare size={18} className="text-green-500" />,
      imgSrc: "/guide/quiz/step2.png",
    },
    {
      title: "반복 학습 가능",
      content: "제한 없이 여러 번 퀴즈를 풀며 자유롭게 연습할 수 있어요.",
      icon: <Pencil size={18} className="text-purple-400" />
    },
  ],
  "테스트 퀴즈": [
    {
      title: "문제 구성",
      content: "문제 유형은 연습 퀴즈와 동일하지만, 난이도는 어려운 문제들로, 개수는 3개로 고정돼요.",
      icon: <BookOpen size={18} className="text-blue-500" />,
      imgSrc: "/guide/quiz/step4.png",
    },
    {
      title: "점수 채점 기준",
      content: "정답률이 100%면 50점, 75% 이상이면 25점, 30% 미만은 30점이 차감됩니다.",
      icon: <CheckSquare size={18} className="text-yellow-500" />,
      imgSrc: "/guide/quiz/step5.png",
    },
    {
      title: "결과 확인",
      content: "퀴즈 제출 후 전체 결과와 정답률, 오답 여부와 변동된 점수를 확인할 수 있어요.",
      icon: <Pencil size={18} className="text-pink-400" />,
      imgSrc: "/guide/quiz/step6.png",
    },
  ],
  "퀴즈 만들어보기": [
    {
      title: "퀴즈 목록",
      content: "사용자가 만든 퀴즈들이 목록에 표시되며, 누구나 풀어볼 수 있어요.",
      icon: <BookOpen size={18} className="text-orange-500" />,
      imgSrc: "/guide/quiz/step7.png",
    },
    {
      title: "내 퀴즈 검색",
      content: "'내가 만든 퀴즈' 버튼으로 필터링하거나 제목으로 다른 사용자의 퀴즈를 검색할 수 있어요.",
      icon: <CheckSquare size={18} className="text-green-600" />,
      imgSrc: "/guide/quiz/step8.png",
    },
    {
      title: "퀴즈 만들기",
      content: "'문제 추가'를 눌러 문제 입력 칸을 만들고 유형을 선택할 수 있어요.",
      icon: <Pencil size={18} className="text-blue-500" />,
      imgSrc: "/guide/quiz/step9.png",
    },
    {
      title: "O/X 문제",
      content: "문제 내용을 작성하고 O와 X중에 정답을 선택할 수 있어요.",
      icon: <Pencil size={18} className="text-blue-500" />,
      imgSrc: "/guide/quiz/step10.png",
    },
    {
      title: "퀴즈 만들기",
      content: "문제 내용을 작성하고 정답을 작성한 뒤 정답에 체크하여 정답을 선택할 수 있어요.",
      icon: <Pencil size={18} className="text-blue-500" />,
      imgSrc: "/guide/quiz/step11.png",
    },
    {
      title: "퀴즈 만들기",
      content: "문제 내용을 작성하고 정답을 작성할 수 있어요.",
      icon: <Pencil size={18} className="text-blue-500" />,
      imgSrc: "/guide/quiz/step12.png",
    },
  ],
};

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

const QuizGuideModal = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState("연습 퀴즈");
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

          <ContentSection
            tab={tab}
            stepIndex={stepIndex}
            guides={guides}
          />

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

export default QuizGuideModal;
