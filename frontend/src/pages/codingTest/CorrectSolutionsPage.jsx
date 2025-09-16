import React, { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import {
  ChevronLeft,
  RotateCw,
  Copy as CopyIcon,
  Check as CheckIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCorrectSolutions,
  getCodingTestDetail,
} from "../../api/codingTestApi";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";

const getPrismLang = (lang) => {
  if (!lang) return "javascript";
  const low = String(lang).toLowerCase();
  if (low === "python") return "python";
  if (low === "java") return "java";
  return "javascript";
};

const allLanguages = ["Python", "Java", "JavaScript"];

const CorrectSolutionsPage = () => {
  const { user } = useAuth();
  const { testId } = useParams();
  const navigate = useNavigate();
  const [solutions, setSolutions] = useState([]);
  const [problemTitle, setProblemTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState("전체");
  const [activeTab, setActiveTab] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 복사 상태 (인덱스별)
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [solutionRes, detailRes] = await Promise.all([
          getCorrectSolutions(testId),
          getCodingTestDetail(testId),
        ]);
        setSolutions(solutionRes);
        setProblemTitle(detailRes.title);
      } catch (err) {
        console.error("데이터 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [testId]);

  const filteredSolutions = solutions.filter((sol) => {
    const matchesLanguage =
      selectedLang === "전체" ||
      sol.language?.toLowerCase() === selectedLang.toLowerCase();
    const matchesTab = activeTab === "all" || sol.user_id === user?.user_id;
    return matchesLanguage && matchesTab;
  });

  const totalPages = Math.ceil(filteredSolutions.length / itemsPerPage);
  const currentItems = filteredSolutions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCopy = async (code, idx) => {
    try {
      await navigator.clipboard.writeText(code ?? "");
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 3000);
    } catch (e) {
      console.error("클립보드 복사 실패:", e);
    }
  };

  // 언어 뱃지 텍스트
  const renderLangLabel = (lang) => {
    const l = (lang || "").toLowerCase();
    if (l === "python") return "Python";
    if (l === "java") return "Java";
    if (l === "javascript") return "JavaScript";
    return "Code";
  };

  return (
    <div className="w-full min-h-screen bg-white text-gray-900 flex flex-col">
      {/* 상단 헤더 (CodingTestHeader와 크기/톤 맞춤) */}
      <header className="flex items-center justify-between bg-gray-100 border-b border-gray-300 px-6 py-3">
        {/* 왼쪽: 뒤로가기 + 제목 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700 transition"
            aria-label="뒤로가기"
            title="뒤로가기"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">{problemTitle}</h1>
        </div>

        {/* 오른쪽: 다시 풀기 */}
        <div className="flex gap-2">
          <button
            className="flex items-center gap-1 bg-green-600 text-white hover:bg-green-700 px-3 py-1 text-sm rounded"
            onClick={() => navigate(`/codingtest/${testId}`)}
          >
            <RotateCw className="w-4 h-4" />
            다시 풀기
          </button>
        </div>
      </header>

      {/* 중간 필터 */}
      <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
        <div className="flex gap-2 mt-10 mb-2 self-start">
          <button
            className={`px-4 py-2 rounded text-sm font-semibold ${
              activeTab === "all"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
          >
            모든 풀이
          </button>
          <button
            className={`px-4 py-2 rounded text-sm font-semibold ${
              activeTab === "mine"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => {
              setActiveTab("mine");
              setCurrentPage(1);
            }}
          >
            나의 풀이
          </button>
        </div>

        <p className="text-gray-500 text-sm mb-4 self-start">
          정답으로 처리된 문제들만 표시됩니다.
        </p>

        <div className="flex justify-end w-full mb-6">
          <select
            value={selectedLang}
            onChange={(e) => {
              setSelectedLang(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white text-black px-3 py-1.5 rounded border text-sm"
          >
            <option value="전체">전체 언어</option>
            {allLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 풀이 목록 */}
      {loading ? (
        <p className="text-gray-500 text-center">불러오는 중...</p>
      ) : currentItems.length === 0 ? (
        <p className="text-gray-500 text-center">조회된 코드가 없습니다.</p>
      ) : (
        <>
          <div className="flex flex-col gap-10 mb-10">
            {currentItems.map((sol, index) => (
              <div key={index} className="max-w-4xl mx-auto w-full">
                {/* 작성자 */}
                <div className="text-sm text-gray-600 mb-2 flex items-center">
                  {sol.profile_image_url ? (
                    <img
                      src={sol.profile_image_url}
                      alt="프로필 이미지"
                      className="w-8 h-8 rounded-full mr-2 object-cover"
                    />
                  ) : (
                    <FaUserCircle className="w-8 h-8 text-gray-400 mr-2" />
                  )}
                  <span>{sol.nickname}</span>
                </div>

                {/* ▶ 코드 카드: SelfCodingEditorPanel 톤 매칭 */}
                <div className="rounded-md border border-gray-300 overflow-hidden bg-white">
                  {/* 상단 바: 연회색, 좌측 파일/언어, 우측 복사 버튼 */}
                  <div className="flex items-center justify-between bg-[#f3f3f3] border-b border-gray-300 px-3 py-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      {/* 언어 뱃지 */}
                      <span className="px-2 py-0.5 rounded text-[12px] border border-gray-300 bg-white text-gray-700">
                        {renderLangLabel(sol.language)}
                      </span>
                      {sol.filename && (
                        <span className="text-gray-700">{sol.filename}</span>
                      )}
                    </div>

                    {/* 복사 버튼 (배지형) */}
                    <button
                      onClick={() => handleCopy(sol.code, index)}
                      className={`text-[12px] px-2 py-0.5 rounded border shadow-sm transition flex items-center gap-1 ${
                        copiedIndex === index
                          ? "bg-[#e2e8f0] text-gray-700 border-gray-300"
                          : "bg-[#edf2f7] text-gray-800 hover:bg-[#e2e8f0] border-gray-300"
                      }`}
                      aria-label="코드 복사"
                      title="코드 복사"
                    >
                      {copiedIndex === index ? (
                        <>
                          <CheckIcon className="w-4 h-4" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-4 h-4" />
                          복사
                        </>
                      )}
                    </button>
                  </div>

                  {/* 코드 영역: githubLight 느낌(화이트 배경 + 얇은 보더 느낌 유지) */}
                  <div className="p-3">
                    <Editor
                      value={sol.code}
                      onValueChange={() => {}}
                      highlight={(code) =>
                        Prism.highlight(
                          code,
                          Prism.languages[getPrismLang(sol.language)],
                          getPrismLang(sol.language)
                        )
                      }
                      padding={12}
                      readOnly
                      textareaClassName="editor-textarea"
                      preClassName="editor-pre"
                      style={{
                        fontFamily:
                          "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        fontSize: "0.85rem",
                        backgroundColor: "#ffffff",
                        lineHeight: 1.55,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          <div className="flex justify-center gap-2 mb-10">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentPage(i + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-3 py-1 rounded border text-sm ${
                  currentPage === i + 1
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-800 hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CorrectSolutionsPage;
