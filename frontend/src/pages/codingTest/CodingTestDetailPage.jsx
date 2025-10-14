// React & 라이브러리
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// PrismJS (코드 하이라이트 + 라인 넘버)
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";

// API
import {
  getCodingTestDetail,
  getStarterCode,
  getSubmissionList,
  runCodeWithTestcases,
  submitCodingTest,
  checkHasSolved,
  getStarterCodeByPref,
} from "../../api/codingTestApi";

// 컴포넌트
import ConfirmSubmissionModal from "../../components/CodingTest/modal/ConfirmSubmissionModal";
import ResultModal from "../../components/CodingTest/modal/ResultModal";
import WrongNoteEditor from "../../components/WrongNoteEditor";

// 스타일
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
  const { id, testId } = useParams();
  const codingTestId = id || testId; // ✅ 경로별 ID 통일

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 문제 + 스타터 코드 불러오기
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        if (!codingTestId) return;

        // 1) 문제 상세
        const problemData = await getCodingTestDetail(codingTestId);
        setProblem(problemData);

        // 2) 초기 스타터코드 결정
        let starter;
        if (user?.user_id) {
          try {
            // 로그인: 선호 언어 → 없으면 python
            starter = await getStarterCodeByPref(codingTestId);
          } catch {
            starter = await getStarterCode(codingTestId, "python");
          }
        } else {
          // 비로그인: python 고정
          starter = await getStarterCode(codingTestId, "python");
        }

        // 3) 코드 & 언어 세팅
        const formattedCode = starter.code.replace(/\\n/g, "\n");
        setCode(formattedCode);
        const nextLang = (starter.language || "python").toLowerCase();
        setCode(formattedCode);
        setLanguage((prev) => (prev === nextLang ? prev : nextLang));
      } catch (err) {
        console.error("❌ 문제/스타터코드 불러오기 실패:", err);
      }
    };

    fetchInitial();
  }, [codingTestId, user?.user_id]);

  // 제출 내역 불러오기
  const fetchSubmissions = useCallback(async () => {
    try {
      if (user?.user_id && codingTestId) {
        const res = await getSubmissionList(codingTestId, user.user_id);
        const withOpen = res.submissions.map((s) => ({
          ...s,
          open: false,
        }));
        setSubmissions(withOpen);
      }
    } catch (err) {
      console.error("제출 내역 불러오기 실패:", err);
    }
  }, [codingTestId, user?.user_id]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleRefreshSubmissions = async () => {
    await fetchSubmissions();
    setShowRefreshMessage(true);
    setTimeout(() => setShowRefreshMessage(false), 3000);
  };

  // 풀었는지 여부 확인
  useEffect(() => {
    const fetchHasSolved = async () => {
      try {
        if (user?.user_id && codingTestId) {
          const result = await checkHasSolved(codingTestId);
          if (result?.data && typeof result.data.hasSolved === "boolean") {
            setHasSolvedBefore(result.data.hasSolved);
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
  }, [user, codingTestId]);

  // 실행 버튼 핸들러
  const handleRunCode = async () => {
    if (!problem) return;
    setIsSubmitResult(false);
    setIsRunning(true);

    try {
      const res = await runCodeWithTestcases(problem.id, code, language);
      setExecutionResults(res.results);

      const hasPassedAll = res.results.every((r) => r.passed);
      if (hasPassedAll) console.log("🎯 모든 테스트 케이스 통과");
      else console.log("❌ 일부 테스트 케이스 실패");
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
      setIsRunning(false);
    }
  };

  // 코드 초기화
  const handleResetCode = async () => {
    try {
      const starter = await getStarterCode(codingTestId, language);
      const formattedCode = starter.code.replace(/\\n/g, "\n");
      setCode(formattedCode);
    } catch (err) {
      console.error("초기화 실패:", err);
    }
  };

  const handleSubmitCode = () => {
    const hideConfirm = localStorage.getItem("hideSubmissionConfirm");

    if (hideConfirm === "true") {
      // ✅ 저장된 유저의 선택을 불러옴 (없으면 기본값 true)
      const savedSharePreference = localStorage.getItem("userSharePreference") === "true";
      handleConfirmAndSubmit(savedSharePreference, false);
    } else {
      setShowConfirmModal(true);
    }
  };

  // handleSubmitCode 함수 아래에 새 함수를 추가하세요.
  const handleConfirmAndSubmit = async (shareSolution, dontShowAgain) => {
    // "다시 보지 않기"를 체크했다면 localStorage에 저장
    if (dontShowAgain) {
  // ✅ 어떤 공유 옵션을 선택했는지 저장하는 코드 추가
      localStorage.setItem("userSharePreference", shareSolution); 
      localStorage.setItem("hideSubmissionConfirm", "true");
    }

    // 모달이 열려있었다면 닫아줌
    if (showConfirmModal) {
      setShowConfirmModal(false);
    }

    // (기존 handleSubmitCode에 있던 로직)
    try {
      setIsSubmitResult(true);
      setIsSubmitting(true); // isSubmitting은 여기서 true로 설정
      setIsRunning(true);

      const res = await submitCodingTest({ // 함수 이름 변경
        user_id: user.user_id,
        test_id: problem.id,
        code,
        language,
        share: shareSolution,
      });

      if (res.all_cases) {
        setExecutionResults(res.all_cases);
      }

      // 이 부분은 기존과 동일하게 ResultModal을 띄우는 로직입니다.
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
        setIsRunning(false);
      }, 1000);
    } catch (err) {
      console.error("제출 중 오류:", err);
      setIsRunning(false);
    } finally {
      setIsSubmitting(false);
    }

    fetchSubmissions();
  };

  // Hover 핸들러
  const HoverHandle = () => {
    const [hover, setHover] = useState(false);
    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: "3px" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              width: "40px",
              height: "2px",
              backgroundColor: hover ? "#607D8B" : "#B0BEC5",
              borderRadius: "1px",
              transition: "background-color 0.2s",
            }}
          />
        ))}
      </div>
    );
  };

  const highlightWithLineNumbers = (code) => {
    const prismKey = getPrismLang(language); // "python" | "java" | "javascript"
    const langObj = Prism.languages[prismKey] ?? Prism.languages.javascript;
    return Prism.highlight(code, langObj, prismKey)
      .split("\n")
      .map(
        (line, i) =>
          `<span class="${
            selectedLine === i + 1 ? "selected-line" : ""
          }" data-line-number="${i + 1}">${line}</span>`
      )
      .join("\n");
  };

  const handleClick = (e) => {
    const target = e.target.closest("[data-line-number]");
    const lineNumber = target?.getAttribute("data-line-number");
    if (lineNumber) setSelectedLine(Number(lineNumber));
  };

  // 코드/언어 변경 시 선택 라인 초기화
  useEffect(() => {
    setSelectedLine(null);
  }, [code, language]);

  const handleLanguageChange = async (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
  };

  // 언어 변경 시 해당 언어의 스타터 코드 불러오기
  useEffect(() => {
    if (!codingTestId || !language) return;
    const fetchByLang = async () => {
      try {
        const starter = await getStarterCode(codingTestId, language);
        const formattedCode = starter.code.replace(/\\n/g, "\n");
        setCode(formattedCode);
      } catch (err) {
        console.error("스타터 코드 로드 실패:", err);
      }
    };
    fetchByLang();
  }, [language, codingTestId]);

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

        <div className="flex flex-1 overflow-hidden">
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

      {/* ✅ 아래 새 모달 렌더링 코드 추가 */}
      {showConfirmModal && (
        <ConfirmSubmissionModal
          isSubmitting={isSubmitting}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmAndSubmit}
        />
      )}

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
