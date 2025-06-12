import React, { useState, useCallback } from "react";
import { Dialog } from "@headlessui/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpenText,
  FileText,
  StickyNote,
  CheckCircle,
  Info,
  Code2,
  FileCheck,
  RefreshCcw,
  Users,
  AlertCircle,
  Settings,
  PenLine,
  Save,
  ChevronDown,
  Leaf
} from "lucide-react";

const guideTabs = [
  {
    key: "문제 정보 및 채점",
    icon: <BookOpenText size={18} className="text-blue-500" />,
  },
  { key: "제출 내역", icon: <FileText size={18} className="text-green-600" /> },
  {
    key: "오답노트",
    icon: <StickyNote size={18} className="text-yellow-500" />,
  },
  {
    key: "채점 기준 및 점수",
    icon: <CheckCircle size={18} className="text-purple-500" />,
  },
];

const guideSlides = {
  "문제 정보 및 채점": [
    {
      title: "문제 정보 (1)",
      description: "문제 설명부터 제약 조건까지 상세히 확인하세요.",
      image: "/guide/codingTest/problem-info-1.png",
      icon: <Info size={20} className="text-blue-500" />,
    },
    {
      title: "문제 정보 (2)",
      description: "입출력 예제를 통해 문제 해결 방식을 이해합니다.",
      image: "/guide/codingTest/problem-info-2.png",
      icon: <Code2 size={20} className="text-blue-500" />,
    },
    {
      title: "언어 설정",
      description:
        "언어 변경 시 해당 언어의 스타터 코드가 자동으로 로드됩니다.",
      image: "/guide/codingTest/language-setting.png",
      icon: <Settings size={20} className="text-gray-600" />,
    },
    {
      title: "테스트케이스 실행",
      description: "테스트 버튼을 누르면 실행 결과를 확인할 수 있습니다.",
      image: (
        <div className="space-y-4">
          {/* 실행 중 이미지 */}
          <img
            src="/guide/codingTest/testcase-run.png"
            alt="테스트케이스 실행 중"
            className="w-full max-h-[300px] object-contain border rounded shadow"
          />

          {/* 아래 화살표 아이콘 */}
          <div className="flex justify-center">
            <ChevronDown size={24} className="text-gray-400" />
          </div>

          {/* 실행 완료 결과 이미지 */}
          <img
            src="/guide/codingTest/testcase-result.png"
            alt="테스트케이스 실행 결과"
            className="w-full max-h-[300px] object-contain border rounded shadow"
          />
        </div>
      ),
      icon: <FileCheck size={20} className="text-green-600" />,
    },
    {
      title: "질문 게시판 이동",
      description: "문제에 대해 궁금한 점이 있다면 게시판으로 이동하세요.",
      image: "/guide/codingTest/go-to-board.png",
      icon: <Users size={20} className="text-cyan-500" />,
    },
    {
  title: "다른 사람의 풀이 보기",
  description: (
    <div className="space-y-2 text-gray-700">
      <p>
        다른 사람의 풀이를 보면 <strong>해당 문제는 정답을 맞추더라도 레이팅이 오르지 않습니다.</strong>
      </p>
      <p className="text-sm text-gray-500">
        모달에서 주의 문구를 확인한 후, 다른 사람의 풀이 페이지로 이동할 수 있습니다.
      </p>
    </div>
  ),
  image: (
    <div className="space-y-4">
      {/* 모달 경고 이미지 */}
      <img
        src="/guide/codingTest/solution-modal.png"
        alt="다른 사람 풀이 보기 경고 모달"
        className="w-full max-h-[260px] object-contain border rounded shadow"
      />

      {/* 아래 화살표 */}
      <div className="flex justify-center">
        <ChevronDown size={28} className="text-gray-400" />
      </div>

      {/* 실제 풀이 페이지 이미지 */}
      <img
        src="/guide/codingTest/solution-page.png"
        alt="다른 사람의 풀이 페이지"
        className="w-full max-h-[260px] object-contain border rounded shadow"
      />
    </div>
  ),
  icon: <AlertCircle size={20} className="text-red-500" />,
},
    {
  title: "코드 초기화",
  description: (
    <div className="space-y-2 text-gray-700">
      <p>
        초기화 버튼 클릭 시 현재 작성 중인 코드는 삭제되고, 해당 언어의 스타터 코드로
        되돌아갑니다.
      </p>
      <p className="text-sm text-gray-500">한 번 초기화하면 되돌릴 수 없습니다. 주의하세요.</p>
    </div>
  ),
  image: (
    <div className="flex items-center justify-center gap-4">
      {/* 초기화 전 상태 */}
      <img
        src="/guide/codingTest/code-reset-after.png"
        alt="초기화 전 코드"
        className="w-[45%] rounded border shadow"
      />

      {/* 가운데 화살표 아이콘 */}
      <ChevronRight size={28} className="text-gray-400" />

      {/* 초기화 후 상태 */}
      <img
        src="/guide/codingTest/code-reset-before.png"
        alt="초기화 후 스타터 코드"
        className="w-[45%] rounded border shadow"
      />
    </div>
  ),
  icon: <RefreshCcw size={20} className="text-orange-500" />,
}
,
    {
      title: "코드 채점",
      description:
        "채점 완료 시 결과 모달이 나타납니다. (정확한 점수 기준은 ‘채점 기준 및 점수’ 탭 참고)",
      image: "/guide/codingTest/judge-result.png",
      icon: <CheckCircle size={20} className="text-purple-500" />,
    },
  ],
  "제출 내역": [
    {
      title: "제출 내역 확인",
      description: "내가 제출한 코드 기록을 모두 확인할 수 있습니다.",
      image: "/guide/codingTest/submission-list.png",
      icon: <FileText size={20} className="text-green-600" />,
    },
  ],
  오답노트: [
    {
      title: "오답노트 시작하기",
      description: "틀린 문제를 선택해 오답노트를 작성할 수 있습니다.",
      image: "/guide/codingTest/wrongnote-start.png",
      icon: <StickyNote size={20} className="text-yellow-500" />,
    },
    {
      title: "오답노트 제목 수정",
      description: "노트 제목을 원하는 이름으로 변경할 수 있습니다.",
      image: "/guide/codingTest/wrongnote-title.png",
      icon: <PenLine size={20} className="text-gray-700" />,
    },
    {
      title: "제출 코드 불러오기",
      description: "오답노트 에디터에 제출 코드를 불러올 수 있습니다.",
      image: "/guide/codingTest/wrongnote-loadcode.png",
      icon: <Code2 size={20} className="text-blue-500" />,
    },
    {
      title: "에디터 기능 소개",
      description:
        "에디터에서는 글씨 강조, 링크 삽입, 이미지 첨부 등 마크다운 기능을 사용할 수 있습니다.",
      image: "/guide/codingTest/wrongnote-editor.png",
      icon: <Settings size={20} className="text-green-700" />,
    },
    {
      title: "오답노트 저장 및 수정",
      description: "작성한 오답노트는 저장하고 나중에 수정할 수 있습니다.",
      icon: <Save size={20} className="text-purple-600" />,
    },
  ],
  "채점 기준 및 점수": [
    {
      title: "채점 기준 안내",
      description: (
    <div className="space-y-2 text-gray-700">
      <p>
        채점 결과는 <strong>정답 여부, 시간/메모리 제한 만족 여부, 문제 난이도</strong>에 따라 결정됩니다.
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>정답 제출</strong>일 경우에만 점수를 획득할 수 있습니다.</li>
        <li>모든 테스트케이스를 통과해야 <strong>정답</strong>으로 인정됩니다.</li>
        <li>정답 제출이어도 <strong>다른 사람의 풀이</strong>를 열람한 경우에는 점수를 받을 수 없습니다.</li>
        <li><strong>시간 초과(TLE)</strong>, <strong>메모리 초과(MLE)</strong>, <strong>런타임 에러(RTE)</strong>, <strong>틀렸습니다(WA)</strong>의 경우 모두 0점 처리됩니다.</li>
        <li>모든 테스트케이스를 통과해야 하며, 시간 및 메모리 제한을 초과하면 정답으로 인정되지 않습니다.</li>
      </ul>
    </div>
  ),
      image: "/guide/codingTest/judge-result.png",
      icon: <CheckCircle size={20} className="text-purple-500" />,
    },
    {
  title: "획득 점수 및 유칼립투스",
  description: (
    <div className="space-y-2 text-gray-700">
      <p>
        문제를 <strong>처음으로 정답</strong>으로 제출한 경우, 아래 조건을 만족하면 <strong>레이팅 점수</strong>와 <strong>유칼립투스 보상</strong>이 함께 지급됩니다.
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>해당 문제의 <strong>난이도(difficulty 1~5)</strong>에 따라 다음 점수가 부여됩니다:
          <ul className="list-disc pl-5">
            <li>1단계: 20점 / 유칼립투스 2</li>
            <li>2단계: 30점 / 유칼립투스 3</li>
            <li>3단계: 40점 / 유칼립투스 5</li>
            <li>4단계: 50점 / 유칼립투스 7</li>
            <li>5단계: 70점 / 유칼립투스 10</li>
          </ul>
        </li>
        <li><strong>이전에 정답을 제출한 적이 있는 경우</strong>에는 점수 및 보상이 지급되지 않습니다.</li>
        <li><strong>다른 사람의 풀이</strong>를 확인한 후 제출하면, 정답이더라도 점수와 유칼립투스가 지급되지 않습니다.</li>
      </ul>
    </div>
  ),
  image: null, // 이미지 없음
  icon: <Leaf size={20} className="text-green-500" />,
}


  ],
};

const CodingTestGuideModal = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState("문제 정보 및 채점");
  const [stepIndex, setStepIndex] = useState(0);

  const currentSlides = guideSlides[tab];
  const current = currentSlides[stepIndex];

  const handleTabChange = useCallback((key) => {
    setTab(key);
    setStepIndex(0);
  }, []);

  const handlePrev = useCallback(() => {
    setStepIndex((prev) => prev - 1);
  }, []);

  const handleNext = useCallback(() => {
    setStepIndex((prev) => prev + 1);
  }, []);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative z-50 bg-white w-[1100px] h-[800px] rounded-xl shadow-xl flex overflow-hidden">
        {/* 좌측 탭 */}
        <div className="w-1/3 bg-gray-50 border-r p-4">
          <h2 className="text-lg font-bold mb-4">가이드 탭</h2>
          {guideTabs.map(({ key, icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded ${
                tab === key ? "bg-green-100 font-semibold" : "hover:bg-gray-100"
              }`}
            >
              {icon}
              {key}
            </button>
          ))}
        </div>

        {/* 우측 콘텐츠 */}
        <div className="flex-1 flex flex-col p-6 relative overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>

          {/* 콘텐츠 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              {current.icon}
              <h3 className="text-xl font-bold">{current.title}</h3>
            </div>
            {typeof current.image === "string" ? (
              <img
                src={current.image}
                alt={current.title}
                className="w-full max-h-[360px] object-contain border rounded shadow mb-4"
              />
            ) : (
              <div className="mb-4">{current.image}</div>
            )}

            <p className="text-gray-700">{current.description}</p>
          </div>

          {/* 네비게이션 */}
          {currentSlides.length > 1 && (
            <div className="flex justify-between items-center mt-auto">
              <button
                onClick={handlePrev}
                disabled={stepIndex === 0}
                className="flex items-center gap-1 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                이전
              </button>
              <span className="text-sm text-gray-500">
                {stepIndex + 1} / {currentSlides.length}
              </span>
              <button
                onClick={handleNext}
                disabled={stepIndex === currentSlides.length - 1}
                className="flex items-center gap-1 px-3 py-1 rounded bg-green-100 hover:bg-green-200 disabled:opacity-50"
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

export default CodingTestGuideModal;
