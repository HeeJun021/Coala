import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../api/authApi";
import InviteProjectMember from "./InviteProjectMember";
import TagInput from "../common/TagInput";
import {
  getProjectMembers,
  updateProject,
  transferLeader,
  removeMember,
  getProjectActivity,
  sendProjectInvite,
  updateMemberRoles,
  leaveProject,
  closeProject,
  reopenProject
} from "../../api/projectApi";
import { getMyTasks } from "../../api/taskApi";

import {
  LayoutDashboard,
  FileText,
  Users,
  Tag,
  Settings as SettingsIcon,
  Activity,
  Bell,
  History,
  Gauge
} from "lucide-react";

// 역할 옵션 목록
export const ROLE_OPTIONS = [
  "팀장(PL/PM)",
  "기획/UX",
  "디자인/UI",
  "프론트엔드",
  "백엔드",
  "풀스택", // (선택)
  "DB/데이터 모델링",
  "데이터/AI",
  "데브옵스/인프라",
  "QA/테스트",
  "보안", // (선택)
  "문서/기록",
  "운영/서비스 관리", // (선택)
];

const normalizeRoles = (rolesArray) => {
  const set = new Set(ROLE_OPTIONS);
  return (Array.isArray(rolesArray) ? rolesArray : []).filter(
    (r) => typeof r === "string" && set.has(r)
  );
};

const ProjectDetailPanel = ({ project, onUpdate, onNameChange }) => {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userId");

  const [members, setMembers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const [projectName, setProjectName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [editMode, setEditMode] = useState({ name: false, description: false });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [topic, setTopic] = useState(project.topic || "");
  const [techStack, setTechStack] = useState(project.tech_stack || []);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [meId, setMeId] = useState(null);
  const [allMyTasks, setAllMyTasks] = useState([]);

  // ✅ 종료 여부 + 읽기 전용 가드
  const isClosed = !!project?.is_closed;
  const guardClosed = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    alert("종료된 프로젝트입니다.");
  };

  // 진행률 계산
  useEffect(() => {
    getMyTasks()
      .then((res) => setAllMyTasks(res || []))
      .catch(() => setAllMyTasks([]));
  }, []);
  const getActiveCountsForProject = (tasks, projectId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let active = 0,
      done = 0;
    for (const t of tasks || []) {
      if (t.project_id !== projectId) continue;
      const due = t.due_date ? new Date(t.due_date) : null;
      const isDone = t.status === "완료됨";
      const isOverdueUnfinished = !isDone && due && due < today;
      const shouldCountInActive = isDone || !isOverdueUnfinished;
      if (shouldCountInActive) active += 1;
      if (isDone) done += 1;
    }
    return { active, done };
  };
  const computeProgress = ({ active, done }) =>
    active === 0 ? 0 : Math.min(100, Math.round((done / active) * 100));
  const progressCounts = getActiveCountsForProject(allMyTasks, project.project_id);
  const projectProgress = computeProgress(progressCounts);

  // 내 정보 로드
  useEffect(() => {
    getCurrentUser()
      .then((me) => setMeId(me.user_id))
      .catch(() => setMeId(null));
  }, []);

  // leaderId 안전 계산
  const leaderId =
    project.leader_id ?? members.find((m) => m.is_leader)?.user_id ?? null;

  // 바깥 클릭 시 멤버 메뉴 닫기
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);
  // ESC로 닫기
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // 멤버/활동 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, activityRes] = await Promise.all([
          getProjectMembers(project.project_id),
          getProjectActivity(project.project_id),
        ]);
        const acceptedMembers = membersRes.filter((m) => m.status === "accepted");
        setMembers(acceptedMembers);
        setActivityLogs(activityRes);
      } catch (err) {
        console.error("데이터 가져오기 실패", err);
      }
    };
    fetchData();
  }, [project.project_id]);

  // 프로젝트명 바뀌면 입력 반영
  useEffect(() => {
    setProjectName(project.name);
  }, [project.name]);

  const handleInviteMember = async () => {
    if (selectedFriend) {
      try {
        await sendProjectInvite(project.project_id, selectedFriend.id);
        setShowInviteModal(false);
        setSelectedFriend(null);
      } catch (err) {
        console.error("초대 실패", err);
        alert("초대에 실패했습니다.");
      }
    }
  };

  const handleRemoveMember = async (userId) => {
    if (isClosed) return guardClosed();
    try {
      await removeMember(project.project_id, userId);
      const [membersRes, activityRes] = await Promise.all([
        getProjectMembers(project.project_id),
        getProjectActivity(project.project_id),
      ]);
      const acceptedMembers = membersRes.filter((m) => m.status === "accepted");
      setMembers(acceptedMembers);
      setActivityLogs(activityRes);
      setOpenMenuId(null);
      onUpdate?.();
    } catch (err) {
      console.error("멤버 방출 실패", err);
      alert("멤버 방출에 실패했습니다.");
    }
  };

  const handleTransferLeader = async (userId) => {
    if (isClosed) return guardClosed();
    try {
      await transferLeader(project.project_id, userId);
      const [membersRes, activityRes] = await Promise.all([
        getProjectMembers(project.project_id),
        getProjectActivity(project.project_id),
      ]);
      const acceptedMembers = membersRes.filter((m) => m.status === "accepted");
      setMembers(acceptedMembers);
      setActivityLogs(activityRes);
      setOpenMenuId(null);
      onUpdate?.();
    } catch (err) {
      console.error("팀장 권한 이전 실패", err);
      alert("팀장 권한 이전에 실패했습니다.");
    }
  };

  const handleUpdateProject = async (tags = techStack) => {
    if (isClosed) return guardClosed();
    try {
      const projectData = {
        name: projectName,
        description,
        topic,
        tech_stack: tags,
        widgets: project.widgets || {
          erd: false,
          git: false,
          docs: false,
          chat: false,
          calendar: false,
          memo: false,
          timeline: false,
        },
      };
      await updateProject(project.project_id, projectData);
      const activityRes = await getProjectActivity(project.project_id);
      setActivityLogs(activityRes);
      onUpdate?.();
      onNameChange?.(project.project_id, projectName);
    } catch (err) {
      console.error("프로젝트 업데이트 실패", err);
      alert("프로젝트 업데이트에 실패했습니다.");
    }
  };

  const toggleMenu = (userId) => {
    if (isClosed) return guardClosed();
    setOpenMenuId((prev) => (prev === userId ? null : userId));
  };

  const handleOpenRoleModal = (userId, roles) => {
    if (isClosed) return guardClosed();
    setSelectedUserId(userId ?? null);
    setSelectedRoles(roles || []);
    setShowRoleModal(true);
  };

  const handleSaveRoles = async () => {
    if (isClosed) return guardClosed();
    if (!selectedUserId) return;
    try {
      const cleaned = normalizeRoles(selectedRoles);
      await updateMemberRoles(project.project_id, Number(selectedUserId), {
        roles: cleaned,
      });
      const membersRes = await getProjectMembers(project.project_id);
      setMembers(membersRes.filter((m) => m.status === "accepted"));
      setShowRoleModal(false);
    } catch (err) {
      console.error("역할 저장 실패", err);
      alert("역할 저장에 실패했습니다.");
    }
  };

const handleLeaveProject = async () => {
  if (!window.confirm("정말 프로젝트에서 탈퇴하시겠습니까?")) return;

  try {
    await leaveProject(project.project_id);
    alert("프로젝트에서 탈퇴되었습니다.");

    // ✅ 사이드바 즉시 새로고침 트리거
    window.dispatchEvent(new CustomEvent("projects:refresh", {
      detail: { projectId: project.project_id, action: "leave" }
    }));

    onUpdate?.();
    navigate("/team-project", { replace: true });
  } catch (e) {
    alert(e?.response?.data?.detail || "탈퇴에 실패했습니다.");
  }
};

const handleCloseProject = async () => {
  if (!(meId && leaderId && meId === leaderId)) return;
  if (!window.confirm("프로젝트를 종료하면 읽기 전용으로 전환됩니다. 계속할까요?")) return;

  try {
    await closeProject(project.project_id);
    alert("프로젝트가 종료되었습니다.");

    // 사이드바 새로고침 이벤트
    window.dispatchEvent(new CustomEvent("projects:refresh", {
      detail: { projectId: project.project_id, action: "close" }
    }));

    // ✅ 전체 페이지 새로고침
    window.location.reload();

  } catch (e) {
    alert(e?.response?.data?.detail || "종료에 실패했습니다.");
  }
};

// ✅ [추가] 프로젝트 활성화 핸들러 (팀장)
const handleReopenProject = async () => {
  if (!(meId && leaderId && meId === leaderId)) return;
  if (!window.confirm("프로젝트를 다시 활성화하시겠습니까? '진행 중' 상태로 변경됩니다.")) return;

  try {
    await reopenProject(project.project_id);
    alert("프로젝트가 활성화되었습니다.");

    // 사이드바 새로고침 이벤트
    window.dispatchEvent(new CustomEvent("projects:refresh", {
      detail: { projectId: project.project_id, action: "reopen" }
    }));

    window.location.reload(); // 전체 새로고침
  } catch (e) {
    alert(e?.response?.data?.detail || "활성화에 실패했습니다.");
  }
};
  const displayedLogs = showAllLogs ? activityLogs : activityLogs.slice(0, 5);

  return (
    <div className="flex gap-8 px-10 pt-4 pb-32">
      <div className="flex-1 pl-4 pt-4 space-y-6 pb-32">
        <div>
          {editMode.name ? (
            <input
              type="text"
              value={projectName}
              disabled={isClosed}
              onClick={isClosed ? guardClosed : undefined}
              onChange={(e) => {
                setProjectName(e.target.value);
                onNameChange?.(project.project_id, e.target.value);
              }}
              onBlur={() => {
                setEditMode((prev) => ({ ...prev, name: false }));
                handleUpdateProject();
              }}
              className={`text-3xl font-bold border border-gray-300 rounded-md w-full px-3 py-2 focus:outline-none transition-all ${
                isClosed ? "bg-gray-100 cursor-not-allowed" : "focus:border-green-600"
              }`}
              autoFocus
            />
          ) : (
            <h1
              className="text-3xl font-bold flex items-center gap-2"
              onClick={isClosed ? guardClosed : () =>
                setEditMode((prev) => ({ ...prev, name: true }))
              }
            >
              <LayoutDashboard size={22} className="text-indigo-600" />
              {projectName}
              {isClosed && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                  종료됨 (읽기 전용)
                </span>
              )}
            </h1>
          )}
        </div>

        <div>
          <p className=" mb-1 flex items-center gap-2 font-semibold text-lg">
            <FileText size={18} className="text-black" />
            프로젝트 설명
          </p>

          <textarea
            value={description}
            disabled={isClosed}
            onClick={isClosed ? guardClosed : undefined}
            onChange={isClosed ? undefined : (e) => setDescription(e.target.value)}
            onBlur={isClosed ? undefined : () => handleUpdateProject(techStack)}
            rows={3}
            placeholder="이 프로젝트에 대한 설명을 입력하세요"
            className={`w-full border rounded p-3 text-sm resize-none focus:outline-none transition-all ${
              isClosed ? "bg-gray-100 cursor-not-allowed" : "focus:border-green-600"
            }`}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
              <Users size={18} className="text-blue-500" />
              프로젝트 역할
            </h2>

            <button
              onClick={isClosed ? guardClosed : () => setShowInviteModal(true)}
              className={`text-sm ${
                isClosed
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:underline"
              }`}
            >
              + 멤버 추가
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...members]
              .sort((a, b) => (b.is_leader ? 1 : 0) - (a.is_leader ? 1 : 0))
              .map((m) => (
                <div
                  key={m.user_id}
                  className="relative group bg-white border hover:border-green-500 transition rounded-xl p-4 shadow-sm cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isClosed) return guardClosed(e);
                    toggleMenu(m.user_id);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-base font-semibold text-gray-800">
                        {m.nickname}{" "}
                        {m.is_leader && (
                          <span className="text-green-600 text-sm">(팀장)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">역할:</p>
                    <div className="flex flex-wrap gap-1">
                      {(m.roles || []).map((role) => (
                        <span
                          key={role}
                          className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {role}
                        </span>
                      ))}
                      {(!m.roles || m.roles.length === 0) && (
                        <span className="text-xs text-gray-500">역할 미지정</span>
                      )}
                    </div>
                  </div>

                  {openMenuId === m.user_id && (
                    <div
                      className="absolute top-full left-0 mt-2 w-full bg-white border rounded shadow-lg z-50 min-h-[40px] p-2"
                      style={{ minWidth: "150px" }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {/* (A) 내가 리더이고, 내 카드가 아닐 때 */}
                      {meId &&
                        leaderId &&
                        meId === leaderId &&
                        meId !== m.user_id && (
                          <>
                          <button
        onClick={
          isClosed
            ? guardClosed
            : () => handleOpenRoleModal(m.user_id, m.roles)
        }
        className={`block w-full px-4 py-2 text-sm text-left ${
          isClosed ? "text-gray-400 cursor-not-allowed" : "hover:bg-gray-100"
        }`}
      >
        역할 수정
      </button>
                            <button
                              onClick={
                                isClosed
                                  ? guardClosed
                                  : () => handleRemoveMember(m.user_id)
                              }
                              className={`block w-full px-4 py-2 text-sm text-left ${
                                isClosed
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              팀원 방출
                            </button>
                            {!m.is_leader && (
                              <button
                                onClick={
                                  isClosed
                                    ? guardClosed
                                    : () => handleTransferLeader(m.user_id)
                                }
                                className={`block w-full px-4 py-2 text-sm text-left ${
                                  isClosed
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                팀장 권한 부여
                              </button>
                            )}
                          </>
                        )}

                      {/* (B) 내 카드일 때 */}
                      {meId && meId === m.user_id && (
                        <button
                          onClick={
                            isClosed
                              ? guardClosed
                              : () => handleOpenRoleModal(m.user_id, m.roles)
                          }
                          className={`block w-full px-4 py-2 text-sm text-left ${
                            isClosed
                              ? "text-gray-400 cursor-not-allowed"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          역할 수정
                        </button>
                      )}

                      {!meId && (
                        <span className="text-xs text-gray-500">
                          로그인 정보 확인 중…
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
            <Tag size={18} className="text-emerald-600" />
            프로젝트 주제
          </h2>

          <input
            type="text"
            value={topic}
            disabled={isClosed}
            onClick={isClosed ? guardClosed : undefined}
            onChange={isClosed ? undefined : (e) => setTopic(e.target.value)}
            onBlur={
              isClosed ? undefined : (e) => handleUpdateProject(techStack, e.target.value)
            }
            placeholder="예: AI 기반 추천 시스템"
            className={`w-full border rounded p-3 text-sm focus:outline-none transition-all ${
              isClosed ? "bg-gray-100 cursor-not-allowed" : "focus:border-green-600"
            }`}
          />
        </div>

        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
            <SettingsIcon size={18} className="text-green-600" />
            기술 스택
          </h2>

          <div className="relative">
            <TagInput
              tags={techStack}
              setTags={isClosed ? () => guardClosed() : setTechStack}
              suggestions={[
                "React",
                "Node.js",
                "Python",
                "Django",
                "PostgreSQL",
                "MongoDB",
                "JavaScript",
                "TypeScript",
                "CSS",
                "HTML",
              ]}
              placeholder="기술 스택 입력"
              max={10}
              onTagsChange={isClosed ? () => {} : handleUpdateProject}
            />
            {isClosed && (
              <div
                className="absolute inset-0 cursor-not-allowed"
                onClick={guardClosed}
              />
            )}
          </div>
        </div>
      </div>

      <div className="w-80 space-y-4">
        <div className="bg-white border rounded p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Gauge size={16} className="text-indigo-500" />
            프로젝트 상태
          </p>
          <div className="flex gap-2 flex-wrap">
            {isClosed ? (
              // --- 종료된 프로젝트 ---
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                종료됨 (읽기 전용)
              </span>
            ) : (
              // --- 활성 프로젝트 ---
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                진행 중
              </span>
            )}
          </div>

          {/* --- 버튼 영역 --- */}
          <div className="mt-3 flex items-center justify-end gap-3 text-xs">
            {isClosed ? (
              // --- 종료된 프로젝트일 때 ---
              meId && leaderId && meId === leaderId ? (
                // (팀장)
                <>
                  <button onClick={handleReopenProject} className="text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline">
                    프로젝트 활성화
                  </button>
                  {/* ✅ [수정] 영구 삭제 -> 프로젝트 탈퇴 (클릭 시 "팀장 탈퇴 불가" 알림이 뜰 것임) */}
                  <button onClick={handleLeaveProject} className="text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline">
                    프로젝트 탈퇴
                  </button>
                </>
              ) : (
                // (팀원)
                <button onClick={handleLeaveProject} className="text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline">
                  프로젝트 탈퇴
                </button>
              )
            ) : (
              // --- 활성 프로젝트일 때 (기존 로직) ---
              <>
                <button
                  onClick={handleLeaveProject} className="text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline" title="프로젝트에서 탈퇴">
                  프로젝트 탈퇴
                </button>
{meId && leaderId && meId === leaderId && (
                  <button onClick={handleCloseProject} className="text-red-500 hover:text-red-600 underline-offset-2 hover:underline" title="프로젝트 종료">
                    프로젝트 종료
                  </button>
                )}
              </>
)}
          </div>
          {/* ▲▲▲ [수정] 상태 뱃지 및 버튼 영역 ▲▲▲ */}
        </div>

        {/* 진행률 */}
        <div className="bg-white border rounded p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity size={16} className="text-green-600" />
            진행률
          </p>

          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{ width: `${projectProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            진행률: {projectProgress}%{" "}
            {progressCounts.active ? (
              <span className="ml-1 text-gray-400">
                (완료 {progressCounts.done} / 활성 {progressCounts.active})
              </span>
            ) : (
              <span className="ml-1 text-gray-400">(활성 작업 없음)</span>
            )}
          </p>
        </div>

        <div className="bg-white border rounded p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <History size={18} className="text-sky-600" />
            활동 기록
          </p>
          <ul className="text-xs text-gray-700 space-y-1">
            {displayedLogs.map((log) => (
              <li key={log.id} className="flex flex-col gap-0.5">
                <div className="flex items-start gap-1">
                  <Bell size={16} className="text-yellow-500 mt-0.5" />
                  <span className="leading-snug">{log.text}</span>
                </div>
                <span className="ml-5 text-[11px] text-gray-400">
                  {new Date(log.date).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
              </li>
            ))}
          </ul>
          {activityLogs.length > 5 && (
            <button
              onClick={() => setShowAllLogs((prev) => !prev)}
              className="text-sm text-blue-600 hover:underline mt-2 block w-full text-left"
            >
              {showAllLogs ? "Show less" : `Show more (${activityLogs.length - 5})`}
            </button>
          )}
        </div>
      </div>

      {showInviteModal && (
        <InviteProjectMember
          projectId={project.project_id}
          selectedFriend={selectedFriend}
          setSelectedFriend={setSelectedFriend}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteMember}
        />
      )}

      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">역할 수정</h2>
            <div className="space-y-2 max-h-72 overflow-auto pr-1">
              {ROLE_OPTIONS.map((role) => (
                <label key={role} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles((prev) =>
                          Array.from(new Set([...prev, role]))
                        );
                      } else {
                        setSelectedRoles((prev) =>
                          prev.filter((r) => r !== role)
                        );
                      }
                    }}
                  />
                  <span className="text-sm">{role}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleSaveRoles}
                disabled={!selectedUserId}
                className={`px-4 py-2 rounded text-white ${
                  selectedUserId
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPanel;
