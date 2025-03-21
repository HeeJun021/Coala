import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

// CSS 문자열을 React 스타일 객체로 변환
const parseStyleString = (styleString) => {
  if (!styleString) return {};
  const styleObj = {};
  styleString.split(";").forEach((style) => {
    const [property, value] = style.split(":").map((s) => s.trim());
    if (property && value) {
      const camelCaseProp = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      styleObj[camelCaseProp] = value;
    }
  });
  return styleObj;
};

const StudyMaterialsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get("category");
  const materialId = queryParams.get("id");
  const exampleId = queryParams.get("exampleId");

  const [studyContent, setStudyContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  useEffect(() => {
    if (!category || (!materialId && !exampleId)) {
      console.warn("🚨 category 또는 id 값이 없습니다.");
      return;
    }

    const fetchContent = async () => {
      try {
        let apiUrl = "";
        if (materialId) {
          apiUrl = `http://localhost:8000/api/materials/${encodeURIComponent(category)}/${materialId}`;
        } else if (exampleId) {
          apiUrl = `http://localhost:8000/api/examples/${encodeURIComponent(category)}/${exampleId}`;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        setStudyContent(data);
      } catch (err) {
        console.error("❌ 데이터 불러오기 실패:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [category, materialId, exampleId]);

  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  const handleSubmit = (correctAnswer) => {
    if (selectedOption !== null) {
      const isAnswerCorrect = selectedOption === correctAnswer;
      setIsCorrect(isAnswerCorrect);
      setSubmitted(true);
    }
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setSubmitted(false);
    setIsCorrect(null);
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 max-w-5xl w-full mx-auto text-left">
      {loading ? (
        <div className="text-gray-500">로딩 중...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : studyContent ? (
        <>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{studyContent.title}</h1>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">{studyContent.content}</p>

          {studyContent.sections && studyContent.sections.length > 0 && (
            <div className="mt-6">
              {studyContent.sections.map((section, index) => (
                <React.Fragment key={`${section.type}-${index}`}>
                  <div className="mt-4" style={parseStyleString(section.style)}>
                    {section.type === "text" && (
                      <div
                        className="text-lg text-gray-700"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    )}

                    {section.type === "image" && (
                      <img
                        className="mt-2 w-full max-w-2xl rounded-lg shadow-md mx-auto"
                        src={section.content}
                        alt={section.description || "설명 이미지"}
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
                        {section.description && (
                          <p className="text-sm text-gray-600 mt-2 text-center">{section.description}</p>
                        )}
                      </div>
                    )}

                    {section.type === "code" && (
                      <div className="bg-gray-100 p-4 rounded-md mt-4 border border-gray-300 shadow-md">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">{section.title}</h2>
                        <SyntaxHighlighter
                          language="html"
                          style={dracula}
                          className="rounded-md"
                          wrapLines={true}
                          customStyle={{ whiteSpace: "pre-wrap" }}
                        >
                          {section.content}
                        </SyntaxHighlighter>
                        <p className="mt-2 text-sm text-gray-600">{section.problem_description}</p>
                        <button
                          onClick={() =>
                            navigate(
                              `/codetest?code=${encodeURIComponent(section.content)}&language=${encodeURIComponent(
                                category
                              )}&title=${encodeURIComponent(
                                studyContent.title
                              )}&problem_description=${encodeURIComponent(
                                section.problem_description || "코드를 실행하여 결과를 확인하세요."
                              )}`
                            )
                          }
                          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                        >
                          코드 테스트 →
                        </button>
                      </div>
                    )}

                    {section.type === "definition" && (
                      <div className="bg-gray-50 p-4 rounded-md mt-4 border border-gray-200">
                        {section.content.map((def, idx) => (
                          <p
                            key={idx}
                            className="text-gray-700 mb-2"
                            dangerouslySetInnerHTML={{
                              __html: `<strong>${def.term}</strong>: ${def.definition}`,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {section.type === "quiz" && (
                      <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-full max-w-3xl mt-6 mx-auto">
                        <h2 className="text-2xl font-bold text-center mb-4">퀴즈</h2>
                        <p className="text-lg text-center">{section.content.question}</p>
                        <div className="mt-4">
                          {section.content.options.map((option, idx) => (
                            <label
                              key={idx}
                              className={`block bg-gray-700 rounded-md p-3 my-2 cursor-pointer transition-all ${
                                selectedOption === option ? "ring-2 ring-green-400" : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name="quiz"
                                value={option}
                                checked={selectedOption === option}
                                onChange={() => handleOptionChange(option)}
                                className="hidden"
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                        <button
                          onClick={() => handleSubmit(section.content.correct_answer)}
                          className={`mt-4 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition ${
                            selectedOption === null ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={selectedOption === null}
                        >
                          정답 제출 →
                        </button>
                        {submitted && (
                          <div className="mt-3 text-center">
                            <p className={`${isCorrect ? "text-green-400" : "text-red-500"}`}>
                              {isCorrect ? (
                                "✅ 정답입니다!"
                              ) : (
                                <span className="text-red-500 font-semibold">❌ 오답입니다!</span>
                              )}
                            </p>
                            {submitted && isCorrect && (
                              <p className="text-sm text-gray-300 mt-2">{section.content.explanation}</p>
                            )}
                            <button
                              onClick={handleRetry}
                              className="mt-2 bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600 transition"
                            >
                              다시 시도
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 섹션마다 절취선 자동 삽입 */}
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
  );
};

export default StudyMaterialsPage;