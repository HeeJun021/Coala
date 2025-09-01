import React, { useEffect, useMemo, useState } from "react";
import { getMyDailyFlags } from "../../api/attendanceApi";

// utils
const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const startOfMonth = (y, m) => new Date(y, m, 1);
const endOfMonth = (y, m) => new Date(y, m + 1, 0);
const addMonths = (d, n) => {
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + n);
  return nd;
};

export default function MyPageAttendance() {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const range = useMemo(() => {
    const s = startOfMonth(year, month);
    const e = endOfMonth(year, month);
    return { startYMD: toYMD(s), endYMD: toYMD(e) };
  }, [year, month]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getMyDailyFlags({
          startDate: range.startYMD,
          endDate: range.endYMD,
        });
        if (!alive) return;
        const map = {};
        for (const r of data || []) map[r.date] = !!r.checked_in;
        setFlags(map);
      } catch (e) {
        if (!alive) return;
        setError(
          e?.response?.data?.detail || "출석 내역을 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [range.startYMD, range.endYMD]);

  // 7칸 그리드 셀
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const preBlanks = (first.getDay() + 7) % 7;
    const days = Array.from({ length: last.getDate() }, (_, i) => new Date(year, month, i + 1));
    return [...Array.from({ length: preBlanks }, () => null), ...days];
  }, [year, month]);

  const todayYMD = toYMD(new Date());
  const monthlyCount = Object.values(flags).filter(Boolean).length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 자리 */}
      <div className="w-[250px]" />

      {/* 우측 컨테이너: 전체적으로 살짝 줄임 + 가운데 정렬 */}
      <div className="flex-1 p-5 max-w-[1100px] mx-auto w-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-bold">
              {year}년 <span className="text-green-700">{month + 1}월</span>
            </h2>
            <span className="text-sm text-gray-600">
              이번 달 출석 <strong className="text-gray-900">{monthlyCount}</strong>회
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCursor(addMonths(cursor, -1))}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50"
            >
              ◀ 이전
            </button>
            <button
              onClick={() => setCursor(new Date())}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50"
            >
              오늘
            </button>
            <button
              onClick={() => setCursor(addMonths(cursor, 1))}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50"
            >
              다음 ▶
            </button>
          </div>
        </div>

        {/* 달력 카드: 패딩·간격 조금 줄임 */}
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-3">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 text-center text-xs sm:text-sm text-gray-500 gap-1.5 mb-1.5">
            {["일", "월", "화", "수", "목", "금", "토"].map((w, i) => (
              <div
                key={w}
                className={`py-1 ${
                  i === 0 ? "text-red-500" : i === 6 ? "text-blue-600" : ""
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 본문: 셀 높이/간격 소폭 축소, 내부 아이콘은 키움 */}
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((d, idx) => {
              if (!d) return <div key={`blank-${idx}`} className="h-[68px] sm:h-[78px]" />;
              const ymd = toYMD(d);
              const checked = flags[ymd] === true;
              const isToday = ymd === todayYMD;
              const day = d.getDay();

              return (
                <div
                  key={ymd}
                  title={`${ymd} ${checked ? "출석" : "결석"}`}
                  className={[
                    "h-[68px] sm:h-[78px] rounded-md border p-2 flex flex-col",
                    isToday ? "border-green-600 bg-white" : "border-gray-200 bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1">
                    <span
                      className={[
                        "inline-flex items-center justify-center w-7 h-7 rounded",
                        isToday ? "bg-green-700 text-white" : "",
                        day === 0 ? "text-red-500" : day === 6 ? "text-blue-600" : "",
                      ].join(" ")}
                    >
                      {d.getDate()}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    {checked ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-green-100 text-green-700 text-[18px] leading-none">
                        ✓
                      </span>
                    ) : (
                      <span className="text-gray-300 text-2xl leading-none">×</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 상태/범례 */}
        <div className="mt-2 text-sm text-gray-600">
          {loading && "불러오는 중..."}
          {error && <span className="text-red-600">{error}</span>}
        </div>
        <div className="mt-1.5 text-xs sm:text-sm text-gray-500 flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-green-100 text-green-700">
              ✓
            </span>
            출석
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-gray-300 text-lg leading-none">×</span>
            결석
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-green-700" />
            오늘
          </span>
        </div>
      </div>
    </div>
  );
}
