import React, { useEffect, useState } from "react";
import {
  createWrongNote,
  getWrongNoteBySubmissionId,
  updateWrongNote,
  updateSubmissionTitle,
} from "../api/wrongNoteApi";

const WrongNoteEditor = ({
  submissionList,
  codeSnapshot,
  testResults,
  testId,
  userId,
}) => {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [existingNote, setExistingNote] = useState(null);
  const [noteContent, setNoteContent] = useState("");
  const [title, setTitle] = useState("");
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  

  const failedSubmissions = submissionList.filter((s) => !s.is_correct);

  useEffect(() => {
    if (selectedSubmission) {
      const loadNote = async () => {
        try {
          const res = await getWrongNoteBySubmissionId(selectedSubmission.submission_id);
          const data = res.data; // ✅ Axios 응답에서 진짜 데이터 추출
  
          console.log("📝 오답노트 조회 결과:", data);
  
          if (data && data.note) {
            setExistingNote(data);
            setNoteContent(data.note);
            setTitle(data.title || selectedSubmission.title || "");
            setShowNoteEditor(true);
          } else {
            setExistingNote(null);
            setNoteContent("");
            setTitle(selectedSubmission.title || "");
            setShowNoteEditor(true);
          }
        } catch {
          setExistingNote(null);
          setNoteContent("");
          setTitle(selectedSubmission.title || "");
          setShowNoteEditor(true);
        }
      };
  
      console.log("📌 선택된 제출:", selectedSubmission);
      loadNote();
    }
  }, [selectedSubmission]);
  

  const handleSave = async () => {
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
          note: noteContent, // ✅ note에는 noteContent (본문)
          title: title, // ✅ title에는 title (제목)
        });
      }
      alert("오답노트 저장 완료!");
    } catch (err) {
      console.error("오답노트 저장 실패", err);
      alert("오답노트 저장 중 오류 발생");
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-[35%] p-4 border-r border-gray-500">
        <h2 className="text-xl font-bold text-red-400 mb-4">
          ❌ 제출 오답 내역
        </h2>
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
              {selectedSubmission?.submission_id === s.submission_id && (
                <div className="ml-6 mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold">
                      📑 실패한 테스트케이스 목록
                    </h4>
                    {!existingNote && (
                      <button
                        className="text-xs px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                        onClick={() => {
                          setShowNoteEditor(true);
                          setSelectedSubmission(s);
                        }}
                      >
                        ✍️ 오답노트 작성
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
                          <div className="text-gray-400">
                            ❗실패한 테스트케이스 없음
                          </div>
                        );
                      }
                      return (
                        <>
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
                                + 그 외 {failedCases.length - 2}개의 실패 케이스
                                더 있음
                              </p>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="w-[65%] p-4">
        {showNoteEditor && selectedSubmission && (
          <>
            {existingNote ? (
              // ✅ 저장된 오답노트가 있는 경우: 읽기 전용 UI
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">🟦 저장된 오답노트</h2>
                  <button
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() =>
                      setNoteContent(existingNote.submitted_answer)
                    }
                  >
                    제출 코드 불러오기
                  </button>
                </div>

                <p className="text-sm text-white mb-2">
                  📄 {selectedSubmission.title || "제출 제목 없음"} -{" "}
                  {selectedSubmission.submitted_at}
                </p>

                <input
                  type="text"
                  value={existingNote.title}
                  disabled
                  className="w-full px-3 py-2 mb-3 bg-[#2c3544] border border-gray-600 rounded text-white"
                />

                <textarea
                  value={existingNote.note}
                  disabled
                  className="w-full h-40 p-3 bg-[#2c3544] border border-gray-600 rounded text-white"
                />
              </div>
            ) : (
              // 📝 작성 UI
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  ✍️ 선택된 제출의 오답노트 작성
                </h2>
                <p className="mb-3 text-sm font-bold text-white">
                  📄 {selectedSubmission.title || "제출 제목 없음"} -{" "}
                  {selectedSubmission.submitted_at}
                </p>
                <button
                  onClick={() => setNoteContent(codeSnapshot)}
                  className="mb-3 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  제출 코드 불러오기
                </button>

                <input
                  type="text"
                  className="w-full px-3 py-2 mb-3 bg-[#2c3544] border border-gray-600 rounded text-white"
                  value={title} // ✅ 이게 핵심! 기존 note title이 아님
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제출 제목 수정"
                />

                <textarea
                  className="w-full h-40 p-3 bg-[#2c3544] border border-gray-600 rounded text-white"
                  value={noteContent} // ✅ 마찬가지로 상태값 사용
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="여기에 오답노트를 작성해 주세요."
                />

                <div className="mt-3 flex justify-between">
                  <button
                    onClick={handleSave}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    오답노트 저장
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WrongNoteEditor;
