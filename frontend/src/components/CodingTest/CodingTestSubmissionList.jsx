import React from "react";
import { HiOutlineRefresh } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";

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
        <h2 className="text-xl font-semibold">제출 내역</h2>
        <button
          onClick={fetchSubmissions}
          className="flex items-center gap-1 text-sm text-gray-300 hover:text-white"
        >
          <HiOutlineRefresh className="w-4 h-4" />
          새로고침
        </button>
      </div>

      <table className="w-full text-sm text-left">
        <thead className="border-b border-gray-600 text-white font-semibold tracking-wide">
          <tr>
            <th className="p-2 text-center">제출일시</th>
            <th className="p-2 text-center">언어</th>
            <th className="p-2 text-center">결과</th>
            <th className="p-2 text-center">제출 메모리</th>
            <th className="p-2 text-center">테스트 케이스 통과 수</th>
          </tr>
        </thead>
        <tbody>
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
                <td className="p-2 text-center">{s.is_correct ? "✅" : "❌"}</td>
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
                        setTimeout(() => setShowCopyMessage(false), 3000);
                      }}
                      className="absolute top-2 right-2 text-xs bg-[#4b5b6e] text-white px-3 py-1 rounded hover:bg-[#5f6f82] z-10"
                    >
                      📋 복사
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
                          preClassName="editor-pre"
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
    </>
  );
};

export default CodingTestSubmissionList;
