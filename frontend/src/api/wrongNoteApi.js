import apiClient from "./apiClient";

// 1. 오답노트 생성
export const createWrongNote = (noteData) =>
  apiClient.post("/wrong-note/create", noteData);

// 2. 오답노트 조회 (제출 ID 기준)
export const getWrongNoteBySubmissionId = (submissionId) =>
  apiClient.get(`/wrong-note/by-submission/${submissionId}`);

// 3. 오답노트 수정
export const updateWrongNote = (noteId, updateData) =>
  apiClient.patch(`/wrong-note/${noteId}`, updateData);

// 4. 제출 제목 수정
export const updateSubmissionTitle = (submissionId, newTitle) =>
  apiClient.patch(`/codingtestsubmissions/${submissionId}/title`, { title: newTitle });
