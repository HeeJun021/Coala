// src/components/AttendancePopup.jsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  getTodayQuestion,
  getTodayCount,
  getMyDailyFlags,
  checkAttendance,
} from "../api/attendanceApi";

export default function AttendancePopup({ tz = "Asia/Seoul", userId }) {
  const dialogRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [attDate, setAttDate] = useState("");         // "YYYY-MM-DD"
  const [question, setQuestion] = useState(null);     // { question_text, choices[4], ... }
  const [todayCount, setTodayCount] = useState(null); // number

  const [choice, setChoice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);         // { is_correct, created, message, checkin_ts }
  const [error, setError] = useState("");

  // --- user별 key 네임스페이스 (메모이즈 + 콜백으로 안정화) ---------------------
  const keyPrefix = useMemo(() => (userId ? `user_${userId}_` : "anon_"), [userId]);
  const skipKey = useCallback((d) => `att_popup_skip_${keyPrefix}${d}`, [keyPrefix]);
  const doneKey = useCallback((d) => `att_checked_${keyPrefix}${d}`, [keyPrefix]);

  const safeClose = () => {
    if (!dialogRef.current || !open) return;
    dialogRef.current.close?.();
    setOpen(false);
    document.documentElement.style.overflow = "";
  };

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      setError("");
      try {
        const [qres, cres] = await Promise.allSettled([
          getTodayQuestion(tz),
          getTodayCount(tz),
        ]);

        if (cres.status === "fulfilled") {
          setTodayCount(cres.value?.count ?? 0);
        }
        if (qres.status !== "fulfilled") return;

        const cal = qres.value;
        const d = cal.att_date;
        if (!mounted || !d) return;

        setAttDate(d);
        setQuestion(cal.question);

        // (마이그레이션) 과거 전역 키 제거
        try {
          localStorage.removeItem(`att_popup_skip_${d}`);
          localStorage.removeItem(`att_checked_${d}`);
        } catch {}

        // 서버 판단 최우선
        if (userId) {
          try {
            const flags = await getMyDailyFlags({ startDate: d, endDate: d });
            const already = Array.isArray(flags) && flags[0]?.checked_in;
            if (already) {
              localStorage.setItem(doneKey(d), "1");
              return;
            } else {
              localStorage.removeItem(doneKey(d));
              localStorage.removeItem(skipKey(d));
            }
          } catch {}
        }

        // 로컬 기준
        if (localStorage.getItem(doneKey(d)) === "1") return;
        if (localStorage.getItem(skipKey(d)) === "1") return;

        if (dialogRef.current && !dialogRef.current.open) {
          dialogRef.current.showModal();
          setOpen(true);
          document.documentElement.style.overflow = "hidden";
        }
      } catch (e) {
        console.error(e);
      }
    };

    boot();
    return () => {
      mounted = false;
      document.documentElement.style.overflow = "";
    };
  // ⬇️ 의존성에 skipKey/doneKey(그리고 tz, userId) 포함
  }, [tz, userId, skipKey, doneKey]);

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    if (!attDate || !choice || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await checkAttendance({
        att_date: attDate,
        selected_answer: choice,
      });
      setResult(res);

      if (res.is_correct) {
        localStorage.setItem(doneKey(attDate), "1");
        try {
          const c = await getTodayCount(tz);
          setTodayCount(c?.count ?? todayCount);
        } catch {}
      }
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "제출 중 오류가 발생했습니다.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onSkipToday = () => {
    if (attDate) localStorage.setItem(skipKey(attDate), "1");
    safeClose();
  };

  const solved = !!(result?.is_correct);

  if (!question) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="att-title"
      aria-describedby="att-desc"
      style={{
        border: "none",
        borderRadius: 16,
        padding: 0,
        width: "min(560px, 92vw)",
        maxWidth: "92vw",
        boxShadow: "0 10px 20px rgba(0,0,0,.12), 0 6px 6px rgba(0,0,0,.08)",
      }}
      onClose={() => setOpen(false)}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #e6efe9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          background: "linear-gradient(135deg, #eef9f2 0%, #fbfffd 70%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h2 id="att-title" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            오늘의 출석 체크
          </h2>
          <div
            title="오늘 출석한 사용자 수"
            style={{
              fontSize: 12,
              color: "#0a7",
              background: "#eafaf2",
              border: "1px solid #cbeedb",
              borderRadius: 999,
              padding: "3px 8px",
              fontWeight: 700,
            }}
          >
            👥 {todayCount ?? "-"}명
          </div>
        </div>
        <button
          aria-label="닫기"
          onClick={safeClose}
          style={{
            background: "transparent",
            border: "none",
            fontSize: 22,
            cursor: "pointer",
            lineHeight: 1,
            color: "#6b7280",
          }}
        >
          ×
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ padding: 20 }}>
          <p id="att-desc" style={{ marginTop: 0, color: "#6b7280", fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>{attDate}</span>
            <span> • 오늘 출석자</span>{" "}
            <strong style={{ color: "#0a7" }}>{todayCount ?? "-"}</strong>명
          </p>

          <div
            style={{
              padding: 16,
              background: "#fafafa",
              borderRadius: 12,
              border: "1px solid #eee",
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>
              {question.question_text}
            </div>

            <fieldset style={{ border: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {question.choices?.map((c, idx) => {
                const selected = choice === c;
                return (
                  <label
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `2px solid ${selected ? "#0a7" : "#e5e7eb"}`,
                      background: selected ? "#f1fdf7" : "white",
                      cursor: solved ? "default" : "pointer",
                      transition: "border-color .15s ease",
                    }}
                  >
                    <input
                      type="radio"
                      name="att-choice"
                      value={c}
                      checked={selected}
                      onChange={() => setChoice(c)}
                      disabled={solved}
                      aria-describedby="att-desc"
                    />
                    <span style={{ fontSize: 14 }}>{c}</span>
                  </label>
                );
              })}
            </fieldset>
          </div>

          <div aria-live="polite">
            {error && (
              <div
                role="alert"
                style={{
                  color: "#b00020",
                  background: "#ffecec",
                  border: "1px solid #ffd6d6",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginBottom: 8,
                }}
              >
                {String(error).includes("로그인")
                  ? "로그인이 필요합니다. 로그인 후 다시 시도해 주세요."
                  : error}
              </div>
            )}

            {result && (
              <div
                role="status"
                style={{
                  color: result.is_correct ? "#0a7" : "#b36b00",
                  background: result.is_correct ? "#e9fff7" : "#fff6e6",
                  border:
                    result.is_correct
                      ? "1px solid #baf0de"
                      : "1px solid #ffe1b0",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                {result.is_correct
                  ? result.created
                    ? "출석 완료! 오늘 기록이 저장되었어요."
                    : "이미 오늘 출석 완료한 상태예요 🙂"
                  : "오답입니다. 다시 선택해 주세요."}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            padding: 16,
            borderTop: "1px solid #eee",
          }}
        >
          <button
            type="button"
            onClick={onSkipToday}
            disabled={solved}
            style={{
              background: "transparent",
              border: "1px solid #ddd",
              color: solved ? "#9ca3af" : "#111827",
              borderRadius: 8,
              padding: "10px 14px",
              cursor: solved ? "not-allowed" : "pointer",
            }}
            title={solved ? "정답 제출 후에는 숨길 수 없어요" : "오늘 하루 보지 않기"}
          >
            오늘 하루 보지 않기
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={safeClose}
              disabled={solved}
              style={{
              background: "transparent",
              border: "1px solid #ddd",
              color: solved ? "#9ca3af" : "#111827",
              borderRadius: 8,
              padding: "10px 14px",
              cursor: solved ? "not-allowed" : "pointer",
              }}
              title={solved ? "정답 제출 후에는 닫기만 가능합니다" : "나중에 하기"}
            >
              나중에 하기
            </button>
            <button
              type="submit"
              disabled={!choice || submitting || solved}
              style={{
                background: "#0a7",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                cursor:
                  !choice || submitting || solved ? "not-allowed" : "pointer",
                opacity:
                  !choice || submitting || solved ? 0.6 : 1,
                fontWeight: 700,
              }}
            >
              {submitting ? "제출 중..." : "정답 제출"}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
