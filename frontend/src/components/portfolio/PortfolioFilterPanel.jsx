// frontend/src/components/portfolio/PortfolioFilterPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SlidersHorizontal,
  UserSquare2,
  ChevronDown,
  Crown,
  Users,
  PlayCircle,
  Square,
  CheckCircle2,
  Tag,
  FileText,
  LayoutDashboard,
  Settings as SettingsIcon,
} from "lucide-react";
import { getProjectMembers } from "../../api/projectApi";
import { getCurrentUser } from "../../api/authApi";

/**
 * 포트폴리오 필터 패널 (단일 프로젝트 선택 + 내 역할 자동 표시)
 * - 프로젝트: 단일 선택, 항목 클릭 시 즉시 반영 & 팝오버 닫힘
 * - 역할: 선택 UI 제거 → 선택한 프로젝트에서 '내 역할'을 자동 조회하여 칩으로 표시
 * - role_preset: 내 역할에 따라 자동 결정(풀스택 > 프론트엔드 > 백엔드 > "")
 *
 * filters 스키마(기존 유지):
 *  {
 *    include_projects: true,
 *    include_quiz: true,
 *    include_codingtest: true,
 *    include_tech: true,
 *    project_ids: [<선택된ID>] 또는 [],
 *    role_preset: "frontend" | "backend" | "fullstack" | "",
 *    ai_notes: string
 *  }
 */
export default function PortfolioFilterPanel({
  onFiltersChange,
  projects = [],
  showAINotes = true,
}) {
  // 섹션 on/off (기존 값 유지)
  const [includeProjects] = useState(true);
  const [includeQuiz] = useState(true);
  const [includeCodingtest] = useState(true);
  const [includeTech] = useState(true);

  // 프로젝트 단일 선택
  const [projOpen, setProjOpen] = useState(false);
  const projPanelRef = useRef(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  // 내 역할(배열) & role_preset(자동)
  const [myRoles, setMyRoles] = useState([]);
  const [isLeader, setIsLeader] = useState(false);
  const [rolePreset, setRolePreset] = useState("");

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

  // 안전한 id/name 추출
  const getPid = (p) => p?.id ?? p?.project_id;
  const getPname = (p) => p?.name ?? p?.project_name ?? "이름 없음";
  const getPdesc = (p) => String(p?.description ?? p?.desc ?? p?.project_desc ?? "").trim();
  const getPtopic = (p) => p?.topic ?? "";
  const getPtech = (p) => {
    const raw = p?.tech_stack;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string")
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    return [];
  };

  const validProjects = useMemo(() => projects.filter((p) => getPid(p) != null), [projects]);
  const activeProjects = useMemo(() => validProjects.filter((p) => !Boolean(p?.is_closed)), [validProjects]);
  const closedProjects = useMemo(() => validProjects.filter((p) => Boolean(p?.is_closed)), [validProjects]);

  // 필터 산출 (role_preset은 자동 계산된 값 사용)
  const filters = useMemo(() => {
    return {
      include_projects: includeProjects,
      include_quiz: includeQuiz,
      include_codingtest: includeCodingtest,
      include_tech: includeTech,
      project_ids: selectedProjectId ? [selectedProjectId] : [],
      role_preset: rolePreset,
      ai_notes: showAINotes ? aiNotes?.trim() || "" : "",
      my_roles: Array.isArray(myRoles) ? myRoles : [],
      is_leader: !!isLeader,
    };
  }, [
    includeProjects,
    includeQuiz,
    includeCodingtest,
    includeTech,
    selectedProjectId,
    rolePreset,
    aiNotes,
    showAINotes,
    myRoles,
    isLeader,
  ]);

  // 상위로 변경 통지
  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  // 항목 클릭 시 즉시 선택 & 닫힘
  const handlePickProject = (pid) => {
    if (pid === null || pid === undefined) return;
    setSelectedProjectId(pid);
    setProjOpen(false);
  };

  // 현재 선택 프로젝트 정보
  const selectedProjectName =
    projects.length && selectedProjectId
      ? getPname(projects.find((p) => getPid(p) === selectedProjectId))
      : "";

  const selectedProjectDesc =
    projects.length && selectedProjectId
      ? getPdesc(projects.find((p) => getPid(p) === selectedProjectId))
      : "";

  const selectedProjectTopic =
    projects.length && selectedProjectId
      ? getPtopic(projects.find((p) => getPid(p) === selectedProjectId))
      : "";

  const selectedProjectTech =
    projects.length && selectedProjectId
      ? getPtech(projects.find((p) => getPid(p) === selectedProjectId))
      : [];

  // 내 역할/팀원 로딩
  useEffect(() => {
    const loadMyRole = async () => {
      if (!selectedProjectId) {
        setMyRoles([]);
        setRolePreset("");
        setIsLeader(false);
        setTeamMembers([]);
        return;
      }
      try {
        let myId = null;
        try {
          const me = await getCurrentUser(); // { user_id } 가정
          myId = Number(me?.user_id ?? me?.id ?? null);
        } catch {
          const myIdStr = localStorage.getItem("userId");
          myId = myIdStr ? Number(myIdStr) : null;
        }

        const members = await getProjectMembers(selectedProjectId);

        // 개요 카드에서 쓸 팀원(역할)
        setTeamMembers(
          (members || []).map((m) => ({
            user_id: Number(m?.user_id),
            nickname: m?.nickname || "이름 없음",
            is_leader: m?.is_leader === true,
            roles: Array.isArray(m?.roles)
              ? m.roles
              : typeof m?.roles === "string"
              ? m.roles.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
          }))
        );

        const meMember = members.find((m) => Number(m?.user_id) === Number(myId));

        const raw = meMember?.roles;
        let rolesArr = Array.isArray(raw)
          ? raw
          : typeof raw === "string"
          ? raw.split(",").map((s) => s.trim()).filter(Boolean)
          : [];

        setIsLeader(meMember?.is_leader === true);
        setMyRoles(rolesArr);

        const has = (re) => rolesArr.some((r) => re.test(r));
        if (has(/풀스택|full\s*stack/i)) setRolePreset("fullstack");
        else if (has(/프론트|front\s*end/i)) setRolePreset("frontend");
        else if (has(/백엔드|back\s*end/i)) setRolePreset("backend");
        else setRolePreset("");
      } catch (e) {
        console.error("내 역할 조회 실패", e);
        setMyRoles([]);
        setRolePreset("");
        setIsLeader(false);
      }
    };

    loadMyRole();
  }, [selectedProjectId]);

  return (
    <div>
      <div className="flex items-center justify-between"></div>

      {/* 기본 필터 */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={18} />
          <h3 className="font-semibold">기본 필터</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ▶ 프로젝트 단일 선택 */}
          <div className="md:col-span-1 flex flex-col gap-1 relative" ref={projPanelRef}>
            <label className="block text-sm text-gray-600 mb-1">프로젝트</label>

            <div className="relative">
              {/* 버튼 */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setProjOpen((v) => !v)}
                  className="h-9 inline-flex items-center gap-2 border border-gray-300 rounded-md px-2.5 text-sm bg-white hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-300 w-[220px] justify-between"
                  title="프로젝트 선택"
                >
                  <span className="truncate text-left text-[13px]">
                    {selectedProjectId ? (selectedProjectName || "(이름 없음)") : " 프로젝트 선택"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                </button>
              </div>

              {projOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 w-[28rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5 p-3 backdrop-blur-[2px]">
                  {/* 헤더 */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">프로젝트 선택</div>
                    <div className="text-[11px] text-gray-500">
                      진행중 {activeProjects.length} · 종료됨 {closedProjects.length}
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto pr-1 space-y-3">
                    {/* 진행중 섹션 */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <PlayCircle className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs font-semibold text-gray-700">진행중</span>
                      </div>

                      {activeProjects.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-gray-500">진행중 프로젝트가 없습니다.</div>
                      ) : (
                        <ul className="space-y-1">
                          {activeProjects.map((p) => {
                            const pid = getPid(p);
                            const name = getPname(p);
                            const desc = getPdesc(p);
                            const selected = selectedProjectId === pid;
                            return (
                              <li key={pid}>
                                <button
                                  type="button"
                                  onClick={() => handlePickProject(pid)}
                                  className={[
                                    "w-full text-left px-3 py-2 rounded-lg border transition-colors",
                                    selected
                                      ? "border-green-300 bg-green-50/60"
                                      : "border-transparent hover:bg-gray-50",
                                  ].join(" ")}
                                  title={name}
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[13px] font-medium text-gray-900 truncate">{name}</span>
                                        {selected && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                                      </div>
                                      {desc && (
                                        <div className="text-[11px] text-gray-500/90 italic truncate mt-0.5" title={desc}>
                                          {desc}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {/* 종료됨 섹션 */}
                    <div className="pt-3 border-t border-gray-100/80">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Square className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-700">종료됨</span>
                      </div>

                      {closedProjects.length === 0 ? (
                        <div className="px-2 py-2 text-xs text-gray-500">종료된 프로젝트가 없습니다.</div>
                      ) : (
                        <ul className="space-y-1">
                          {closedProjects.map((p) => {
                            const pid = getPid(p);
                            const name = getPname(p);
                            const desc = getPdesc(p);
                            const selected = selectedProjectId === pid;
                            return (
                              <li key={pid}>
                                <button
                                  type="button"
                                  onClick={() => handlePickProject(pid)}
                                  className={[
                                    "w-full text-left px-3 py-2 rounded-lg border transition-colors",
                                    selected
                                      ? "border-green-300 bg-green-50"
                                      : "border-transparent hover:bg-gray-50",
                                  ].join(" ")}
                                  title={name}
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[13px] font-medium text-gray-900 truncate">{name}</span>
                                        {selected && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                      </div>
                                      {desc && (
                                        <div className="text-[11px] text-gray-500/90 italic truncate mt-0.5" title={desc}>
                                          {desc}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-1 text-xs text-gray-500">프로젝트는 하나만 선택할 수 있어요.</p>
          </div>

          {/* (기존 오른쪽 칼럼 비움) */}
          <div className="md:col-span-2" />
        </div>

        {/* ▼ 프로젝트 개요: 프로젝트 선택 블록 '아래'로 이동 + 팀원 → 설명 순서 */}
        {selectedProjectId && (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <LayoutDashboard className="w-4 h-4 text-indigo-600" />
              <span>프로젝트 개요</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 text-[13px]">
              {/* 1) 팀원(역할) */}
              <div>
                <div className="text-gray-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>팀원(역할)</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(teamMembers || []).length > 0 ? (
                    teamMembers.map((m) => (
                      <span
                        key={m.user_id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 max-w-full"
                        title={`${m.nickname}${m.roles?.length ? ` · ${m.roles.join(", ")}` : ""}`}
                      >
                        <span className="font-medium break-all">{m.nickname}</span>
                        {Array.isArray(m.roles) && m.roles.length > 0 && (
                          <span className="text-[11px] text-gray-400 break-all">({m.roles.join(", ")})</span>
                        )}
                        {m.is_leader && <Crown className="w-3 h-3 text-amber-500" />}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>

              {/* 2) 설명 */}
              <div>
                <div className="text-gray-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-black-500" />
                  <span>설명</span>
                </div>
                <div className="mt-1 text-gray-800 leading-6 whitespace-pre-wrap break-words">
                  {selectedProjectDesc || <span className="text-gray-400">-</span>}
                </div>
              </div>

              {/* 3) 프로젝트 주제 */}
              <div>
                <div className="text-gray-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>프로젝트 주제</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedProjectTopic ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border bg-white text-gray-700">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="break-all">{selectedProjectTopic}</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>

              {/* 4) 기술 스택 */}
              <div>
                <div className="text-gray-500 flex items-center gap-1.5">
                  <SettingsIcon className="w-3.5 h-3.5 text-green-600" />
                  <span>기술 스택</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedProjectTech && selectedProjectTech.length > 0 ? (
                    selectedProjectTech.map((t, i) => (
                      <span
                        key={`${t}-${i}`}
                        className="px-2 py-0.5 rounded-md border bg-white text-gray-700 max-w-full"
                        title={t}
                      >
                        <span className="break-all">{t}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ✅ 역할 표시(자동) : 팀장/팀원 배지 + 역할 배지 */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <UserSquare2 size={18} />
          <h3 className="font-semibold">내 역할</h3>
        </div>

        {/* 카드형 표시 */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
          {!selectedProjectId ? (
            <p className="text-sm text-gray-500">프로젝트를 먼저 선택하세요.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {/* 상단: 팀장/팀원 상태 배지 */}
              <div className="flex items-center gap-2">
                {isLeader ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
                    <Crown className="w-3.5 h-3.5" />
                    팀장
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    팀원
                  </span>
                )}
              </div>

              {/* 하단: 역할 목록(뱃지) */}
              <div className="flex flex-wrap items-center gap-2">
                {myRoles.length > 0 ? (
                  myRoles.map((role) => (
                    <span
                      key={role}
                      className="px-2.5 py-1 rounded-full text-xs border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">역할 정보가 없습니다.</span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ✅ Export 페이지에서만 AI 메모를 받기 위해 조건부 렌더 */}
      {showAINotes && (
        <section>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            AI에게 전달할 메모/지시사항
          </label>
          <textarea
            value={aiNotes}
            onChange={(e) => setAiNotes(e.target.value)}
            rows={5}
            placeholder={
              "예:\n- 프론트엔드 중심으로 프로젝트 역할을 강조해주세요.\n- 주요 기능과 내가 맡은 부분을 간단히 정리해주세요.\n- 협업 과정과 사용한 기술 스택을 자연스럽게 녹여주세요."
            }
            className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 resize-y"
          />
          <div className="mt-1 text-xs text-gray-400">{aiNotes.length}자 입력됨</div>
        </section>
      )}
    </div>
  );
}
