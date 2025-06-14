import React, { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { Eye, RotateCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { getCorrectSolutions, getCodingTestDetail } from "../api/codingTestApi";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";

const getPrismLang = (lang) => {
  if (lang.toLowerCase() === "python") return "python";
  if (lang.toLowerCase() === "java") return "java";
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
      sol.language.toLowerCase() === selectedLang.toLowerCase();
    const matchesTab = activeTab === "all" || sol.user_id === user?.user_id;
    return matchesLanguage && matchesTab;
  });

  const totalPages = Math.ceil(filteredSolutions.length / itemsPerPage);
  const currentItems = filteredSolutions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full min-h-screen bg-white text-gray-900 flex flex-col">
      {/* ✅ 상단 헤더 */}
      <header className="flex items-center justify-between bg-gray-100 px-6 py-4 border-b">
        <h1 className="text-xl font-bold">{problemTitle}</h1>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-1 bg-green-600 text-white hover:bg-green-700 px-3 py-1 text-sm rounded"
            onClick={() => navigate(`/codingtest/${testId}`)}
          >
            <Eye className="w-4 h-4" />
            문제 보기
          </button>

          <button
            className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 text-sm rounded"
            onClick={() => navigate(`/codingtest/${testId}`)}
          >
            <RotateCw className="w-4 h-4" />
            다시 풀기
          </button>
        </div>
      </header>

      {/* ✅ 중간 필터 */}
      <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
        <div className="flex gap-2 mt-10 mb-2 self-start">
          <button
            className={`px-4 py-2 rounded text-sm font-semibold ${
              activeTab === "all"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => setActiveTab("all")}
          >
            모든 풀이
          </button>
          <button
            className={`px-4 py-2 rounded text-sm font-semibold ${
              activeTab === "mine"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => setActiveTab("mine")}
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

      {/* ✅ 풀이 목록 */}
      {loading ? (
        <p className="text-gray-500 text-center">불러오는 중...</p>
      ) : currentItems.length === 0 ? (
        <p className="text-gray-500 text-center">조회된 코드가 없습니다.</p>
      ) : (
        <>
          <div className="flex flex-col gap-10 mb-10">
            {currentItems.map((sol, index) => (
              <div key={index} className="max-w-4xl mx-auto w-full">
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

                <div className="bg-gray-100 rounded-md p-4">
                  <Editor
                    value={sol.code}
                    onValueChange={() => {}}
                    highlight={(code) =>
                      Prism.highlight(
                        code,
                        Prism.languages[getPrismLang(sol.language)],
                        sol.language
                      )
                    }
                    padding={12}
                    readOnly
                    textareaClassName="editor-textarea"
                    preClassName="editor-pre"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ✅ 페이지네이션 */}
          <div className="flex justify-center gap-2 mb-10">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentPage(i + 1);
                  window.scrollTo({ top: 0 });
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
