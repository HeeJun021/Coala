import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "../../context/AuthContext";
import { HelpCircle, ArrowLeft } from "lucide-react";
import StudyMaterialsGuideModal from "../../components/studymaterials/StudyMaterialsGuideModal";

// 📌 style string → object 변환
const parseStyleString = (styleString) => {
  if (!styleString) return {};
  return Object.fromEntries(
    styleString
      .split(";")
      .map((style) => {
        const [property, value] = style.split(":").map((s) => s.trim());
        if (!property || !value) return [];
        const camelCaseProp = property.replace(/-([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        );
        return [camelCaseProp, value];
      })
      .filter(Boolean)
  );
};

const StudyMaterialsPage = ({ isAdminPreview }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get("category");
  const materialId = queryParams.get("id");
  const exampleId = queryParams.get("exampleId");

  const { user } = useAuth();

  const [studyContent, setStudyContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState({});
  const [submittedStatus, setSubmittedStatus] = useState({});
  const [correctStatus, setCorrectStatus] = useState({});
  const [quizIndices, setQuizIndices] = useState([]);

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showGuideTooltip, setShowGuideTooltip] = useState(false);

  // 📌 스크롤 복원
  useEffect(() => {
    const savedScrollY = localStorage.getItem("study_scroll_position");
    if (savedScrollY) {
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedScrollY, 10), behavior: "auto" });
        localStorage.removeItem("study_scroll_position");
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // 📌 가이드 툴팁
  useEffect(() => {
    const seen = localStorage.getItem("study_guide_seen");
    if (seen !== "true") setShowGuideTooltip(true);
  }, []);

  // 📌 데이터 로드
  useEffect(() => {
    setFadeIn(false);
    window.scrollTo({ top: 0, behavior: "smooth" });

    const timeout = setTimeout(() => {
      setFadeIn(true);
    }, 100);

    if (!category || (!materialId && !exampleId)) return;

    const fetchContent = async () => {
      try {
        const apiUrl = materialId
          ? `http://localhost:8000/api/materials/${category}/${materialId}`
          : `http://localhost:8000/api/examples/${category}/${exampleId}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setStudyContent(data);
        setIsCompleted(data.is_completed);

        const quizIdx = data.sections
          .map((s, i) => (s.type === "quiz" ? i : null))
          .filter((i) => i !== null);
        setQuizIndices(quizIdx);
      } catch (err) {
        console.error("❌ 데이터 불러오기 실패:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
    return () => clearTimeout(timeout);
  }, [category, materialId, exampleId]);

  const handleGuideClick = () => {
    setIsGuideOpen(true);
    setShowGuideTooltip(false);
    localStorage.setItem("study_guide_seen", "true");
  };

  const formatCodeContent = (content) => {
    return content.replace(/<br>/g, "\n").replace(/\\n/g, "\n");
  };

  const handleOptionChange = (index, option) => {
    setSelectedOptions((prev) => ({ ...prev, [index]: option }));
  };

  const handleRetry = (index) => {
    setSelectedOptions((prev) => ({ ...prev, [index]: null }));
    setSubmittedStatus((prev) => ({ ...prev, [index]: false }));
    setCorrectStatus((prev) => ({ ...prev, [index]: null }));
  };

  const handleSubmit = async (index, correctAnswer) => {
    if (!user?.user_id) {
      window.alert("❗ 퀴즈를 풀기 위해서는 로그인이 필요합니다.");
      return;
    }

    const isCorrect = selectedOptions[index] === correctAnswer;
    const updatedCorrectStatus = { ...correctStatus, [index]: isCorrect };
    setCorrectStatus(updatedCorrectStatus);
    setSubmittedStatus((prev) => ({ ...prev, [index]: true }));

    const allCorrect = quizIndices.every((i) => updatedCorrectStatus[i] === true);

    if (allCorrect && !isCompleted) {
      const endpoint = materialId
        ? `http://localhost:8000/api/study/material/${materialId}/complete`
        : `http://localhost:8000/api/examples/${exampleId}/complete`;

      try {
        await fetch(endpoint, {
          method: "POST",
          credentials: "include",
        });
        setIsCompleted(true);
      } catch (error) {
        console.error("완료 처리 API 실패:", error);
      }
    }
  };

  const showTerminalButton = (category, title, content) => {
    const isSafe = !content.includes("<html>") && !content.includes("<body>");
    return (
      ["javascript", "python"].includes(category?.toLowerCase()) &&
      !title.includes("모듈과 패키지") &&
      isSafe
    );
  };

  const showCodeTestButton = (category) => {
    return ["html", "css"].includes(category?.toLowerCase());
  };

  return (
    <div className="p-6 bg-[#f9fafb] min-h-screen">
      {/* 🔹 프리뷰 모드일 때 뒤로가기 버튼 */}
      {isAdminPreview && (
        <button
          onClick={() => navigate(-1)}
          className="fixed top-20 left-6 flex items-center bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition z-50 shadow-lg"
        >
          <ArrowLeft size={18} className="mr-2" />
          목록으로 돌아가기
        </button>
      )}

      <div className={`bg-white shadow-md rounded-lg p-8 max-w-[1000px] w-full mx-auto text-left transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"}`}>
        {isCompleted && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-xl shadow-xl px-8 py-6 text-center w-[340px] animate-fadeIn">
              <h2 className="text-xl font-bold text-green-600 mb-1 whitespace-nowrap">
                🎉 학습이 완료되었습니다!
              </h2>
              <p className="text-gray-700 text-sm mb-1">모든 퀴즈를 통과했어요!</p>
              <p className="text-blue-600 font-semibold text-sm mb-4">
                {quizIndices.length} / {quizIndices.length} 퀴즈 통과
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-700 text-white px-5 py-2 rounded hover:bg-gray-800 transition"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-gray-500">로딩 중...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : studyContent ? (
          <>
            <div className="relative flex justify-between items-center mb-6">
              <h1 className="text-5xl font-bold text-gray-900 mb-10">
                {studyContent.title}
                {isCompleted && (
                  <span className="ml-4 text-green-600 text-xl font-semibold">
                    ✅ 학습 완료
                  </span>
                )}
              </h1>
              {/* 가이드 버튼 */}
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
            </div>

            <p className="text-xl text-gray-700 leading-relaxed mb-6">
              {studyContent.content}
            </p>

            {Array.isArray(studyContent.sections) && studyContent.sections.length > 0 && (
              <div className="mt-6">
                {studyContent.sections.map((section, index) => (
                  <React.Fragment key={`${section.type}-${index}`}>
                    <div className="mt-4" style={parseStyleString(section.style)}>
                      {/* 텍스트 */}
                      {section.type === "text" && (
                        <div
                          className="text-[17px] text-gray-800 [&_b]:font-bold [&_b]:text-green-600"
                          dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                      )}

                      {/* 이미지 */}
                      {section.type === "image" && (
                        <img
                          className="mt-2 w-full max-w-2xl rounded-lg shadow-md mx-auto"
                          src={`http://localhost:8000${section.content}`}
                          alt={section.description || "설명 이미지"}
                        />
                      )}

                      {/* 비디오 */}
                      {section.type === "video" && (
                        <div className="mt-4">
                          <iframe
                            className="w-full max-w-3xl rounded-md mx-auto"
                            style={{ aspectRatio: "16 / 9" }}
                            src={section.content}
                            title="YouTube Video"
                            allowFullScreen
                          ></iframe>
                        </div>
                      )}

                      {/* 코드 */}
                      {section.type === "code" && (
                        <div className="bg-gray-100 p-4 rounded-md mt-4 border border-gray-300 shadow-md">
                          <h2 className="text-lg font-semibold text-gray-800 mb-2">{section.title}</h2>
                          <SyntaxHighlighter
                            language={
                              (() => {
                                const lang = category?.toLowerCase();
                                if (lang === "html") return "html";
                                if (lang === "css") return "css";
                                if (lang === "javascript" || lang === "js") return "javascript";
                                if (lang === "python" || lang === "py") return "python";
                                return "text";
                              })()
                            }
                            style={dracula}
                            className="rounded-md"
                            wrapLines={true}
                            customStyle={{ whiteSpace: "pre-wrap", fontSize: "15px" }}
                          >
                            {formatCodeContent(section.content)}
                          </SyntaxHighlighter>
                          <p className="mt-2 text-sm text-gray-600">{section.problem_description}</p>
                        </div>
                      )}

                      {/* 퀴즈 */}
                      {section.type === "quiz" && section.content?.question && (
                        <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-full max-w-3xl mt-6 mx-auto">
                          <h2 className="text-2xl font-bold text-center mb-4">퀴즈</h2>
                          <p className="text-lg text-center">{section.content.question}</p>
                          <div className="mt-4">
                            {section.content.options.map((option, optIdx) => (
                              <label
                                key={optIdx}
                                className={`block bg-gray-700 rounded-md p-3 my-2 cursor-pointer transition-all ${
                                  selectedOptions[index] === option ? "ring-2 ring-green-400" : ""
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`quiz-${index}`}
                                  value={option}
                                  checked={selectedOptions[index] === option}
                                  onChange={() => handleOptionChange(index, option)}
                                  className="hidden"
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                          <button
                            onClick={() => handleSubmit(index, section.content.correct_answer)}
                            className={`mt-4 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition ${
                              selectedOptions[index] == null ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            disabled={selectedOptions[index] == null}
                          >
                            정답 제출 →
                          </button>
                          {submittedStatus[index] && (
                            <div className="mt-3 text-center">
                              <p className={correctStatus[index] ? "text-green-400" : "text-red-500"}>
                                {correctStatus[index] ? "✅ 정답입니다!" : "❌ 오답입니다!"}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {index < studyContent.sections.length - 1 && (
                      <hr className="border-t border-gray-300 my-8" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-500">데이터를 찾을 수 없습니다.</div>
        )}
        <StudyMaterialsGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      </div>
    </div>
  );
};

export default StudyMaterialsPage;
