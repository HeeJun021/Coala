import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

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

  useEffect(() => {
    if (!category || (!materialId && !exampleId)) return;

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

  const formatCodeContent = (content) => {
    return content.replace(/<br>/g, "\n").replace(/\\n/g, "\n");
  };

  const showTerminalButton = (category, title, content) => {
    const isCodeSafe = !content.includes("<script") && !content.includes("<html>");
    return (
      (category.toLowerCase() === "javascript" || category.toLowerCase() === "python") &&
      !title.includes("모듈과 패키지") &&
      isCodeSafe
    );
  };

  const showCodeTestButton = (category) => {
    return category.toLowerCase() === "html" || category.toLowerCase() === "css";
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

          {Array.isArray(studyContent.sections) && studyContent.sections.length > 0 && (
            <div className="mt-6">
              {studyContent.sections.map((section, index) => (
                <React.Fragment key={`${section.type}-${index}`}>
                  <div className="mt-4" style={parseStyleString(section.style)}>
                    {section.type === "text" && (
                      <div
                        className="text-lg text-gray-700 [&_b]:font-bold [&_b]:text-green-600"
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
                          language={category.toLowerCase()}
                          style={dracula}
                          className="rounded-md"
                          wrapLines={true}
                          customStyle={{ whiteSpace: "pre-wrap", fontSize: "14px" }}
                        >
                          {formatCodeContent(section.content)}
                        </SyntaxHighlighter>
                        <p className="mt-2 text-sm text-gray-600">{section.problem_description}</p>
                        <div className="flex gap-2 mt-4">
                          {showCodeTestButton(category) && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/codetest?code=${encodeURIComponent(
                                    section.content
                                  )}&language=${encodeURIComponent(
                                    category
                                  )}&title=${encodeURIComponent(
                                    studyContent.title
                                  )}&problem_description=${encodeURIComponent(
                                    section.problem_description || "코드를 실행하여 결과를 확인하세요."
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
                                  `/terminal?language=${encodeURIComponent(
                                    category
                                  )}&code=${encodeURIComponent(
                                    section.content
                                  )}&title=${encodeURIComponent(
                                    studyContent.title
                                  )}&problem_description=${encodeURIComponent(
                                    section.problem_description || "코드를 실행하여 결과를 확인하세요."
                                  )}`
                                )
                              }
                              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                            >
                              터미널 실습 →
                            </button>
                          ) : (
                            category.toLowerCase() === "javascript" && (
                              <button
                                onClick={() =>
                                  window.alert("❗️ HTML/DOM 코드가 포함된 학습자료는 실행할 수 없습니다.")
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
  );
};

export default StudyMaterialsPage;