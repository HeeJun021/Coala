import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createQuiz } from "../api/quizApi";
import QuizSideBar from "../Layout/QuizSideBar";
import { CircleCheck, FileText, ListChecks, HelpCircle } from "lucide-react";
import QuizGuideModal from "../components/quiz/QuizGuideModal";

const PracticeQuiz = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showGuideTooltip, setShowGuideTooltip] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("quiz_guide_seen");
    if (seen !== "true") setShowGuideTooltip(true);
  }, []);

  const handleGuideClick = () => {
    setIsGuideOpen(true);
    setShowGuideTooltip(false);
    localStorage.setItem("quiz_guide_seen", "true");
  };

  const difficultyMap = {
    "Lv.1": 1,
    "Lv.2": 2,
    "Lv.3": 3,
  };

  const [selectedTypes, setSelectedTypes] = useState({
    ox: false,
    short: false,
    multiple: false,
  });

  const [settings, setSettings] = useState({
    ox: { count: 5, difficulty: "Lv.1" },
    short: { count: 5, difficulty: "Lv.1" },
    multiple: { count: 5, difficulty: "Lv.1" },
  });

  const handleTypeChange = (type) => {
    setSelectedTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleSettingChange = (type, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const handleStartQuiz = async () => {
    setLoading(true);
    try {
      const quizPayload = {
        title: "사용자 연습 퀴즈",
        quiz_type: "practice",
        time_limit: null,
        settings: Object.keys(selectedTypes)
          .filter((type) => selectedTypes[type])
          .map((type) => ({
            question_type: type === "ox" ? 1 : type === "short" ? 2 : 3,
            difficulty: difficultyMap[settings[type].difficulty],
            question_count: settings[type].count,
          })),
      };

      const newQuiz = await createQuiz(quizPayload);
      if (newQuiz && newQuiz.quiz_id) {
        navigate(`/quizsolve/${newQuiz.quiz_id}`);
      }
    } catch (error) {
      console.error("🚨 퀴즈 생성 실패:", error);
      alert("퀴즈 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    const className = "w-5 h-5 text-green-600 mr-2";
    switch (type) {
      case "ox":
        return <CircleCheck className={className} />;
      case "short":
        return <FileText className={className} />;
      case "multiple":
        return <ListChecks className={className} />;
      default:
        return null;
    }
  };

  const getLabel = (type) =>
    type === "ox" ? "O/X 문제" : type === "short" ? "단답형 문제" : "선택형 문제";

  return (
    <div className="flex w-full">
      <QuizSideBar />

      {/* 퀴즈 박스 */}
      <div className="flex-1 max-w-6xl pt-8 mt-8 mx-auto bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative">

        {/* 🟢 가이드 버튼 */}
         <button
            onClick={handleGuideClick}
            className="absolute top-4 right-4 text-gray-500 hover:text-black"
            title="가이드 보기"
          >
            <HelpCircle size={24} />
            {showGuideTooltip && (
              <div className="absolute top-[-2px] right-[-6px] w-[7px] h-[7px] bg-rose-600 rounded-full shadow-sm" />
            )}
          </button>

        {/* 타이틀 */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-wide">
            <span className="text-black">연습 퀴즈</span>
          </h1>
          <p className="text-gray-500 text-sm">
            원하는 유형과 난이도를 선택해{" "}
            <span className="font-medium text-gray-700">자유롭게 연습</span>하세요!
          </p>
        </div>

        {/* 문제 유형 선택 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">문제 유형을 선택하세요.</h2>
          <div className="flex gap-4">
            {["ox", "short", "multiple"].map((type) => (
              <label
                key={type}
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => handleTypeChange(type)}
              >
                <div
                  className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center font-semibold
                  ${
                    selectedTypes[type]
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-gray-300 text-gray-600 border-gray-300"
                  }`}
                >
                  {getLabel(type).replace(" 문제", "")}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 문제 설정 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {["ox", "short", "multiple"].map((type) => (
            <div
              key={type}
              className={`p-5 rounded-xl border ${
                selectedTypes[type]
                  ? "border-green-500 bg-white"
                  : "border-gray-300 bg-gray-100 opacity-60"
              } transition-all text-sm`}
            >
              <h3 className="font-bold text-gray-800 flex items-center mb-4">
                {getIcon(type)} {getLabel(type)}
              </h3>

              {/* 문제 개수 */}
              <label className="block mb-3">
                <span className="text-sm text-gray-600">문제 개수</span>
                <select
                  className="w-full p-2 mt-1 border rounded-lg"
                  value={settings[type].count}
                  onChange={(e) =>
                    handleSettingChange(type, "count", Number(e.target.value))
                  }
                  disabled={!selectedTypes[type]}
                >
                  {[2, 3, 5].map((num) => (
                    <option key={num} value={num}>
                      {num}개
                    </option>
                  ))}
                </select>
              </label>

              {/* 난이도 */}
              <label className="block">
                <span className="text-sm text-gray-600">난이도</span>
                <select
                  className="w-full p-2 mt-1 border rounded-lg"
                  value={settings[type].difficulty}
                  onChange={(e) =>
                    handleSettingChange(type, "difficulty", e.target.value)
                  }
                  disabled={!selectedTypes[type]}
                >
                  {["Lv.1", "Lv.2", "Lv.3"].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>

        {/* 시작 버튼 */}
        <div className="flex pt-8 justify-end">
          <button
            className="px-6 py-2 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700 transition-all"
            onClick={handleStartQuiz}
            disabled={loading}
          >
            {loading ? "퀴즈 생성 중..." : "퀴즈 풀기"}
          </button>
        </div>
      </div>

      {/* 가이드 모달 */}
      {isGuideOpen && (
        <QuizGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      )}
    </div>
  );
};

export default PracticeQuiz;
