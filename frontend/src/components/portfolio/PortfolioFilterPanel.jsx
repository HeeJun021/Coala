import React, { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, UserSquare2, ChevronDown, RefreshCw } from "lucide-react";

/**
 * 포트폴리오 필터 패널
 * - 기간/태그 제거
 * - 프로젝트 선택: 코딩테스트 카테고리 스타일(팝오버)
 * - 역할 선택(프론트엔드/백엔드/풀스택)
 * - AI 메모/지시사항 입력란 (filters.ai_notes 로 상위 전달)
 *
 * Props:
 *  - onFiltersChange?: (filters) => void
 *  - projects?: { id?: number; project_id?: number; name?: string; project_name?: string }[]
 */
export default function PortfolioFilterPanel({ onFiltersChange, projects = [] }) {
  // 섹션 토글(필요 시 확장)
  const [includeProjects] = useState(true);
  const [includeQuiz] = useState(true);
  const [includeCodingtest] = useState(true);
  const [includeTech] = useState(true);

  // 프로젝트 선택 — 코딩테스트 ‘카테고리’ 패턴
  const [projOpen, setProjOpen] = useState(false);
  const projPanelRef = useRef(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [committedProjectIds, setCommittedProjectIds] = useState([]);

  // 역할 선택 (프론트엔드/백엔드/풀스택)
  const ROLE_OPTIONS = ["프론트엔드", "백엔드", "풀스택"];
  const [rolePreset, setRolePreset] = useState("프론트엔드");

  // AI 메모/지시사항
  const [aiNotes, setAiNotes] = useState("");

  // 팝오버 바깥 클릭 닫기
  useEffect(() => {
    const onClickOutside = (e) => {
      if (!projPanelRef.current) return;
      if (!projPanelRef.current.contains(e.target)) setProjOpen(false);
    };
    if (projOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [projOpen]);

  // 안전한 id/name 추출기 (API 키 변동 대비)
  const getPid = (p) => (p?.id ?? p?.project_id);
  const getPname = (p) => (p?.name ?? p?.project_name ?? "이름 없음");

  const toggleProject = (rawPid) => {
    const pid = rawPid ?? null;
    if (pid === null || pid === undefined) return;
    setSelectedProjectIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const resetProjects = () => setSelectedProjectIds([]);

  const applyProjects = () => {
    // undefined/null 제거 + 중복 제거
    const deduped = Array.from(
      new Set(selectedProjectIds.filter((x) => x !== null && x !== undefined))
    );
    setCommittedProjectIds(deduped);
    setProjOpen(false);
  };

  // 상위로 전달할 filters
  const filters = useMemo(() => {
    return {
      // 섹션 토글
      include_projects: includeProjects,
      include_quiz: includeQuiz,
      include_codingtest: includeCodingtest,
      include_tech: includeTech,
      // 프로젝트 (확정값만)
      project_ids: committedProjectIds,
      // 역할(레이아웃/톤 대신)
      role_preset: rolePreset, // ← 백엔드에서 이 키를 사용하세요
      // AI 메모/지시사항
      ai_notes: aiNotes?.trim() || "",
    };
  }, [
    includeProjects,
    includeQuiz,
    includeCodingtest,
    includeTech,
    committedProjectIds,
    rolePreset,
    aiNotes,
  ]);

  // 상위로 변경 통지
  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">포트폴리오 필터</h2>
        <div className="text-sm text-gray-500">* 연결이 완료되어 필터 사용 가능</div>
      </div>

      {/* 기본 필터 */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={18} />
          <h3 className="font-semibold">기본 필터</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 프로젝트 선택 (축소된 드롭다운) */}
          <div className="md:col-span-1 flex flex-col gap-1 relative" ref={projPanelRef}>
            <label className="block text-sm text-gray-600 mb-1">프로젝트</label>
            <button
              type="button"
              onClick={() => {
                // 팝오버 열 때 확정 상태로 초기화 + 이상치 제거
                setSelectedProjectIds(
                  committedProjectIds.filter((x) => x !== null && x !== undefined)
                );
                setProjOpen((v) => !v);
              }}
              className="h-9 inline-flex items-center gap-2 border border-gray-300 rounded-md px-2.5 text-sm bg-white hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-300 w-[220px] justify-between"
              title="프로젝트 다중 선택"
            >
              <span className="truncate text-left text-[13px]">
                {committedProjectIds.length
                  ? `${committedProjectIds.length}개 선택됨`
                  : "선택하기"}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
            </button>

            {projOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-2xl p-3">
                <div className="mb-2">
                  <div className="text-sm font-semibold text-gray-800">프로젝트</div>
                  <div className="text-xs text-gray-500">중복 선택 가능</div>
                </div>

                <div className="max-h-56 overflow-y-auto pr-1">
                  <div className="flex flex-wrap gap-2">
                    {projects.length === 0 ? (
                      <span className="text-sm text-gray-500">프로젝트가 없습니다.</span>
                    ) : (
                      projects.map((p) => {
                        const pid = getPid(p);
                        const pname = getPname(p);
                        const valid = pid !== null && pid !== undefined;
                        const active = valid && selectedProjectIds.includes(pid);
                        return (
                          <button
                            key={valid ? pid : `invalid-${pname}`}
                            type="button"
                            onClick={() => valid && toggleProject(pid)}
                            className={[
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] transition-colors",
                              active
                                ? "border-green-300 bg-green-50 text-green-700"
                                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-green-300",
                              !valid && "opacity-50 cursor-not-allowed",
                            ].join(" ")}
                            title={pname}
                          >
                            {pname}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={resetProjects}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    선택 초기화
                  </button>
                  <button
                    type="button"
                    onClick={applyProjects}
                    className="h-8 rounded-md bg-green-600 px-3 text-xs text-white hover:bg-green-700"
                  >
                    적용하기
                  </button>
                </div>
              </div>
            )}

            {/* 확정된 프로젝트 칩 */}
            <div
              className={`transition-all duration-300 overflow-hidden ${
                committedProjectIds.length ? "max-h-20 mt-2 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-green-100 bg-green-50/50 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setCommittedProjectIds([])}
                  className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700"
                  title="선택 초기화"
                >
                  <RefreshCw className="w-3 h-3" />
                  초기화
                </button>

                {committedProjectIds.map((pid) => {
                  const name =
                    getPname(projects.find((p) => getPid(p) === pid)) || pid;
                  return (
                    <span
                      key={pid}
                      className="inline-flex items-center rounded-full border border-green-200 bg-white text-green-700 px-2 py-0.5 text-[11px] shadow-sm"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() =>
                          setCommittedProjectIds((prev) =>
                            prev.filter((id) => id !== pid)
                          )
                        }
                        className="ml-1 hover:text-green-900"
                        aria-label={`${name} 제거`}
                        title="제거"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 오른쪽 컬럼은 비움 */}
          <div className="md:col-span-2" />
        </div>
      </section>

      {/* 역할 선택 */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <UserSquare2 size={18} />
          <h3 className="font-semibold">역할 선택</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setRolePreset(opt)}
              className={`px-3 py-2 rounded-xl border hover:bg-gray-50 ${
                rolePreset === opt
                  ? "border-green-600 text-green-700"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          선택한 역할에 맞춰 포트폴리오 텍스트의 강조 포인트가 달라집니다. (예: 프론트엔드는 UI/상호작용, 백엔드는 성능/확장성, 풀스택은 전체 흐름)
        </p>
      </section>

      {/* AI 메모/지시사항 입력 */}
      <section>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          AI에게 전달할 메모/지시사항
        </label>
        <textarea
          value={aiNotes}
          onChange={(e) => setAiNotes(e.target.value)}
          rows={5}
          placeholder={
            "예:\n- 프론트엔드 중심으로 프로젝트 역할을 강조해주세요.\n- 숫자 지표(트래픽, 전환율)를 문장마다 포함해주세요.\n- 최근 해커톤 우승 프로젝트는 맨 위에 배치해주세요."
          }
          className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 resize-y"
        />
        <div className="mt-1 text-xs text-gray-400">{aiNotes.length}자 입력됨</div>
      </section>
    </div>
  );
}
