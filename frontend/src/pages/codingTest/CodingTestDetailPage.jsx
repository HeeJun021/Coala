// 📦 React & 라이브러리
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// 🖍️ PrismJS (코드 하이라이트 + 라인 넘버)
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";

// 🔥 라인 넘버 플러그인
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";

// 🔗 API
import {
  getCodingTestDetail,
  getStarterCode,
  getSubmissionList,
  runCodeWithTestcases,
  submitCode,
  checkHasSolved,
} from "../../api/codingTestApi";

// 🧩 컴포넌트
import ResultModal from "../../components/CodingTest/modal/ResultModal";
import WrongNoteEditor from "../../components/WrongNoteEditor";

// 🎨 스타일
import "react-resizable/css/styles.css";
import "../../index.css";

// 리팩토링 임포트
import CodingTestHeader from "../../components/CodingTest/CodingTestHeader";
import CodingTestTabMenu from "../../components/CodingTest/CodingTestTabMenu";
import CodingTestProblemInfo from "../../components/CodingTest/CodingTestProblemInfo";
import CodingTestSubmissionList from "../../components/CodingTest/CodingTestSubmissionList";
import CodingTestEditorPanel from "../../components/CodingTest/CodingTestEditorPanel";
import CodingTestFooterButtons from "../../components/CodingTest/CodingTestFooterButtons";

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
  const [hasSolvedBefore, setHasSolvedBefore] = useState(false);

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

  useEffect(() => {
    const fetchHasSolved = async () => {
      try {
        if (user?.user_id && id) {
          const result = await checkHasSolved(id);
          if (result?.data && typeof result.data.hasSolved === "boolean") {
            setHasSolvedBefore(result.data.hasSolved); // ✅ 여기서 추출
          } else {
            console.error("⚠️ 응답에 hasSolved 필드가 없습니다:", result);
            setHasSolvedBefore(false);
          }
        }
      } catch (err) {
        console.error("풀이 여부 확인 실패:", err);
        setHasSolvedBefore(false);
      }
    };

    fetchHasSolved();
  }, [user, id]);

  // 실행 버튼 핸들러
  const handleRunCode = async () => {
    if (!problem) return;

    setIsSubmitResult(false); // 제출 실행 결과가 아님
    setIsRunning(true); // ✅ 실행 중 상태 시작

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
    } finally {
      setIsRunning(false); // ✅ 실행 중 상태 종료
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
      setIsSubmitResult(true);
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
          rating: res.current_rating,
          ratingDiff: res.rating_diff || 0,
          isFirstCorrect: res.is_first_correct,
          eucalyptusReward: res.eucalyptus_reward || 0,
          executionTime: res.execution_time,
          memoryUsed: res.memory_used,
          timeLimitExceeded: res.time_limit_exceeded,
          memoryLimitExceeded: res.memory_limit_exceeded,
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
    return <div className="text-gray-600 p-10">문제 불러오는 중...</div>;

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
              className="bg-teal-500 text-white text-sm px-6 py-3 rounded-md shadow-md"
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
              className="bg-teal-500 text-white text-sm px-6 py-3 rounded-md shadow-md"
            >
              복사 완료!
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="codingtest-detail w-screen h-screen bg-[#f9fafb] text-gray-800 flex flex-col">
        {/* 상단 헤더 */}
        <CodingTestHeader title={problem.title} />

        <CodingTestTabMenu
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          fetchSubmissions={fetchSubmissions}
          language={language}
          handleLanguageChange={handleLanguageChange}
          handleRunCode={handleRunCode}
          isRunning={isRunning}
          problem={problem}
        />

        {/* 콘텐츠 영역 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 좌측 영역 */}
          <div
            className={`${
              activeTab === "notes" ? "w-full" : "w-1/2"
            } p-6 overflow-y-auto problem-info-scrollbar 
     bg-white border-r border-gray-200 shadow-inner rounded-tr-xl`}
          >
            {activeTab === "info" && (
              <CodingTestProblemInfo
                problem={problem}
                setShowCopyMessage={setShowCopyMessage}
              />
            )}

            {activeTab === "submissions" && (
              <CodingTestSubmissionList
                submissions={submissions}
                setSubmissions={setSubmissions}
                fetchSubmissions={handleRefreshSubmissions}
                showCopyMessage={showCopyMessage}
                setShowCopyMessage={setShowCopyMessage}
                getPrismLang={getPrismLang}
              />
            )}

            {activeTab === "notes" &&
              (user ? (
                <WrongNoteEditor
                  submissionList={submissions}
                  setSubmissionList={setSubmissions}
                  codeSnapshot={code}
                  testResults={executionResults}
                  testId={problem.id}
                  userId={user.user_id}
                  key={activeTab}
                />
              ) : (
                <div className="text-gray-500 text-center mt-10">
                  오답노트는 로그인 후 이용할 수 있습니다. 😎
                </div>
              ))}
          </div>

          {/* 우측 영역 - 코드 에디터 + 실행결과는 notes 탭 아닐 때만 */}
          {activeTab !== "notes" && (
            <CodingTestEditorPanel
              code={code}
              setCode={setCode}
              language={language}
              handleClick={handleClick}
              highlightWithLineNumbers={highlightWithLineNumbers}
              HoverHandle={HoverHandle}
              executionResults={executionResults}
              isSubmitResult={isSubmitResult}
              isRunning={isRunning}
            />
          )}
        </div>

        <CodingTestFooterButtons
          problem={problem}
          activeTab={activeTab}
          handleResetCode={handleResetCode}
          handleRunCode={handleRunCode}
          handleSubmitCode={handleSubmitCode}
          isSubmitting={isSubmitting}
          hasSolvedBefore={hasSolvedBefore}
        />
      </div>
      {showResultModal && resultData && (
        <ResultModal
          isCorrect={resultData.isCorrect}
          passed={resultData.passed}
          total={resultData.total}
          testId={problem.id}
          onClose={() => setShowResultModal(false)}
          rating={resultData.rating}
          ratingDiff={resultData.ratingDiff}
          isFirstCorrect={resultData.isFirstCorrect}
          eucalyptusReward={resultData.eucalyptusReward}
          executionTime={resultData.executionTime}
          memoryUsed={resultData.memoryUsed}
          timeLimitExceeded={resultData.timeLimitExceeded}
          memoryLimitExceeded={resultData.memoryLimitExceeded}
        />
      )}
    </>
  );
};
export default CodingTestDetailPage;
