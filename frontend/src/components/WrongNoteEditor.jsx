import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion"; // 애니메이션
import "@toast-ui/editor/dist/toastui-editor.css";
import "@toast-ui/editor/dist/theme/toastui-editor-dark.css"; // ✅ 다크 테마
import { Editor } from "@toast-ui/react-editor";
import { useRef } from "react";
import {
  createWrongNote,
  getWrongNoteBySubmissionId,
  updateWrongNote,
  updateSubmissionTitle,
} from "../api/wrongNoteApi";

const WrongNoteEditor = ({
  submissionList,
  setSubmissionList,
  codeSnapshot,
  testResults,
  testId,
  userId,
}) => {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [existingNote, setExistingNote] = useState(null);
  const [noteContent, setNoteContent] = useState("");
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const editorRef = useRef();

  const failedSubmissions = submissionList.filter((s) => !s.is_correct);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (selectedSubmission) {
      const loadNote = async () => {
        try {
          const res = await getWrongNoteBySubmissionId(
            selectedSubmission.submission_id
          );
          const data = res.data;

          if (data && data.note) {
            setExistingNote(data);
            setNoteContent(data.note);
            setTitle(data.title || selectedSubmission.title || "");
          } else {
            setExistingNote(null);
            setNoteContent("");
            setTitle(selectedSubmission.title || "");
          }
          setShowNoteEditor(true);
        } catch {
          setExistingNote(null);
          setNoteContent("");
          setTitle(selectedSubmission.title || "");
          setShowNoteEditor(true);
        }
      };

      loadNote();
    }
  }, [selectedSubmission]);

  const handleSave = useCallback(async () => {
    try {
      if (title && selectedSubmission.title !== title) {
        await updateSubmissionTitle(selectedSubmission.submission_id, title);
      }

      if (existingNote && existingNote.note_id) {
        await updateWrongNote(existingNote.note_id, {
          note: noteContent,
          title,
        });
      } else {
        await createWrongNote({
          user_id: userId,
          ct_submission_id: selectedSubmission.submission_id,
          submitted_answer: codeSnapshot,
          execution_result: JSON.stringify(testResults),
          note: noteContent,
          title,
        });
      }

      alert("오답노트 저장 완료!");
    } catch (err) {
      console.error("오답노트 저장 실패", err);
      alert("오답노트 저장 중 오류 발생");
    }
  }, [
    title,
    selectedSubmission,
    existingNote,
    noteContent,
    userId,
    codeSnapshot,
    testResults,
  ]);

  useEffect(() => {
    window.saveWrongNote = handleSave;
    return () => {
      window.saveWrongNote = null;
    };
  }, [handleSave]); // 👈 이제 안전

  const handleTitleSave = async () => {
    try {
      await updateSubmissionTitle(selectedSubmission.submission_id, title);
      setEditingTitle(false);
      alert("제출 제목이 변경되었습니다!");

      // ✅ 좌측 리스트에서도 제목 반영
      const updatedList = submissionList.map((s) =>
        s.submission_id === selectedSubmission.submission_id
          ? { ...s, title }
          : s
      );
      setSubmissionList(updatedList); // 🔥 여기서 문제났던 거!

      // ✅ 현재 선택 항목에도 반영
      setSelectedSubmission((prev) => (prev ? { ...prev, title } : prev));

      setShowNoteEditor(true); // 다시 열기
    } catch (err) {
      console.error("제출 제목 수정 실패:", err.response || err.message || err);
      alert("제출 제목 수정 중 오류 발생");
    }
  };

  return (
    <div className="flex h-full">
      {/* 좌측 제출 목록 */}
      <div className="w-[35%] p-4 border-r border-gray-500">
        <h2 className="text-xl font-bold text-white mb-4">❌ 제출 오답 내역</h2>
        <div className="space-y-2">
          {failedSubmissions.map((s) => (
            <div key={s.submission_id}>
              <button
                onClick={() =>
                  setSelectedSubmission((prev) =>
                    prev?.submission_id === s.submission_id ? null : s
                  )
                }
                className="flex items-center w-full text-left px-3 py-2 border rounded bg-[#2c3544] text-white hover:bg-[#3a4b5c]"
              >
                📄 {s.title || "제출 제목 없음"} - {s.submitted_at}
              </button>
              <AnimatePresence mode="wait">
                {selectedSubmission?.submission_id === s.submission_id && (
                  <motion.div
                    key={s.submission_id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="ml-6 mt-2 overflow-hidden"
                  >
                    <div className="ml-6 mt-2">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold">
                          📑 실패한 테스트케이스 목록
                        </h4>
                      </div>
                      <div className="text-sm space-y-2">
                        {(() => {
                          let parsed = [];
                          try {
                            parsed =
                              typeof s.execution_result === "string"
                                ? JSON.parse(s.execution_result)
                                : s.execution_result || [];
                          } catch (e) {
                            console.warn("❗ JSON 파싱 실패:", e);
                          }
                          const failedCases = parsed.filter((r) => !r.passed);
                          if (failedCases.length === 0) {
                            return (
                              <div className="text-gray-400">
                                ❗실패한 테스트케이스 없음
                              </div>
                            );
                          }
                          return (
                            <div className="text-sm space-y-4 pl-6 mt-1">
                              {failedCases.slice(0, 2).map((r, idx) => (
                                <div key={idx} className="text-white">
                                  <p className="text-base font-semibold">
                                    #{idx + 1}
                                  </p>
                                  <p>입력값 : {r.input}</p>
                                  <p>기대값 : {r.expected_output}</p>
                                  <p>
                                    출력값 : {r.actual_output}{" "}
                                    <span className="text-red-400 font-bold">
                                      ❗오답
                                    </span>
                                  </p>
                                </div>
                              ))}
                              {failedCases.length > 2 && (
                                <p className="text-xs italic text-gray-400 mt-2">
                                  + 그 외 {failedCases.length - 2}개의 실패
                                  케이스 더 있음
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* 우측 오답노트 영역 */}
      <div className="w-[65%] p-4">
        <AnimatePresence mode="wait">
          {showNoteEditor && selectedSubmission && (
            <motion.div
              key={selectedSubmission.submission_id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-y-2">
                  {/* 제출 이름 + 제출 코드 불러오기 버튼 */}
                  <div className="flex items-center gap-2">
                    📄
                    {editingTitle ? (
                      <input
                        type="text"
                        value={title}
                        autoFocus
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") await handleTitleSave();
                        }}
                        className="bg-[#2c3544] border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      />
                    ) : (
                      <>
                        {title} - {selectedSubmission.submitted_at}
                      </>
                    )}
                    <button
                      onClick={() => setEditingTitle(true)}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      ✏️ 제출 이름 변경
                    </button>
                  </div>
                  {/* ✅ 오답노트가 없거나, 수정 중일 때만 표시 */}
                  {(!existingNote || isEditing) && (
                    <button
                      onClick={() => {
                        if (editorRef.current) {
                          const editorInstance =
                            editorRef.current.getInstance();

                          const formattedCode = `\`\`\`python\n${codeSnapshot}\n\`\`\`\n`;

                          // getCursor() ❌ 필요 없음 → 그냥 insertText만 호출하면 커서에 삽입됨
                          editorInstance.insertText(formattedCode);
                        }
                      }}
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      📥 제출 코드 불러오기
                    </button>
                  )}
                </div>

                <>
                  {existingNote ? (
                    <>
                      {/* ✅ 읽기 전용일 땐 스타일 있는 div로 감싸기 */}
                      <AnimatePresence mode="wait">
                        {!isEditing ? (
                          <motion.div
                            key="readonly"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="rounded border border-gray-700 bg-transparent overflow-hidden"
                          >
                            <div className="rounded border border-gray-700 bg-transparent overflow-hidden">
                              <Editor
                                key="viewer"
                                initialValue={noteContent || existingNote.note}
                                previewStyle="tab" // 작성 영역만 기본으로 보임
                                height="400px"
                                theme="dark"
                                usageStatistics={false}
                                toolbarItems={[]} // ✅ 툴바 제거
                                hideModeSwitch={true} // ✅ Markdown / WYSIWYG 탭 제거
                                ref={editorRef}
                                viewer={true}
                              />
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="editable"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                          >
                            <Editor
                              key="editable"
                              initialValue={noteContent || existingNote.note}
                              previewStyle="tab" // 작성 영역만 기본으로 보임
                              hideModeSwitch={true} // 전환 탭도 숨김
                              height="400px"
                              theme="dark"
                              usageStatistics={false}
                              toolbarItems={[
                                ["bold", "italic", "strike"],
                                ["code", "codeblock"],
                                ["image", "link"],
                              ]}
                              ref={editorRef}
                              viewer={false}
                              onChange={() => {
                                const markdown = editorRef.current
                                  ?.getInstance()
                                  .getMarkdown();
                                setNoteContent(markdown);
                              }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* ✅ 하단 버튼 */}
                      <div className="flex justify-end mt-3 gap-2">
                        {existingNote ? (
                          isEditing ? (
                            // 오답노트 있음 & 수정 중 → 저장 버튼
                            <button
                              onClick={handleSave}
                              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                            >
                              💾 오답노트 저장
                            </button>
                          ) : (
                            // 오답노트 있음 & 읽기 상태 → 수정하기 버튼
                            <button
                              onClick={() => {
                                setNoteContent(existingNote.note);
                                setIsEditing(true);
                              }}
                              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                            >
                              ✏️ 오답노트 수정하기
                            </button>
                          )
                        ) : (
                          // 오답노트 없음 → 저장 버튼
                          <button
                            onClick={handleSave}
                            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                          >
                            💾 오답노트 저장
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* 마크다운 에디터 */}
                      <Editor
                        initialValue={noteContent}
                        previewStyle="tab" // 작성 영역만 기본으로 보임
                        hideModeSwitch={true} // 전환 탭도 숨김
                        height="400px"
                        theme="dark"
                        usageStatistics={false}
                        toolbarItems={[
                          ["bold", "italic", "strike"],
                          ["code", "codeblock"],
                          ["image", "link"],
                        ]}
                        ref={editorRef}
                        onChange={() => {
                          const markdown = editorRef.current
                            ?.getInstance()
                            .getMarkdown();
                          setNoteContent(markdown);
                        }}
                      />
                      {/* ✅ 저장 버튼 추가 */}
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={handleSave}
                          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                          💾 오답노트 저장
                        </button>
                      </div>
                    </>
                  )}
                </>
              </>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WrongNoteEditor;
