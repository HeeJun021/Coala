import apiClient from "./apiClient";

// 관리자 요약 정보 가져오기
export const fetchAdminSummary = async () => {
  const response = await apiClient.get("/admin/summary");
  return response.data;
};

// 최근 신고 목록 가져오기
export const fetchRecentReports = async () => {
  const response = await apiClient.get("/admin/reports/recent");
  return response.data;
};

export const fetchWeeklyReportTrend = async () => {
  const response = await apiClient.get("/admin/reports/weekly");
  return response.data;
};

// 문제 생성 API
export const createQuestion = async (questionData) => {
  try {
    const response = await apiClient.post("/admin/questions/create", questionData);
    return response.data;
  } catch (error) {
    console.error("문제 생성 실패:", error);
    throw error;
  }
};

// 문제 삭제 API
export const deleteQuestion = async (questionId) => {
  try {
    const response = await apiClient.delete(`/admin/questions/${questionId}`);
    return response.data;
  } catch (error) {
    console.error("문제 삭제 실패:", error);
    throw error;
  }
};

// 사용자 전체 목록 조회
export const fetchAdminUsers = async () => {
  const response = await apiClient.get("/admin/users");
  return response.data;
};

// 사용자 상세 정보 조회
export const fetchAdminUserDetail = async (userId) => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data;
};

// 🔹 (추가) 단일 사용자 프로필 조회 별칭 — 상세 페이지에서 쓰기 좋게 제공
export const getUserProfile = async (userId) => {
  // 내부적으로는 같은 엔드포인트 사용
  return await fetchAdminUserDetail(userId);
};

// 🔹 (추가) 닉네임/이름 표시용 헬퍼 — 안전하게 표기 문자열만 반환
export const getUserNickname = async (userId) => {
  try {
    const u = await getUserProfile(userId);
    return u?.nickname ?? u?.name ?? u?.display_name ?? "알 수 없음";
  } catch {
    return "알 수 없음";
  }
};

// 게시판 종류에 따라 전체 게시글 목록 조회
export const fetchAdminPosts = async (boardType) => {
  const response = await apiClient.get(`/admin/posts`, {
    params: { board_type: boardType },
  });
  return response.data;
};

// 특정 게시글 삭제
export const deleteAdminPost = async (postId) => {
  const response = await apiClient.delete(`/admin/posts/${postId}`);
  return response.data;
};

// 댓글 내용 '삭제된 댓글입니다.'로 변경
export const deleteAdminComment = async (commentId) => {
  const response = await apiClient.delete(`/admin/comments/${commentId}`);
  return response.data;
};

// 학습자료/예제 목록 조회
export const fetchStudyMaterialSummary = async (language) => {
  const res = await apiClient.get("/admin/study-materials/summary", {
    params: { language },
  });
  return res.data;
};

// 학습자료 단일 조회
export const fetchStudyMaterialById = async (language, materialId) => {
  const res = await apiClient.get(`/api/materials/${language}/${materialId}`);
  return res.data;
};

// 예제 목록 조회
export const fetchStudyExamples = async (language) => {
  const res = await apiClient.get(`/api/examples/${language}`);
  return res.data;
};

// 학습자료 삭제
export const deleteStudyMaterial = async (materialId) => {
  const res = await apiClient.delete(`/admin/study-materials/${materialId}`);
  return res.data;
};

// 학습자료 수정
export const updateStudyMaterial = async (materialId, materialData) => {
  try {
    const response = await apiClient.put(`/admin/study-materials/${materialId}`, materialData);
    return response.data;
  } catch (error) {
    console.error("학습자료 수정 실패:", error);
    throw error;
  }
};

// 예제 수정
export const updateStudyExample = async (exampleId, exampleData) => {
  try {
    const response = await apiClient.put(`/admin/examples/${exampleId}`, exampleData);
    return response.data;
  } catch (error) {
    console.error("예제 수정 실패:", error);
    throw error;
  }
};

// 예제 삭제
export const deleteStudyExample = async (exampleId) => {
  try {
    const response = await apiClient.delete(`/admin/examples/${exampleId}`);
    return response.data;
  } catch (error) {
    console.error("예제 삭제 실패:", error);
    throw error;
  }
};

// 언어 수정 API
export const updateLanguage = async (languageId, languageData) => {
  try {
    const response = await apiClient.put(`/admin/languages/${languageId}`, languageData);
    return response.data;
  } catch (error) {
    console.error("언어 수정 실패:", error);
    throw error;
  }
};

// 언어 생성 API
export const createLanguage = async (languageData) => {
  try {
    const response = await apiClient.post("/admin/languages/create", languageData);
    return response.data;
  } catch (error) {
    console.error("언어 생성 실패:", error);
    throw error;
  }
};

// 언어 삭제 API
export const deleteLanguage = async (languageId) => {
  try {
    const response = await apiClient.delete(`/admin/languages/${languageId}`);
    return response.data;
  } catch (error) {
    console.error("언어 삭제 실패:", error);
    throw error;
  }
};


export const updateAdminCodingTest = async (testId, testData) => {
  try {
    const response = await apiClient.put(`/admin/codingtest/${testId}`, testData);
    return response.data;
  } catch (error) {
    console.error("코딩 테스트 문제 수정 실패:", error);
    throw error;
  }
};