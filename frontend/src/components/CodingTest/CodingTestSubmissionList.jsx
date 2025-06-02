import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import { RotateCcw, Copy, CheckCircle, XCircle } from "lucide-react"; // ✅ Lucide 아이콘 사용

const CodingTestSubmissionList = ({
  submissions,
  setSubmissions,
  fetchSubmissions,
  showCopyMessage,
  setShowCopyMessage,
  getPrismLang,
}) => {
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
              <th className="p-2 text-center border-r border-gray-200">
                제출일시
              </th>
              <th className="p-2 text-center border-r border-gray-200">언어</th>
              <th className="p-2 text-center border-r border-gray-200">결과</th>
              <th className="p-2 text-center border-r border-gray-200">
                제출 메모리
              </th>
              <th className="p-2 text-center">테스트 케이스 통과 수</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s, idx) => (
              <React.Fragment key={s.submission_id}>
                <tr
                  className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer text-gray-700"
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
                    {s.is_correct ? (
                      <CheckCircle
                        size={16}
                        className="text-green-600 inline-block"
                      />
                    ) : (
                      <XCircle
                        size={16}
                        className="text-rose-500 inline-block"
                      />
                    )}
                  </td>
                  <td className="p-2 text-center">{s.memory}</td>
                  <td className="p-2 text-center">
                    {s.passed_test_cases}/{s.total_test_cases}
                  </td>
                </tr>

                {s.open && (
                  <tr className="border-b border-gray-200 bg-gray-100">
                    <td colSpan="5" className="p-3 relative">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(s.code);
                          setShowCopyMessage(true);
                          setTimeout(() => setShowCopyMessage(false), 3000);
                        }}
                        className="absolute top-2 right-2 text-xs border border-gray-300 bg-white text-gray-700 px-3 py-1 rounded hover:bg-teal-50 transition z-10 flex items-center gap-1"
                      >
                        <Copy size={14} />
                        복사
                      </button>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`submission-${s.submission_id}`}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{
                            duration: 0.4,
                            delay: 0.05,
                            ease: [0.25, 0.8, 0.25, 1],
                          }}
                        >
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
                            preClassName="editor-pre bg-white text-gray-800 rounded"
                            readOnly
                          />
                        </motion.div>
                      </AnimatePresence>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CodingTestSubmissionList;
