import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import { getCodingTestDetail, getStarterCode } from "../api/codingTestApi";
import "prismjs/components/prism-javascript";
import "../index.css";

const CodingTestDetailPage = () => {
  const { id } = useParams();

  const [problem, setProblem] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [code, setCode] = useState("// 여기에 코드를 입력하세요.");
  const [result, setResult] = useState("");
  const [selectedLine, setSelectedLine] = useState(null);
  const [language, setLanguage] = useState("javascript");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const problemData = await getCodingTestDetail(id);
        setProblem(problemData);

        const starter = await getStarterCode(language);
        const formattedCode = starter.code.replace(/\\n/g, "\n"); // ← 여기 중요!
        setCode(formattedCode);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [id, language]);

  const handleRunCode = () => {
    setResult("실행 결과가 여기에 표시됩니다.");
  };

  const handleResetCode = async () => {
    try {
      const starter = await getStarterCode(language);
      setCode(starter.code);
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

  if (!problem) {
    return <div className="text-white p-10">문제 불러오는 중...</div>;
  }

  return (
    <div className="w-screen h-screen bg-[#3d4d63] text-white flex flex-col">
      {/* 상단 헤더 */}
      <header className="flex items-center justify-between bg-[#2c3544] px-6 py-3">
        <h1 className="text-xl font-bold">{problem.title}</h1>
      </header>

      {/* 탭 메뉴 */}
      <div className="flex gap-4 border-b border-gray-600 px-6">
        {["info", "submissions", "notes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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

      {/* 콘텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 문제 정보 */}
        <div className="w-1/2 p-6 overflow-y-auto">
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
              <p className="whitespace-pre-line">{problem.input_format}</p>
            </div>
            <div>
              <hr className="border-gray-500 my-2" />
              <h2 className="font-semibold mb-2">출력 형식</h2>
              <p className="whitespace-pre-line">{problem.output_format}</p>
            </div>
            <div>
              <hr className="border-gray-500 mb-2" />
              <h2 className="font-semibold mb-2">제약조건</h2>
              {problem.constraints.map((con, idx) => (
                <div key={idx} className="text-sm whitespace-pre-line mb-2">
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
        </div>

        {/* 우측 코드 영역 */}
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
            <p className="mt-2">{result || "실행 결과가 여기에 표시됩니다."}</p>
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
  );
};

export default CodingTestDetailPage;
