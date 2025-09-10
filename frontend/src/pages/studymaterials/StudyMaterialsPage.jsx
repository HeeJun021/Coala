import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "../../context/AuthContext";
import { HelpCircle, Code, PlayCircle, CheckCircle, FileText} from "lucide-react";
import StudyMaterialsGuideModal from "../../components/studymaterials/StudyMaterialsGuideModal";
import { searchStudy } from "../../api/studyMaterialsApi";
import { Search } from "lucide-react";

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
  const [fadeIn, setFadeIn] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState({});
  const [submittedStatus, setSubmittedStatus] = useState({});
  const [correctStatus, setCorrectStatus] = useState({});
  const [quizIndices, setQuizIndices] = useState([]);

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showGuideTooltip, setShowGuideTooltip] = useState(false);

  // 모달 딥링크를 위한 초기 탭/스텝
  const [guideInitialTab, setGuideInitialTab] = useState("기능별 가이드");
  const [guideInitialStep, setGuideInitialStep] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchDebounceId, setSearchDebounceId] = useState(null);

  useEffect(() => {
  if (searchDebounceId) clearTimeout(searchDebounceId);
  if (!searchQuery || searchQuery.trim().length < 2) {
    setSearchResults([]);
    setSearchLoading(false);
    return;
  }
  const id = setTimeout(async () => {
    setSearchLoading(true);
    const data = await searchStudy(searchQuery, 50);
    setSearchResults(data);
    setSearchLoading(false);
  }, 250);
  setSearchDebounceId(id);
  // cleanup
  return () => clearTimeout(id);
}, [searchQuery]);

  // 초기 스크롤 복원
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

  // 가이드 버튼 dot
  useEffect(() => {
    const seen = localStorage.getItem("study_guide_seen");
    if (seen !== "true") setShowGuideTooltip(true);
  }, []);

  // 콘텐츠 로드
  useEffect(() => {
    setFadeIn(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const timeout = setTimeout(() => setFadeIn(true), 100);

    // ✅ 언어/자료 미선택 시: 로딩 해제하고 가이드 카드만 보여줌
    if (!category || (!materialId && !exampleId)) {
      setStudyContent(null);
      setLoading(false);
      return () => clearTimeout(timeout);
    }

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

  // 랜딩 가이드(루시드 아이콘 4카드 + 모달 딥링크)
  const renderLandingGuide = () => (
    <div className="flex flex-col items-center text-center py-8 px-6">
      <h1 className="flex items-center text-3xl font-extrabold text-gray-800 tracking-wide mb-4">
  학습자료
</h1>
      <p className="text-gray-600 text-lg max-w-xl mb-10 leading-relaxed">
        좌측 <span className="font-semibold text-green-600">사이드바</span>에서 원하는 언어를 선택하세요.
        이 페이지에서는 <span className="font-semibold">개념</span>, <span className="font-semibold">코드</span>,{" "}
        <span className="font-semibold">이미지 & 동영상</span>, <span className="font-semibold">퀴즈</span>로 학습할 수 있어요.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
        {/* 1. 개념 학습 */}
        <button
          onClick={() => { setGuideInitialTab("기능별 가이드"); setGuideInitialStep(1); setIsGuideOpen(true); }}
          className="bg-white border border-gray-200 rounded-2xl p-6 text-left shadow hover:shadow-lg transition flex flex-col items-start"
          title="개념 학습 가이드"
        >
          <FileText className="w-8 h-8 text-blue-500 mb-3" />
          <div className="text-lg font-semibold text-gray-800">텍스트 학습</div>
          <div className="text-sm text-gray-600 mt-1">텍스트 섹션으로 핵심 개념을 쉽게 익혀요.</div>
        </button>

        {/* 2. 코드 예제 */}
        <button
          onClick={() => { setGuideInitialTab("기능별 가이드"); setGuideInitialStep(2); setIsGuideOpen(true); }}
          className="bg-white border border-gray-200 rounded-2xl p-6 text-left shadow hover:shadow-lg transition flex flex-col items-start"
          title="코드 예제 가이드"
        >
          <Code className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-lg font-semibold text-gray-800">코드 예제</div>
          <div className="text-sm text-gray-600 mt-1">코드를 보고, 실행하고, 실습해요.</div>
        </button>

        {/* 3. 이미지 & 동영상 */}
        <button
          onClick={() => { setGuideInitialTab("기능별 가이드"); setGuideInitialStep(4); setIsGuideOpen(true); }}
          className="bg-white border border-gray-200 rounded-2xl p-6 text-left shadow hover:shadow-lg transition flex flex-col items-start"
          title="이미지 & 동영상 가이드"
        >
          <PlayCircle className="w-8 h-8 text-red-500 mb-3" />
          <div className="text-lg font-semibold text-gray-800">이미지 & 동영상</div>
          <div className="text-sm text-gray-600 mt-1">시각 자료로 직관적으로 이해해요.</div>
        </button>

        {/* 4. 퀴즈 */}
        <button
          onClick={() => { setGuideInitialTab("퀴즈"); setGuideInitialStep(0); setIsGuideOpen(true); }}
          className="bg-white border border-gray-200 rounded-2xl p-6 text-left shadow hover:shadow-lg transition flex flex-col items-start"
          title="퀴즈 가이드"
        >
          <CheckCircle className="w-8 h-8 text-purple-600 mb-3" />
          <div className="text-lg font-semibold text-gray-800">퀴즈</div>
          <div className="text-sm text-gray-600 mt-1">배운 내용을 문제로 확인해요.</div>
        </button>
      </div>
    </div>
  );

  const handleGuideClick = () => {
    setIsGuideOpen(true);
    setShowGuideTooltip(false);
    localStorage.setItem("study_guide_seen", "true");
  };

  const formatCodeContent = (content) =>
    content.replace(/<br>/g, "\n").replace(/\\n/g, "\n");

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
        await fetch(endpoint, { method: "POST", credentials: "include" });
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

  const showCodeTestButton = (category) =>
    ["html", "css"].includes(category?.toLowerCase());

  return (
    <div className="w-full min-h-screen pt-4 pl-[280px] bg-[#F9FAFB]">
      <div
        className={`max-w-5xl ml-28 mr-auto mt-16 bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative transition-opacity duration-500 ${
          fadeIn ? "opacity-100" : "opacity-0"
        }`}
      >

        <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setSearchQuery(""); }}
            placeholder="예: div, flex, event loop … (2자 이상)"
            className="w-full pl-10 pr-3 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {(searchQuery && searchQuery.trim().length >= 2) && (
          <div className="mt-3 rounded-xl border bg-white divide-y">
            {searchLoading ? (
              <div className="p-4 text-gray-500">검색 중…</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-gray-500">검색 결과가 없습니다.</div>
            ) : (
              searchResults.map((item, idx) => (
                <button
                  key={`${item.item_type}-${item.id}-${idx}`}
                  className="w-full text-left p-4 hover:bg-gray-50 transition flex flex-col"
                  onClick={() => {
                    const lang = encodeURIComponent(item.language);
                    if (item.item_type === "material") {
                      navigate(`/StudyMaterialsPage?category=${lang}&id=${item.id}`);
                    } else {
                      navigate(`/StudyMaterialsPage?category=${lang}&exampleId=${item.id}`);
                    }
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  title={`${item.language} • ${item.item_type === "material" ? "학습자료" : "예제"}`}
                >
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="px-2 py-0.5 rounded bg-gray-100">{item.language}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      {item.item_type === "material" ? "학습자료" : "예제"}
                    </span>
                  </div>
                  <div className="mt-1 font-semibold text-gray-900">{item.title}</div>
                  <div className="mt-0.5 text-sm text-gray-600 line-clamp-2">{item.snippet}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
        {/* ✅ 선택 전에는 항상 가이드, 선택 후 로딩중에는 '로딩 중...' + 가이드 */}
        {!category && !materialId && !exampleId ? (
          renderLandingGuide()
        ) : loading ? (
          <>
            <div className="text-gray-500 mb-6">로딩 중...</div>
            {renderLandingGuide()}
          </>
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

            {Array.isArray(studyContent.sections) &&
              studyContent.sections.length > 0 && (
                <div className="mt-6">
                  {studyContent.sections.map((section, index) => (
                    <React.Fragment key={`${section.type}-${index}`}>
                      <div className="mt-4" style={parseStyleString(section.style)}>
                        {section.type === "text" && (
                          <div
                            className="text-[17px] text-gray-800 [&_b]:font-bold [&_b]:text-green-600"
                            dangerouslySetInnerHTML={{ __html: section.content }}
                          />
                        )}

                        {section.type === "image" && (
                          <img
                            className="mt-2 w-full max-w-2xl rounded-lg shadow-md mx-auto"
                            src={`http://localhost:8000${section.content}`}
                            alt={section.description || "설명 이미지"}
                            onError={() =>
                              console.error(`Failed to load image: ${section.content}`)
                            }
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
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">
                              {section.title}
                            </h2>

                            <div className="fade-in">
                              <SyntaxHighlighter
                                language={(() => {
                                  const lang = category?.toLowerCase();
                                  if (lang === "html") return "html";
                                  if (lang === "css") return "css";
                                  if (lang === "javascript" || lang === "js")
                                    return "javascript";
                                  if (lang === "python" || lang === "py") return "python";
                                  return "text";
                                })()}
                                style={dracula}
                                className="rounded-md"
                                wrapLines={true}
                                customStyle={{ whiteSpace: "pre-wrap", fontSize: "15px" }}
                              >
                                {formatCodeContent(section.content)}
                              </SyntaxHighlighter>
                            </div>

                            <p className="mt-2 text-sm text-gray-600">
                              {section.problem_description}
                            </p>

                            <div className="flex gap-2 mt-4">
                              {showCodeTestButton(category) && (
                                <button
                                  onClick={() => {
                                    localStorage.setItem(
                                      "study_scroll_position",
                                      window.scrollY
                                    );
                                    navigate(
                                      `/codetest?code=${encodeURIComponent(
                                        section.content
                                      )}&language=${encodeURIComponent(
                                        category
                                      )}&title=${encodeURIComponent(
                                        studyContent.title
                                      )}&problem_description=${encodeURIComponent(
                                        section.problem_description || ""
                                      )}&category=${encodeURIComponent(category)}&${
                                        materialId
                                          ? `id=${encodeURIComponent(materialId)}`
                                          : `exampleId=${encodeURIComponent(exampleId)}`
                                      }`
                                    );
                                  }}
                                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                                >
                                  코드 테스트 →
                                </button>
                              )}

                              {showTerminalButton(
                                category,
                                studyContent.title,
                                section.content
                              ) ? (
                                <button
                                  onClick={() => {
                                    localStorage.setItem(
                                      "study_scroll_position",
                                      window.scrollY
                                    );
                                    navigate(
                                      `/terminal?language=${encodeURIComponent(
                                        category
                                      )}&code=${encodeURIComponent(
                                        section.content
                                      )}&title=${encodeURIComponent(
                                        studyContent.title
                                      )}&problem_description=${encodeURIComponent(
                                        section.problem_description || ""
                                      )}&category=${encodeURIComponent(
                                        category
                                      )}&${
                                        materialId
                                          ? `id=${encodeURIComponent(materialId)}`
                                          : `exampleId=${encodeURIComponent(exampleId)}`
                                      }`
                                    );
                                  }}
                                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                                >
                                  터미널 실습 →
                                </button>
                              ) : (
                                category?.toLowerCase() === "javascript" &&
                                (section.content.includes("<html>") ||
                                  section.content.includes("<body>")) && (
                                  <button
                                    onClick={() =>
                                      window.alert(
                                        "❗ HTML/DOM 코드가 포함된 학습자료는 실행할 수 없습니다."
                                      )
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
                            <p className="text-lg text-center">
                              {section.content.question}
                            </p>
                            <div className="mt-4">
                              {section.content.options.map((option, optIdx) => (
                                <label
                                  key={optIdx}
                                  className={`block bg-gray-700 rounded-md p-3 my-2 cursor-pointer transition-all ${
                                    selectedOptions[index] === option
                                      ? "ring-2 ring-green-400"
                                      : ""
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
                              onClick={() =>
                                handleSubmit(index, section.content.correct_answer)
                              }
                              className={`mt-4 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition ${
                                selectedOptions[index] == null
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={selectedOptions[index] == null}
                            >
                              정답 제출 →
                            </button>
                            {submittedStatus[index] && (
                              <div className="mt-3 text-center">
                                <p
                                  className={
                                    correctStatus[index]
                                      ? "text-green-400"
                                      : "text-red-500"
                                  }
                                >
                                  {correctStatus[index]
                                    ? "✅ 정답입니다!"
                                    : "❌ 오답입니다!"}
                                </p>
                                {correctStatus[index] && (
                                  <p
                                    className="text-sm text-gray-300 mt-2 [&_b]:font-bold [&_b]:text-green-400"
                                    dangerouslySetInnerHTML={{
                                      __html: section.content.explanation,
                                    }}
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

        {/* 완료 배너 */}
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

        {/* 가이드 모달(카드→모달 딥링크 지원) */}
        <StudyMaterialsGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          initialTab={guideInitialTab}
          initialStep={guideInitialStep}
        />
      </div>
    </div>
  );
};

export default StudyMaterialsPage;
