import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createQuiz } from "../../api/quizApi";
import { getLanguages } from "../../api/languageApi";
import QuizSideBar from "../../Layout/QuizSideBar";
import { CircleCheck, FileText, ListChecks, HelpCircle } from "lucide-react";
import QuizGuideModal from "../../components/quiz/QuizGuideModal";

const TestQuiz = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showGuideTooltip, setShowGuideTooltip] = useState(false);

  const [languages, setLanguages] = useState([]);
  const [languageId, setLanguageId] = useState(1);

  useEffect(() => {
    const seen = localStorage.getItem("quiz_guide_seen");
    if (seen !== "true") setShowGuideTooltip(true);
  }, []);

  const handleGuideClick = () => {
    setIsGuideOpen(true);
    setShowGuideTooltip(false);
    localStorage.setItem("quiz_guide_seen", "true");
  };

  useEffect(() => {
    const fetchLanguages = async () => {
      const data = await getLanguages();
      const filtered = data.filter((lang) => lang.language !== "Other");
      setLanguages(filtered);
      if (filtered.length > 0) {
        setLanguageId(filtered[0].language_id);
      }
    };
    fetchLanguages();
  }, []);

  const selectedTypes = {
    ox: true,
    short: true,
    multiple: true,
  };

  const handleStartQuiz = async () => {
    setLoading(true);
    try {
      const quizPayload = {
        title: "테스트 퀴즈",
        quiz_type: "test",
        time_limit: 30,
        language_id: languageId,
        settings: Object.keys(selectedTypes).map((type) => ({
          question_type: type === "ox" ? 1 : type === "short" ? 2 : 3,
          difficulty: 3,
          question_count: 3,
        })),
      };

      const newQuiz = await createQuiz(quizPayload);
      if (newQuiz && newQuiz.quiz_id) {
        navigate(`/quizsolve/${newQuiz.quiz_id}?mode=test`);
      }
    } catch (error) {
      console.error("퀴즈 생성 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (type) =>
    type === "ox" ? "O/X" : type === "short" ? "단답형 문제" : "선택형 문제";

  const getIcon = (type) => {
    const className = "w-5 h-5 text-green-600 inline-block mr-3";
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

  return (
    <div className="flex w-full">
      <QuizSideBar />

      <div className="flex-1 max-w-6xl pt-8 mt-8 mx-auto bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative">
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
            <span className="text-black">테스트 퀴즈</span>
          </h1>
          <p className="text-gray-500 text-sm">
            자동으로 생성되는 <span className="font-medium text-gray-700">퀴즈 유형</span>을 확인하고
            <br /> 테스트를 시작해보세요!
          </p>
        </div>

        {/* 🟢 문제 언어 선택 */}
        <div className="mb-8 max-w-xs">
          <label className="text-sm font-semibold text-gray-700 block mb-2">문제 언어</label>
          <select
            className="w-full p-2 border rounded-lg"
            value={languageId || ""}
            onChange={(e) => setLanguageId(Number(e.target.value))}
          >
            {languages.map((lang) => (
              <option key={lang.language_id} value={lang.language_id}>
                {lang.language}
              </option>
            ))}
          </select>
        </div>

        {/* 문제 유형 박스 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">문제 유형</h2>
          <div className="flex gap-4">
            {["ox", "short", "multiple"].map((type) => (
              <div
                key={type}
                className="px-4 py-2 rounded-lg border-2 bg-green-600 text-white border-green-600 font-semibold shadow-sm"
              >
                {getLabel(type).replace(" 문제", "")}
              </div>
            ))}
          </div>
        </div>

        {/* 문제 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {["ox", "short", "multiple"].map((type) => (
            <div
              key={type}
              className="p-5 rounded-xl border border-green-500 bg-white shadow-sm text-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center">
                  {getIcon(type)} {getLabel(type)}
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">문제 개수</span>
                  <span className="text-gray-800 font-semibold">3개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">난이도</span>
                  <span className="text-gray-800 font-semibold">Lv.3</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 버튼 */}
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

export default TestQuiz;
