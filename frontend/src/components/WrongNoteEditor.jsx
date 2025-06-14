import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Pencil,
  Save,
  Download,
  StickyNote,
  XCircle,
  Ban,
  ClipboardList,
  AlertCircle,
} from "lucide-react";

import "@toast-ui/editor/dist/toastui-editor.css";
import "@toast-ui/editor/dist/theme/toastui-editor-dark.css";
import { Editor } from "@toast-ui/react-editor";

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
  setActiveTab,
}) => {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [existingNoteMap, setExistingNoteMap] = useState({});
  const [noteContent, setNoteContent] = useState("");
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef();

  const failedSubmissions = submissionList.filter((s) => !s.is_correct);

  const loadNote = async (submission) => {
    try {
      const res = await getWrongNoteBySubmissionId(submission.submission_id);
      const data = res.data;

      setExistingNoteMap((prev) => ({
        ...prev,
        [submission.submission_id]: data,
      }));
      setNoteContent(data.note || "");
      setTitle(data.title || submission.title || "");
      setShowNoteEditor(true);
      setIsEditing(!data.note);
    } catch {
      setExistingNoteMap((prev) => ({
        ...prev,
        [submission.submission_id]: null,
      }));
      setNoteContent("");
      setTitle(submission.title || "");
      setShowNoteEditor(false);
    }
  };

  useEffect(() => {
    if (selectedSubmission) {
      loadNote(selectedSubmission);
    }
  }, [selectedSubmission]);
  const handleSave = useCallback(async () => {
    try {
      if (title && selectedSubmission.title !== title) {
        await updateSubmissionTitle(selectedSubmission.submission_id, title);
      }

      if (existingNoteMap[selectedSubmission.submission_id]?.note_id) {
        const updated = await updateWrongNote(
          existingNoteMap[selectedSubmission.submission_id].note_id,
          { note: noteContent, title }
        );
        setExistingNoteMap((prev) => ({
          ...prev,
          [selectedSubmission.submission_id]: updated.data,
        }));
      } else {
        const created = await createWrongNote({
          user_id: userId,
          ct_submission_id: selectedSubmission.submission_id,
          submitted_answer: codeSnapshot,
          execution_result: JSON.stringify(testResults),
          note: noteContent,
          title,
        });

        setExistingNoteMap((prev) => ({
          ...prev,
          [selectedSubmission.submission_id]: created.data,
        }));
      }

      // alert("오답노트 저장 완료!");
      setIsEditing(false); // ✅ 저장 후 읽기 모드로 전환
    } catch (err) {
      console.error("오답노트 저장 실패", err);
      alert("오답노트 저장 중 오류 발생");
    }
  }, [
    title,
    selectedSubmission,
    existingNoteMap,
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
  }, [handleSave]);

  const handleTitleSave = async () => {
    try {
      await updateSubmissionTitle(selectedSubmission.submission_id, title);
      setEditingTitle(false);
      alert("제출 제목이 변경되었습니다!");

      const updatedList = submissionList.map((s) =>
        s.submission_id === selectedSubmission.submission_id
          ? { ...s, title }
          : s
      );
      setSubmissionList(updatedList);

      setSelectedSubmission((prev) => (prev ? { ...prev, title } : prev));
      setShowNoteEditor(true);
    } catch (err) {
      console.error("제출 제목 수정 실패:", err);
      alert("제출 제목 수정 중 오류 발생");
    }
  };

  useEffect(() => {
    if (!isEditing && editorRef.current) {
      const previewTab = document.querySelector(
        '.tab-item[aria-label="Preview"]'
      );
      if (previewTab) previewTab.click();
    }
  }, [noteContent, isEditing]);

  return (
    <div className="flex h-full">
      <div
        className={`w-[35%] p-4 ${
          showNoteEditor ? "border-r border-gray-500" : ""
        }`}
      >
        {failedSubmissions.length > 0 && (
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Ban className="w-5 h-5 text-[#e11d48]" />
            제출 오답 내역
          </h2>
        )}

        {failedSubmissions.length === 0 ? (
          <div className="text-left px-4 text-gray-600 text-base font-medium italic">
            틀린 문제가 없습니다.
          </div>
        ) : (
          failedSubmissions.map((s) => (
            <div key={s.submission_id}>{/* 제출 카드 */}</div>
          ))
        )}

        <div className="space-y-2">
          {failedSubmissions.map((s) => (
            <div key={s.submission_id}>
              <button
                onClick={() => {
                  if (selectedSubmission?.submission_id === s.submission_id) {
                    setSelectedSubmission(null);
                    setShowNoteEditor(false);
                  } else {
                    setSelectedSubmission(s);
                  }
                }}
                className="flex items-center w-full text-left px-3 py-2 border rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                <FileText
                  className="w-4 h-4 mr-2"
                  style={{ color: "#1d4ed8" }}
                />
                {s.title || "제출 제목 없음"} - {s.submitted_at}
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
                          <ClipboardList
                            className="w-4 h-4 inline-block mr-1"
                            style={{ color: "#1d4ed8" }}
                          />
                          실패한 테스트케이스 목록
                        </h4>
                        {existingNoteMap[s.submission_id] === null && (
                          <button
                            onClick={async () => {
                              try {
                                const res = await createWrongNote({
                                  user_id: userId,
                                  ct_submission_id: s.submission_id,
                                  submitted_answer: codeSnapshot,
                                  execution_result: JSON.stringify(testResults),
                                  note: "",
                                  title: s.title || "",
                                });

                                setExistingNoteMap((prev) => ({
                                  ...prev,
                                  [s.submission_id]: res.data,
                                }));
                                setNoteContent("");
                                setIsEditing(true);
                                setShowNoteEditor(true);
                              } catch (err) {
                                console.error("오답노트 생성 실패", err);
                                alert("오답노트 생성 중 오류 발생");
                              }
                            }}
                            className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center"
                          >
                            <StickyNote className="w-3.5 h-3.5 mr-2" />
                            오답노트 작성
                          </button>
                        )}
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
                              <div className="text-gray-500">
                                <XCircle
                                  className="w-4 h-4 mr-1 inline-block"
                                  style={{ color: "#e11d48" }}
                                />
                                실패한 테스트케이스 없음
                              </div>
                            );
                          }

                          return (
                            <div className="text-sm space-y-4 pl-6 mt-1">
                              {failedCases.slice(0, 2).map((r, idx) => (
                                <div key={idx} className="text-gray-800">
                                  <p className="text-base font-semibold">
                                    #{idx + 1}
                                  </p>
                                  <p>입력값 : {r.input}</p>
                                  <p>기대값 : {r.expected_output}</p>
                                  <p>
                                    출력값 : {r.actual_output}{" "}
                                    <span className="text-red-600 font-bold">
                                      <AlertCircle
                                        className="w-[14px] h-[14px] inline align-text-bottom relative -top-[1px]"
                                        style={{ color: "#e11d48" }}
                                      />{" "}
                                      오답
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

      {/* 우측 오답노트 에디터 영역 */}
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
              <div className="flex justify-between items-center mb-4 flex-wrap gap-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 inline-block text-[#0f52ba]" />
                  {editingTitle ? (
                    <input
                      type="text"
                      value={title}
                      autoFocus
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") await handleTitleSave();
                      }}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 text-sm"
                    />
                  ) : (
                    <>
                      {title} - {selectedSubmission.submitted_at}
                    </>
                  )}
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                  >
                    <Pencil className="w-3 h-3 mr-1 inline-block" />
                    제출 이름 변경
                  </button>
                </div>
                {(!existingNoteMap[selectedSubmission.submission_id]?.note ||
                  isEditing) && (
                  <button
                    onClick={() => {
                      if (editorRef.current) {
                        const editorInstance = editorRef.current.getInstance();
                        const formattedCode = `제출 코드:\n\n\`\`\`python\n${codeSnapshot}\n\`\`\`\n`;
                        editorInstance.insertText(formattedCode);
                      }
                    }}
                    className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    <Download
                      className="w-4 h-4 mr-1 inline-block"
                      style={{ color: "#ffffff" }}
                    />
                    제출 코드 불러오기
                  </button>
                )}
              </div>

              {existingNoteMap[selectedSubmission.submission_id] ? (
                isEditing ? (
                  <>
                    {/* ✅ 수정 모드: WYSIWYG 에디터 */}
                    <Editor
                      key="editable"
                      initialValue={noteContent}
                      previewStyle="tab" // ✅ 탭 구조
                      initialEditType="wysiwyg" // ✅ 처음부터 WYSIWYG 모드!
                      hideModeSwitch={true} // ✅ 하단 탭 스위치 숨김
                      height="600px"
                      theme="light"
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

                    <div className="flex justify-end mt-3 gap-2">
                      <button
                        onClick={handleSave}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                      >
                        <Save className="w-4 h-4 mr-1 inline-block text-white" />
                        오답노트 저장
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded border border-gray-300 bg-white overflow-hidden">
                      {/* ✅ 뷰어 모드: 읽기 전용 Markdown Preview */}
                      <Editor
                        key="viewer"
                        initialValue={noteContent}
                        previewStyle="tab" // ✅ 탭 구조 유지
                        initialEditType="markdown" // ✅ Markdown 기반 (탭 구조니까)
                        hideModeSwitch={true} // ✅ 하단 스위치 숨김
                        height="600px"
                        theme="light"
                        usageStatistics={false}
                        toolbarItems={[]} // ✅ 툴바 없음
                        ref={editorRef}
                        viewer={true} // ✅ 에디터 모드 (viewer 아님)
                        readOnly={true} // ✅ 수정 불가
                      />
                    </div>
                    <div className="flex justify-end mt-3 gap-2">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setNoteContent(noteContent);
                        }}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                      >
                        <Pencil className="w-4 h-4 mr-1 inline-block text-white" />
                        오답노트 수정하기
                      </button>
                    </div>
                  </>
                )
              ) : (
                <>
                  {/* ✅ 신규 작성: WYSIWYG 에디터 */}
                  <Editor
                    initialValue={noteContent}
                    previewStyle="tab"
                    hideModeSwitch={true}
                    height="600px"
                    theme="light"
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
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleSave}
                      className="text-xs bg-blue-green hover:bg-green-600 text-white px-4 py-2 rounded"
                    >
                      <Save className="w-4 h-4 mr-1 inline-block text-white" />
                      오답노트 저장
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WrongNoteEditor;
