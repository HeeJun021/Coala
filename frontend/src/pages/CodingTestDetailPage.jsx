import React, { useEffect, useState, useCallback } from "react";
import { cleanStderr } from "../utils/cleanStderr";
import { HiOutlineRefresh } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ResizableBox } from "react-resizable";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import {
  getCodingTestDetail,
  getStarterCode,
  getSubmissionList,
  runCodeWithTestcases,
  submitCode,
} from "../api/codingTestApi";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "react-resizable/css/styles.css"; // 스타일 추가
import "../index.css";
import ResultModal from "../components/ResultModal"; // 상단에 추가

const CodingTestDetailPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [code, setCode] = useState("// 여기에 코드를 입력하세요.");
  const [selectedLine, setSelectedLine] = useState(null);
  const [language, setLanguage] = useState("python");
  const [submissions, setSubmissions] = useState([]);
  const [showRefreshMessage, setShowRefreshMessage] = useState(false);
  const [executionResults, setExecutionResults] = useState([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitResult, setIsSubmitResult] = useState(false);
  const [showCopyMessage, setShowCopyMessage] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const problemData = await getCodingTestDetail(id);
        setProblem(problemData);

        const starter = await getStarterCode(id, language);
        const formattedCode = starter.code.replace(/\\n/g, "\n");
        setCode(formattedCode);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [id, language]);

  const fetchSubmissions = useCallback(async () => {
    try {
      if (user?.user_id) {
        const res = await getSubmissionList(id, user.user_id);
        const withOpen = res.submissions.map((s) => ({
          ...s,
          open: false,
        }));
        setSubmissions(withOpen);
      }
    } catch (err) {
      console.error("제출 내역 불러오기 실패:", err);
    }
  }, [id, user]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleRefreshSubmissions = async () => {
    await fetchSubmissions();
    setShowRefreshMessage(true);
    setTimeout(() => {
      setShowRefreshMessage(false);
    }, 3000);
  };

  // 실행 버튼 핸들러
  const handleRunCode = async () => {
    if (!problem) return;

    setIsSubmitResult(false); // 실행 결과일 때는 제출 결과가 아님!

    try {
      const res = await runCodeWithTestcases(problem.id, code, language);

      const hasPassedAll = res.results.every((r) => r.passed);
      setExecutionResults(res.results);

      if (hasPassedAll) {
        console.log("🎯 모든 테스트 케이스 통과");
      } else {
        console.log("❌ 일부 테스트 케이스 실패");
      }
    } catch (err) {
      console.error("코드 실행 중 에러:", err);
      setExecutionResults([
        {
          input: "",
          expected_output: "",
          actual_output: "",
          passed: false,
          stderr: "코드 실행 중 에러 발생",
        },
      ]);
    }
  };

  const handleResetCode = async () => {
    try {
      const starter = await getStarterCode(id, language);
      const formattedCode = starter.code.replace(/\\n/g, "\n"); // 🔥 개행 처리
      setCode(formattedCode);
    } catch (err) {
      console.error("초기화 실패:", err);
    }
  };

  const handleSubmitCode = async () => {
    try {
      setIsSubmitting(true);
      setIsRunning(true);

      const res = await submitCode({
        user_id: user.user_id,
        test_id: problem.id,
        code,
        language,
      });

      // 결과 테이블 먼저 표시
      if (res.all_cases) {
        setExecutionResults(res.all_cases);
      }

      // 🎯 결과 모달은 1초 후 띄우기
      setTimeout(() => {
        setResultData({
          isCorrect: res.is_correct,
          passed: res.passed_test_cases,
          total: res.total_test_cases,
        });
        setShowResultModal(true);
        setIsRunning(false); // 로딩 상태 종료
      }, 1000); // 1초 딜레이
    } catch (err) {
      console.error("제출 중 오류:", err);
      alert("제출 실패");
      setIsRunning(false);
    } finally {
      setIsSubmitting(false);
    }

    fetchSubmissions();
  };

  const HoverHandle = () => {
    const [hover, setHover] = useState(false);

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "3px",
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              width: "40px",
              height: "2px",
              backgroundColor: hover ? "#607D8B" : "#B0BEC5", // 연한 회색 & 진한 회색
              borderRadius: "1px",
              transition: "background-color 0.2s",
            }}
          />
        ))}
      </div>
    );
  };

  const highlightWithLineNumbers = (code) =>
    Prism.highlight(code, Prism.languages.javascript, "javascript")
      .split("\n")
      .map(
        (line, i) =>
          `<span class="${
            selectedLine === i + 1 ? "selected-line" : ""
          }" data-line="${i + 1}">${line}</span>`
      )
      .join("\n");

  const handleClick = (e) => {
    const lineNumber = e.target.getAttribute("data-line-number");
    if (lineNumber) {
      setSelectedLine(Number(lineNumber));
    }
  };

  const handleLanguageChange = async (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
  };

  const getPrismLang = (lang) => {
    if (lang === "python") return "python";
    if (lang === "java") return "java";
    return "javascript";
  };

  if (!problem)
    return <div className="text-white p-10">문제 불러오는 중...</div>;

  return (
    <>
      <AnimatePresence>
        {showRefreshMessage && (
          <div className="fixed top-4 w-full flex justify-center z-[9999]">
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-blue-500 text-white text-sm px-6 py-3 rounded shadow"
            >
              새로고침 되었습니다.
            </motion.div>
          </div>
        )}

        {showCopyMessage && (
          <div className="fixed top-4 w-full flex justify-center z-[9999]">
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-blue-500 text-white text-sm px-6 py-3 rounded shadow"
            >
              복사 완료!
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="codingtest-detail w-screen h-screen bg-[#3d4d63] text-white flex flex-col">
        {/* 상단 헤더 */}
        <header className="flex items-center justify-between bg-[#2c3544] px-6 py-3">
          <h1 className="text-xl font-bold">{problem.title}</h1>
        </header>

        {/* 탭 메뉴 */}
        <div className="flex gap-4 border-b border-gray-600 px-6">
          {["info", "submissions", "notes"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "submissions") {
                  fetchSubmissions();
                }
              }}
              className={`py-3 ${
                activeTab === tab ? "border-b-2 border-white font-semibold" : ""
              }`}
            >
              {tab === "info"
                ? "문제 정보"
                : tab === "submissions"
                ? "제출 내역"
                : "오답노트"}
            </button>
          ))}
          <div className="text-sm flex items-center gap-2 ml-auto">
            <select
              className="bg-[#4b5b6e] text-sm px-2 py-1 rounded text-white"
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 좌측: 문제 정보 or 제출 내역 */}
          <div className="w-1/2 p-6 overflow-y-auto problem-info-scrollbar">
            {activeTab === "info" && (
              <>
                <h2 className="text-2xl font-bold mb-2">{problem.title}</h2>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#e5f4db] text-green-700 text-xs px-2 py-1 rounded">
                      LV.{problem.difficulty}
                    </span>
                    <span className="text-xs text-gray-300">
                      | 카테고리 {problem.category}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300">
                    정답률 {(problem.correct_rate || 0).toFixed(1)}%
                  </div>
                </div>
                <section className="space-y-4 text-sm leading-6">
                  <div>
                    <h2 className="font-semibold mb-2">문제 설명</h2>
                    <p className="whitespace-pre-line">{problem.description}</p>
                  </div>
                  <div>
                    <hr className="border-gray-500 my-2" />
                    <h2 className="font-semibold mb-2">입력 형식</h2>
                    <p className="whitespace-pre-line">
                      {problem.input_format}
                    </p>
                  </div>
                  <div>
                    <hr className="border-gray-500 my-2" />
                    <h2 className="font-semibold mb-2">출력 형식</h2>
                    <p className="whitespace-pre-line">
                      {problem.output_format}
                    </p>
                  </div>
                  <div>
                    <hr className="border-gray-500 mb-2" />
                    <h2 className="font-semibold mb-2">제약조건</h2>
                    {problem.constraints.map((con, idx) => (
                      <div
                        key={idx}
                        className="text-sm whitespace-pre-line mb-2"
                      >
                        {con.description}
                      </div>
                    ))}
                  </div>
                  <div>
                    <hr className="border-gray-500 my-2" />
                    <h2 className="font-semibold mb-2">입출력 예제</h2>
                    {problem.testcases.map((ex, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-500 p-3 mb-2 rounded"
                      >
                        <p className="text-xs text-gray-300 mb-1">입력</p>
                        <div className="flex items-center bg-[#2c3544] p-2 rounded justify-between whitespace-pre-wrap relative">
                          <span>{ex.input.replace(/\\n/g, "\n")}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                ex.input.replace(/\\n/g, "\n")
                              );
                              setShowCopyMessage(true);
                              setTimeout(() => setShowCopyMessage(false), 3000); // 3초 후 사라짐
                            }}
                            className="absolute top-1 right-2 text-xs bg-[#4b5b6e] text-white px-3 py-1 rounded hover:bg-[#5f6f82]"
                            style={{ cursor: "pointer" }}
                          >
                            복사
                          </button>
                        </div>
                        <p className="text-xs text-gray-300 mt-2 mb-1">출력</p>
                        <div className="flex items-center bg-[#2c3544] p-2 rounded justify-between whitespace-pre-wrap relative mt-2">
                          <span>{ex.output}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                ex.input.replace(/\\n/g, "\n")
                              );
                              setShowCopyMessage(true);
                              setTimeout(() => setShowCopyMessage(false), 3000); // 3초 후 사라짐
                            }}
                            className="absolute top-1 right-2 text-xs bg-[#4b5b6e] text-white px-3 py-1 rounded hover:bg-[#5f6f82]"
                            style={{ cursor: "pointer" }}
                          >
                            복사
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
            {activeTab === "submissions" && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">제출 내역</h2>
                  <button
                    onClick={handleRefreshSubmissions}
                    className="flex items-center gap-1 text-sm text-gray-300 hover:text-white"
                  >
                    <HiOutlineRefresh className="w-4 h-4" />
                    새로고침
                  </button>
                </div>

                <table className="w-full text-sm text-left">
                  <thead className="border-b border-gray-600 text-gray-300">
                    <tr>
                      <th className="p-2 text-center">제출일시</th>
                      <th className="p-2 text-center">언어</th>
                      <th className="p-2 text-center">결과</th>
                      <th className="p-2 text-center">제출 메모리</th>
                      <th className="p-2 text-center">테스트 케이스 통과 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* submissions map 돌리는 부분 */}
                    {submissions.map((s, idx) => (
                      <React.Fragment key={s.submission_id}>
                        <tr
                          className="border-b border-gray-600 hover:bg-[#2c3544] cursor-pointer"
                          onClick={() =>
                            setSubmissions((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, open: !item.open } : item
                              )
                            )
                          }
                        >
                          <td className="p-2 text-center">{s.submitted_at}</td>
                          <td className="p-2 text-center">{s.language}</td>
                          <td className="p-2 text-center">
                            {s.is_correct ? "✅" : "❌"}
                          </td>
                          <td className="p-2 text-center">{s.memory}</td>
                          <td className="p-2 text-center">
                            {s.passed_test_cases}/{s.total_test_cases}
                          </td>
                        </tr>
                        {s.open && (
                          <tr className="border-b border-gray-600 bg-[#2c3544]">
                            <td colSpan="5" className="p-3 relative">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(s.code);
                                  setShowCopyMessage(true);
                                  setTimeout(
                                    () => setShowCopyMessage(false),
                                    3000
                                  );
                                }}
                                className="absolute top-2 right-2 text-xs bg-[#4b5b6e] text-white px-3 py-1 rounded hover:bg-[#5f6f82] z-10"
                                style={{ cursor: "pointer" }}
                              >
                                📋 복사
                              </button>

                              <Editor
                                value={s.code}
                                onValueChange={() => {}}
                                highlight={(code) =>
                                  Prism.highlight(
                                    code,
                                    Prism.languages[getPrismLang(s.language)],
                                    s.language
                                  )
                                }
                                padding={12}
                                textareaClassName="editor-textarea"
                                preClassName="editor-pre"
                                readOnly
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* 우측: 코드 에디터 */}
          <div className="w-1/2 flex flex-col border-l border-gray-600 bg-[#3d4d63]">
            <div
              className="flex-1 overflow-auto p-4 editor-wrapper editor-scrollbar"
              onClick={handleClick}
            >
              <Editor
                value={code}
                onValueChange={(newCode) => setCode(newCode)}
                highlight={highlightWithLineNumbers}
                padding={12}
                textareaClassName="editor-textarea"
                preClassName="editor-pre"
              />
            </div>

            <ResizableBox
              width={"100%"}
              height={200}
              minConstraints={[100, 100]}
              maxConstraints={[Infinity, 500]}
              resizeHandles={["n"]}
              handle={
                <span
                  className="react-resizable-handle react-resizable-handle-n"
                  style={{
                    position: "absolute",
                    top: "5px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    height: "16px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "ns-resize",
                    background: "transparent",
                  }}
                >
                  <HoverHandle />
                </span>
              }
            >
              <div className="border-t border-gray-600 p-4 text-sm overflow-auto bg-[#3d4d63] h-full result-scrollbar">
                <h3 className="text-white font-semibold mb-2">
                  {isSubmitResult ? "제출 실행 결과" : "실행 결과"}
                </h3>

                {isRunning ? (
                  <div className="text-gray-300 text-sm mt-3 animate-pulse">
                    ⏳ 제출 실행 중입니다...
                  </div>
                ) : executionResults.length === 0 ? (
                  <div className="text-gray-300 text-sm mt-3">
                    코드 실행 결과가 여기에 표시됩니다.
                  </div>
                ) : (
                  <>
                    <table className="w-full text-left border border-gray-500">
                      <thead>
                        <tr className="bg-[#2c3544] text-white">
                          <th className="p-2 border-r border-gray-500">
                            입력값
                          </th>
                          <th className="p-2 border-r border-gray-500">
                            기댓값
                          </th>
                          <th className="p-2 border-r border-gray-500">
                            실행 결과
                          </th>
                          <th className="p-2">출력</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executionResults.map((result, idx) => (
                          <tr
                            key={idx}
                            className="border-t border-gray-500 text-white"
                          >
                            <td className="p-2 border-r border-gray-500 whitespace-pre-line">
                              {result.input.replace(/\\n/g, "\n")}
                            </td>

                            <td className="p-2 border-r border-gray-500">
                              {result.expected_output}
                            </td>
                            <td className="p-2 border-r border-gray-500">
                              {result.passed ? (
                                <span className="text-blue-400">
                                  테스트를 통과하였습니다.
                                </span>
                              ) : (
                                <span className="text-red-400">
                                  테스트를 통과하지 못했습니다.
                                </span>
                              )}
                            </td>
                            <td className="p-2">
                              {result.actual_output !== undefined &&
                              result.actual_output !== ""
                                ? result.actual_output
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!isRunning && (
                      <>
                        {isSubmitResult ? (
                          <div className="text-gray-300 text-xs mt-3">
                            🎉{" "}
                            <span className="text-green-300 font-medium">
                              정답입니다!
                            </span>
                            <div>테스트케이스를 모두 통과하였습니다.</div>
                          </div>
                        ) : (
                          <p className="text-gray-300 text-xs mt-3">
                            샘플 테스트케이스를 통과했다는 의미로, 작성한 코드가
                            문제의 정답은 아닐 수 있습니다.
                          </p>
                        )}

                        {executionResults.some((r) => r.stderr) && (
                          <div className="bg-[#2b2f38] border border-red-400 rounded-md p-4 mt-4 text-sm text-red-200 whitespace-pre-wrap">
                            <pre className="leading-relaxed text-red-200 font-mono">
                              {cleanStderr(
                                executionResults
                                  .map((r) => r.stderr)
                                  .filter(Boolean)
                                  .join("\n\n")
                              )}
                            </pre>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </ResizableBox>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-between items-center p-3 border-t border-gray-600 bg-[#2c3544]">
          <button className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition">
            질문 게시판 이동하기
          </button>
          <div className="flex gap-2">
            <Link
              to={`/codingtest/correct/${problem.id}`}
              className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition"
            >
              다른 사람의 풀이
            </Link>
            <button
              onClick={handleResetCode}
              className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition"
            >
              초기화
            </button>
            <button
              onClick={handleRunCode}
              disabled={!problem}
              className={`text-xs text-white border border-gray-500 px-3 py-2 rounded transition ${
                !problem ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-600"
              }`}
            >
              코드 실행
            </button>

            <button
              onClick={handleSubmitCode}
              disabled={!problem || isSubmitting}
              className={`text-xs bg-blue-500 text-white px-3 py-2 rounded transition ${
                !problem || isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-600"
              }`}
            >
              {isSubmitting ? "채점 중..." : "코드 제출 후 채점"}
            </button>
          </div>
        </div>
      </div>
      {showResultModal && resultData && (
        <ResultModal
          isCorrect={resultData.isCorrect}
          passed={resultData.passed}
          total={resultData.total}
          onClose={() => setShowResultModal(false)}
          testId={problem.id}
        />
      )}
    </>
  );
};

export default CodingTestDetailPage;
