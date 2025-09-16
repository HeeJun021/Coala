// frontend/src/components/CodingTest/CodingTestSubmissionList.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import { RotateCcw, Copy, Check, CheckCircle, XCircle } from "lucide-react";

const CodingTestSubmissionList = ({
  submissions,
  setSubmissions,
  fetchSubmissions,
  showCopyMessage,
  setShowCopyMessage,
  getPrismLang,
}) => {
  const [copiedMap, setCopiedMap] = useState({});

  const toggleRow = (i) => {
    setSubmissions((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, open: !it.open } : it))
    );
  };

  const handleCopy = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedMap((p) => ({ ...p, [id]: true }));
    setShowCopyMessage?.(true);
    setTimeout(() => setShowCopyMessage?.(false), 3000);
    setTimeout(() => setCopiedMap((p) => ({ ...p, [id]: false })), 3000);
  };

  const th = "p-2 text-center border-r border-gray-200";
  const td = "p-2 text-center";

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">제출 내역</h2>
        <button
          onClick={fetchSubmissions}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 transition"
        >
          <RotateCcw size={16} strokeWidth={2} />
          새로고침
        </button>
      </div>

      <div className="rounded-xl border border-gray-300 bg-white shadow-sm">
        <table className="w-full text-sm text-left border border-gray-200 rounded-md overflow-hidden">
          <thead className="bg-gray-100 text-gray-700 font-semibold tracking-wide">
            <tr>
              <th className={th}>제출일시</th>
              <th className={th}>언어</th>
              <th className={th}>결과</th>
              <th className={th}>제출 메모리</th>
              <th className={th}>실행 시간</th>
              <th className="p-2 text-center">테스트 케이스 통과 수</th>
            </tr>
          </thead>

          <tbody>
            {submissions.map((s, idx) => {
              const copied = !!copiedMap[s.submission_id];
              return (
                <React.Fragment key={s.submission_id}>
                  <tr
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer text-gray-700"
                    onClick={() => toggleRow(idx)}
                  >
                    <td className={td}>{s.submitted_at}</td>
                    <td className={td}>{s.language}</td>
                    <td className={td}>
                      {s.is_correct ? (
                        <CheckCircle size={16} className="text-green-600 inline-block" />
                      ) : (
                        <XCircle size={16} className="text-rose-500 inline-block" />
                      )}
                    </td>
                    <td className={td}>{s.memory}</td>
                    <td className={td}>
                      {s.execution_time != null ? `${s.execution_time}ms` : "-"}
                    </td>
                    <td className={td}>
                      {s.passed_test_cases}/{s.total_test_cases}
                    </td>
                  </tr>

                  {s.open && (
                    <tr className="border-b border-gray-200">
                      <td colSpan="6" className="p-3">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`sub-${s.submission_id}`}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                          >
                            {/* 코드 카드 */}
                            <div className="relative rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                              {/* 툴바 */}
                              <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center rounded-md bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 text-xs font-medium">
                                    {s.language}
                                  </span>
                                  {s.is_correct ? (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                      <CheckCircle size={14} />
                                      정답
                                    </span>
                                  ) : (
                                    <span className="text-xs text-rose-600 flex items-center gap-1">
                                      <XCircle size={14} />
                                      오답
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(s.submission_id, s.code);
                                  }}
                                  className="text-xs border border-gray-300 bg-white text-gray-700 px-3 py-1 rounded hover:bg-teal-50 transition flex items-center gap-1"
                                >
                                  {copied ? (
                                    <>
                                      <Check size={14} />
                                      복사됨
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={14} />
                                      복사
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* 코드 영역 */}
                              <div className="bg-white">
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
                                  padding={14}
                                  textareaClassName="editor-textarea"
                                  preClassName="editor-pre prism-style-on-white"
                                  readOnly
                                />
                              </div>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CodingTestSubmissionList;
