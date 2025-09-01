// frontend/src/api/attendanceApi.js
import apiClient from "./apiClient";

/**
 * 오늘의 출석 문제 조회 (타임존 기준)
 * GET /attendance/today?tz=Asia/Seoul
 */
export const getTodayQuestion = async (tz = "Asia/Seoul") => {
  const res = await apiClient.get("/attendance/today", { params: { tz } });
  return res.data;
};

/**
 * 출석 제출 (정답 시 1회 인정)
 * POST /attendance/check
 * body: { att_date: "YYYY-MM-DD", selected_answer: "<보기 텍스트>" }
 */
export const checkAttendance = async ({ att_date, selected_answer }) => {
  const res = await apiClient.post("/attendance/check", {
    att_date,
    selected_answer,
  });
  return res.data;
};

/**
 * 내 출석 이력 조회 (페이지네이션/기간 필터)
 * GET /attendance/me?start_date&end_date&page&limit
 */
export const getMyAttendance = async ({
  startDate,
  endDate,
  page = 1,
  limit = 15,
} = {}) => {
  const params = { page, limit };
  if (startDate) params.start_date = startDate; // "YYYY-MM-DD"
  if (endDate) params.end_date = endDate;
  const res = await apiClient.get("/attendance/me", { params });
  return res.data;
};

/**
 * 오늘 출석한 사용자 수 (공개)
 * GET /attendance/today_count?tz=Asia/Seoul
 */
export const getTodayCount = async (tz = "Asia/Seoul") => {
  const res = await apiClient.get("/attendance/today_count", {
    params: { tz },
  });
  return res.data; // { date, count }
};

/**
 * 특정 날짜 출석한 사용자 수 (공개)
 * GET /attendance/date/{att_date}/count
 */
export const getDateCount = async (attDate /* "YYYY-MM-DD" */) => {
  const res = await apiClient.get(`/attendance/date/${attDate}/count`);
  return res.data; // { date, count }
};

/**
 * 기간별 일자별 출석 수 (공개)
 * GET /attendance/daily_counts?start_date&end_date
 */
export const getDailyCounts = async ({ startDate, endDate }) => {
  const res = await apiClient.get("/attendance/daily_counts", {
    params: { start_date: startDate, end_date: endDate },
  });
  return res.data; // [{ date, count }, ...]
};

/**
 * 기간 내 '내' 출석 여부 플래그(달력 체크 표시용)
 * GET /attendance/me/daily_flags?start_date&end_date
 */
export const getMyDailyFlags = async ({ startDate, endDate }) => {
  const res = await apiClient.get("/attendance/me/daily_flags", {
    params: { start_date: startDate, end_date: endDate },
  });
  return res.data; // [{ date, checked_in }, ...]
};

/* =========================
 *       관리자 전용
 * ========================= */

/**
 * 출석 문제 생성
 * POST /attendance/admin/questions
 * body: { question_text, choices: [4개], correct_answer, is_active }
 */
export const adminCreateQuestion = async (payload) => {
  const res = await apiClient.post("/attendance/admin/questions", payload);
  return res.data;
};

/**
 * 출석 문제 목록
 * GET /attendance/admin/questions?is_active&page&limit
 */
export const adminListQuestions = async ({
  isActive,
  page = 1,
  limit = 50,
} = {}) => {
  const params = { page, limit };
  if (typeof isActive === "boolean") params.is_active = isActive;
  const res = await apiClient.get("/attendance/admin/questions", { params });
  return res.data;
};

/**
 * 출석 문제 수정 (부분 수정)
 * PATCH /attendance/admin/questions/{att_question_id}
 */
export const adminUpdateQuestion = async (attQuestionId, payload) => {
  const res = await apiClient.patch(
    `/attendance/admin/questions/${attQuestionId}`,
    payload
  );
  return res.data;
};

/**
 * 날짜-문제 매핑 업서트
 * POST /attendance/admin/calendar
 * body: { att_date: "YYYY-MM-DD", att_question_id: number }
 */
export const adminUpsertCalendar = async ({ att_date, att_question_id }) => {
  const res = await apiClient.post("/attendance/admin/calendar", {
    att_date,
    att_question_id,
  });
  return res.data;
};

/**
 * 특정 날짜의 출석 문제 조회(관리자)
 * GET /attendance/admin/calendar/{att_date}
 */
export const adminGetCalendar = async (attDate /* "YYYY-MM-DD" */) => {
  const res = await apiClient.get(`/attendance/admin/calendar/${attDate}`);
  return res.data;
};

/**
 * 일자별 출석 수(관리자) — 공개 엔드포인트와 동일 로직이지만 권한 분리되어 있음
 * GET /attendance/admin/daily_counts?start_date&end_date
 */
export const adminGetDailyCounts = async ({ startDate, endDate }) => {
  const res = await apiClient.get("/attendance/admin/daily_counts", {
    params: { start_date: startDate, end_date: endDate },
  });
  return res.data;
};
