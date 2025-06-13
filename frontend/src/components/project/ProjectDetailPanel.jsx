import React, { useEffect, useState } from "react";
import InviteProjectMember from "./InviteProjectMember";
import TagInput, { techStackOptions } from "../common/TagInput"; // 경로에 맞게 조정
import {
  getProjectMembers,
  updateProject,
  transferLeader,
  removeMember,
  getProjectActivity,
  sendProjectInvite,
} from "../../api/projectApi";

import {
  LayoutDashboard,
  FileText,
  Users,
  Tag,
  Settings as SettingsIcon,
  Activity,
  Bell,
  History,
} from "lucide-react";

const ProjectDetailPanel = ({ project, onUpdate, onNameChange }) => {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, activityRes] = await Promise.all([
          getProjectMembers(project.project_id),
          getProjectActivity(project.project_id),
        ]);

        const acceptedMembers = membersRes.filter(
          (m) => m.status === "accepted"
        );
        setMembers(acceptedMembers);
        setActivityLogs(activityRes);
      } catch (err) {
        console.error("데이터 가져오기 실패", err);
      }
    };
    fetchData();
  }, [project.project_id]);

  useEffect(() => {
    setProjectName(project.name);
  }, [project.name]);

  const handleInviteMember = async () => {
    if (selectedFriend) {
      try {
        await sendProjectInvite(project.project_id, selectedFriend.id); // 🔁 초대 API 호출
        setShowInviteModal(false);
        setSelectedFriend(null);
      } catch (err) {
        console.error("초대 실패", err);
        alert("초대에 실패했습니다.");
      }
    }
  };

  const handleRemoveMember = async (userId) => {
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
      onUpdate();
    } catch (err) {
      console.error("멤버 방출 실패", err);
      alert("멤버 방출에 실패했습니다.");
    }
  };

  const handleTransferLeader = async (userId) => {
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
      onUpdate();
    } catch (err) {
      console.error("팀장 권한 이전 실패", err);
      alert("팀장 권한 이전에 실패했습니다.");
    }
  };

  const handleUpdateProject = async (tags = techStack) => {
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
      onUpdate();
      onNameChange?.(project.project_id, projectName);
    } catch (err) {
      console.error("프로젝트 업데이트 실패", err);
      alert("프로젝트 업데이트에 실패했습니다.");
    }
  };

  const toggleMenu = (userId) => {
    setOpenMenuId((prev) => (prev === userId ? null : userId));
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
              onChange={(e) => {
                setProjectName(e.target.value);
                onNameChange?.(project.project_id, e.target.value);
              }}
              onBlur={() => {
                setEditMode((prev) => ({ ...prev, name: false }));
                handleUpdateProject();
              }}
              className="text-3xl font-bold border border-gray-300 rounded-md w-full px-3 py-2 focus:outline-none focus:border-green-600 transition-all"
              autoFocus
            />
          ) : (
            <h1
              className="text-3xl font-bold cursor-pointer hover:underline flex items-center gap-2"
              onClick={() => setEditMode((prev) => ({ ...prev, name: true }))}
            >
              <LayoutDashboard size={22} className="text-indigo-600" />
              {projectName}
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
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleUpdateProject(techStack)}
            rows={3}
            placeholder="이 프로젝트에 대한 설명을 입력하세요"
            className="w-full border rounded p-3 text-sm resize-none focus:outline-none focus:border-green-600 transition-all"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
              <Users size={18} className="text-blue-500" />
              프로젝트 역할
            </h2>

            <button
              onClick={() => setShowInviteModal(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              + 멤버 추가
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...members]
              .sort((a, b) => (b.is_leader ? 1 : 0) - (a.is_leader ? 1 : 0)) // 팀장 맨 앞
              .map((m) => (
                <div
                  key={m.user_id}
                  onClick={() => {
                    if (project.leader_id !== m.user_id) toggleMenu(m.user_id);
                  }}
                  className="relative group bg-white border hover:border-green-500 transition rounded-xl p-4 shadow-sm cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-base font-semibold text-gray-800">
                        {m.nickname}{" "}
                        {m.is_leader && (
                          <span className="text-green-600 text-sm">(팀장)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {m.role || "역할 미지정"}
                      </p>
                    </div>

                    {/* 팀장 자신일 경우 펼침 버튼 숨김 */}
                    {project.leader_id !== m.user_id && (
                      <div className="text-gray-400 group-hover:text-gray-800 text-lg leading-none">
                        ⌄
                      </div>
                    )}
                  </div>

                  {openMenuId === m.user_id && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white border rounded shadow z-10">
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                      >
                        팀원 방출
                      </button>
                      {!m.is_leader && (
                        <button
                          onClick={() => handleTransferLeader(m.user_id)}
                          className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                        >
                          팀장 권한 부여
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* 토픽 */}
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
            <Tag size={18} className="text-emerald-600" />
            프로젝트 주제
          </h2>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onBlur={(e) => handleUpdateProject(techStack, e.target.value)} // 👈 최신 topic 직접 전달
            placeholder="예: AI 기반 추천 시스템"
            className="w-full border rounded p-3 text-sm focus:outline-none focus:border-green-600 transition-all"
          />
        </div>

        {/* 기술 스택 */}
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
            <SettingsIcon size={18} className="text-green-600" />
            기술 스택
          </h2>

          <TagInput
            tags={techStack}
            setTags={setTechStack}
            suggestions={techStackOptions}
            placeholder="기술 스택 입력"
            max={10}
            onTagsChange={handleUpdateProject}
          />
        </div>
      </div>

      <div className="w-80 space-y-4">
        {/* 프로젝트 상태 */}
        <div className="bg-white border rounded p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity size={16} className="text-indigo-500" />
            프로젝트 상태
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
              진행 중
            </span>
          </div>
        </div>

        {/* 활동 기록 */}
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
              {showAllLogs
                ? "Show less"
                : `Show more (${activityLogs.length - 5})`}
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
    </div>
  );
};

export default ProjectDetailPanel;
