import React, { useEffect, useState } from "react";
import { getProjectMembers, updateProject, transferLeader, removeMember, addMember, getProjectActivity } from "../../api/projectApi";

const dummyFriends = [
  { id: 1, nickname: "김코알라", email: "koala1@example.com" },
  { id: 2, nickname: "이개발자", email: "devlee@example.com" },
  { id: 3, nickname: "박프론트", email: "frontp@example.com" },
];

const ProjectDetailPanel = ({ project, onUpdate }) => {
  const [members, setMembers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [projectName, setProjectName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [goal, setGoal] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [resource, setResource] = useState("");
  const [editMode, setEditMode] = useState({ name: false, description: false });
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, activityRes] = await Promise.all([
          getProjectMembers(project.project_id),
          getProjectActivity(project.project_id),
        ]);
        setMembers(membersRes);
        setActivityLogs(activityRes);
      } catch (err) {
        console.error("데이터 가져오기 실패", err);
      }
    };
    fetchData();
  }, [project.project_id]);

  const handleAddMember = async () => {
    if (selectedFriend) {
      try {
        await addMember(project.project_id, selectedFriend.id);
        const [membersRes, activityRes] = await Promise.all([
          getProjectMembers(project.project_id),
          getProjectActivity(project.project_id),
        ]);
        setMembers(membersRes);
        setActivityLogs(activityRes);
        setShowInviteModal(false);
        setSelectedFriend(null);
        onUpdate();
      } catch (err) {
        console.error("멤버 추가 실패", err);
        alert("멤버 추가에 실패했습니다.");
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
      setMembers(membersRes);
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
      setMembers(membersRes);
      setActivityLogs(activityRes);
      setOpenMenuId(null);
      onUpdate();
    } catch (err) {
      console.error("팀장 권한 이전 실패", err);
      alert("팀장 권한 이전에 실패했습니다.");
    }
  };

  const handleUpdateProject = async () => {
    try {
      const projectData = {
        name: projectName,
        description,
        widgets: project.widgets || {
          erd: false,
          git: false,
          docs: false,
          chat: false,
          calendar: false,
          memo: false,
        },
      };
      await updateProject(project.project_id, projectData);
      const activityRes = await getProjectActivity(project.project_id);
      setActivityLogs(activityRes);
      onUpdate();
    } catch (err) {
      console.error("프로젝트 업데이트 실패", err);
      alert("프로젝트 업데이트에 실패했습니다.");
    }
  };

  const toggleMenu = (userId) => {
    setOpenMenuId((prev) => (prev === userId ? null : userId));
  };

  return (
    <div className="flex gap-8">
      <div className="flex-1 pl-4 pt-4 space-y-6">
        <div>
          {editMode.name ? (
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => {
                setEditMode((prev) => ({ ...prev, name: false }));
                handleUpdateProject();
              }}
              className="text-3xl font-bold border-b w-full pb-1"
              autoFocus
            />
          ) : (
            <h1
              className="text-3xl font-bold cursor-pointer hover:underline"
              onClick={() => setEditMode((prev) => ({ ...prev, name: true }))}
            >
              {projectName}
            </h1>
          )}
        </div>

        <div>
          <p className="text-gray-500 mb-1">프로젝트 설명</p>
          {editMode.description ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                setEditMode((prev) => ({ ...prev, description: false }));
                handleUpdateProject();
              }}
              rows={3}
              className="w-full border rounded p-3 text-sm resize-none"
              autoFocus
            />
          ) : (
            <p
              className="text-sm text-gray-700 whitespace-pre-line cursor-pointer hover:bg-gray-100 p-2 rounded"
              onClick={() => setEditMode((prev) => ({ ...prev, description: true }))}
            >
              {description || "이 프로젝트에 대해 설명을 입력하세요."}
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-lg">프로젝트 역할</h2>
            <button
              onClick={() => setShowInviteModal(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              + 멤버 추가
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {members.map((m) => (
              <div
                key={m.user_id}
                onClick={() => toggleMenu(m.user_id)}
                className="relative group bg-white border hover:border-blue-400 transition rounded-xl p-4 shadow-sm cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-base font-semibold text-gray-800">
                      {m.nickname} {m.is_leader && <span className="text-blue-600 text-sm">(팀장)</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">프로젝트 소유자</p>
                  </div>
                  <div className="text-gray-400 group-hover:text-gray-800 text-lg leading-none">⌄</div>
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
                    <button className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100">
                      역할 추가
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">연결된 목표</h2>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="목표를 입력하세요."
            className="w-full border rounded p-3 text-sm resize-none"
            rows={2}
          />
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">연결된 포트폴리오</h2>
          <textarea
            value={portfolio}
            onChange={(e) => setPortfolio(e.target.value)}
            placeholder="포트폴리오 정보를 입력하세요."
            className="w-full border rounded p-3 text-sm resize-none"
            rows={2}
          />
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-1">핵심 리소스</h2>
          <textarea
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            placeholder="리소스를 입력하세요."
            className="w-full border rounded p-3 text-sm resize-none"
            rows={2}
          />
        </div>
      </div>

      <div className="w-80 space-y-4">
        <div className="bg-white border rounded p-4">
          <p className="text-sm font-semibold mb-2">📌 프로젝트 상태</p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">진행 중</span>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">위험</span>
          </div>
        </div>

        <div className="bg-white border rounded p-4">
          <p className="text-sm font-semibold mb-3">📜 활동 기록</p>
          <ul className="text-xs text-gray-700 space-y-1">
            {activityLogs.map((log) => (
              <li key={log.id} className="flex justify-between">
                <span>👤 {log.actor} - {log.text}</span>
                <span className="text-gray-400">{log.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white w-[420px] p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">멤버 초대</h2>
            <div className="space-y-2 mb-4">
              {dummyFriends.map((friend) => (
                <div
                  key={friend.id}
                  className={`border rounded p-2 cursor-pointer ${
                    selectedFriend?.id === friend.id
                      ? "bg-blue-100 border-blue-400"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedFriend(friend)}
                >
                  <p className="text-sm font-medium">{friend.nickname}</p>
                  <p className="text-xs text-gray-500">{friend.email}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleAddMember}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                초대
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPanel;