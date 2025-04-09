import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "../context/AuthContext";

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

const StudyMaterialsPage = () => {
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

  const [selectedOptions, setSelectedOptions] = useState({});
  const [submittedStatus, setSubmittedStatus] = useState({});
  const [correctStatus, setCorrectStatus] = useState({});

  const [quizIndices, setQuizIndices] = useState([]); // 모든 퀴즈 인덱스 추적

  useEffect(() => {
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

        // 퀴즈 인덱스 추출
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
  }, [category, materialId, exampleId]);

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

    // 모든 퀴즈 정답을 맞췄는지 확인
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
        console.error("✅ 완료 처리 API 실패:", error);
      }
    }
  };

  const showTerminalButton = (category, title, content) => {
    const isSafe =
      !content.includes("<html>") && !content.includes("<body>");
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
    <div className="bg-[#f9fafb] min-h-screen py-10">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-[1000px] w-full mx-auto text-left">
      {isCompleted && (
        <div className="fixed top-10 right-10 z-[9999] bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded shadow-lg">
          ✅ 이 학습자료는 완료되었습니다
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">로딩 중...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : studyContent ? (
        <>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {studyContent.title}
            {isCompleted && (
              <span className="ml-4 text-green-600 text-xl font-semibold">
                ✅ 학습 완료
              </span>
            )}
          </h1>
          <p className="text-xl text-gray-700 leading-relaxed mb-6">
            {studyContent.content}
          </p>

          {Array.isArray(studyContent.sections) &&
            studyContent.sections.length > 0 && (
              <div className="mt-6">
                {studyContent.sections.map((section, index) => (
                  <React.Fragment key={`${section.type}-${index}`}>
                    <div className="mt-4" style={parseStyleString(section.style)}>
                      {section.type === "text" && (
                        <div className="text-[17px] text-gray-800 [&_b]:font-bold [&_b]:text-green-600"
                          dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                      )}

                      {section.type === "image" && (
                        <img
                          className="mt-2 w-full max-w-2xl rounded-lg shadow-md mx-auto"
                          src={section.content}
                          alt="설명 이미지"
                        />
                      )}

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

                      {section.type === "code" && (
                        <div className="bg-gray-100 p-4 rounded-md mt-4 border border-gray-300 shadow-md">
                          <h2 className="text-lg font-semibold text-gray-800 mb-2">{section.title}</h2>
                          <SyntaxHighlighter
                            language={category?.toLowerCase() || "text"}
                            style={dracula}
                            className="rounded-md"
                            wrapLines={true}
                            customStyle={{ whiteSpace: "pre-wrap", fontSize: "15px" }}
                          >
                            {formatCodeContent(section.content)}
                          </SyntaxHighlighter>
                          <p className="mt-2 text-sm text-gray-600">{section.problem_description}</p>
                          <div className="flex gap-2 mt-4">
                            {showCodeTestButton(category) && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/codetest?code=${encodeURIComponent(section.content)}&language=${encodeURIComponent(
                                      category
                                    )}&title=${encodeURIComponent(
                                      studyContent.title
                                    )}&problem_description=${encodeURIComponent(
                                      section.problem_description || ""
                                    )}`
                                  )
                                }
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                              >
                                코드 테스트 →
                              </button>
                            )}
                            {showTerminalButton(category, studyContent.title, section.content) ? (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/terminal?language=${encodeURIComponent(category)}&code=${encodeURIComponent(
                                      section.content
                                    )}&title=${encodeURIComponent(
                                      studyContent.title
                                    )}&problem_description=${encodeURIComponent(
                                      section.problem_description || ""
                                    )}`
                                  )
                                }
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                              >
                                터미널 실습 →
                              </button>
                            ) : (
                              category?.toLowerCase() === "javascript" &&
                              (section.content.includes("<html>") || section.content.includes("<body>")) && (
                                <button
                                  onClick={() =>
                                    window.alert("❗ HTML/DOM 코드가 포함된 학습자료는 실행할 수 없습니다.")
                                  }
                                  className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
                                >
                                  실행 불가
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      )}

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
                            className={`mt-4 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition ${
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
                              {correctStatus[index] && (
                                <p
                                  className="text-sm text-gray-300 mt-2 [&_b]:font-bold [&_b]:text-green-400"
                                  dangerouslySetInnerHTML={{ __html: section.content.explanation }}
                                />
                              )}
                              <button
                                onClick={() => handleRetry(index)}
                                className="mt-2 bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600 transition"
                              >
                                다시 시도
                              </button>
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
    </div>
    </div>
  );
};

export default StudyMaterialsPage;
