import React, { useEffect, useState, useCallback } from "react";
import { HiOutlineRefresh } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import {
  getCodingTestDetail,
  getStarterCode,
  getSubmissionList,
} from "../api/codingTestApi";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "../index.css";

const CodingTestDetailPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [code, setCode] = useState("// 여기에 코드를 입력하세요.");
  const [result, setResult] = useState("");
  const [selectedLine, setSelectedLine] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [submissions, setSubmissions] = useState([]);
  const [showRefreshMessage, setShowRefreshMessage] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const problemData = await getCodingTestDetail(id);
        setProblem(problemData);

        const starter = await getStarterCode(language);
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

  const handleRunCode = () => {
    setResult("실행 결과가 여기에 표시됩니다.");
  };

  const handleResetCode = async () => {
    try {
      const starter = await getStarterCode(language);
      const formattedCode = starter.code.replace(/\\n/g, "\n"); // 🔥 추가
      setCode(formattedCode);
      setResult("");
    } catch (err) {
      console.error("초기화 실패:", err);
    }
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
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
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
                    정답률 {problem.correct_rate || 0}%
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
                        <div className="flex items-center bg-[#2c3544] p-2 rounded justify-between whitespace-pre-wrap">
                          <span>{ex.input.replace(/\\n/g, "\n")}</span>
                          <span className="text-gray-400 text-xs">복사</span>
                        </div>
                        <p className="text-xs text-gray-300 mt-2 mb-1">출력</p>
                        <div className="flex items-center bg-[#2c3544] p-2 rounded justify-between">
                          <span>{ex.output}</span>
                          <span className="text-gray-400 text-xs">복사</span>
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
                      <th className="p-2">제출일시</th>
                      <th className="p-2">언어</th>
                      <th className="p-2">결과</th>
                      <th className="p-2">제출 메모리</th>
                      <th className="p-2">통과율</th>
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
                          <td className="p-2">{s.submitted_at}</td>
                          <td className="p-2">{s.language}</td>
                          <td className="p-2">{s.is_correct ? "✅" : "❌"}</td>
                          <td className="p-2">{s.memory}</td>
                          <td className="p-2">
                            {s.total_test_cases > 0
                              ? `${Math.round(
                                  (s.passed_test_cases / s.total_test_cases) *
                                    100
                                )}%`
                              : "0%"}
                          </td>
                        </tr>
                        {s.open && (
                          <tr className="border-b border-gray-600 bg-[#2c3544]">
                            <td colSpan="5" className="p-3 relative">
                              <button
                                onClick={() =>
                                  navigator.clipboard.writeText(s.code)
                                }
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
              className="flex-1 overflow-auto p-4 editor-wrapper"
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
            <div className="border-t border-gray-600 p-2 text-sm h-24">
              <strong>실행 결과</strong>
              <p className="mt-2">
                {result || "실행 결과가 여기에 표시됩니다."}
              </p>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-between items-center p-3 border-t border-gray-600 bg-[#2c3544]">
          <button className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition">
            질문 게시판 이동하기
          </button>
          <div className="flex gap-2">
            <button className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition">
              다른 사람의 풀이
            </button>
            <button
              onClick={handleResetCode}
              className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition"
            >
              초기화
            </button>
            <button
              onClick={handleRunCode}
              className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition"
            >
              코드 실행
            </button>
            <button className="text-xs bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition">
              코드 제출 후 채점
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CodingTestDetailPage;
