import React, { useState } from "react";
import { acceptProjectInvite, rejectProjectInvite } from "../../api/projectApi";
import { useNavigate } from "react-router-dom";

const ProjectInviteCard = ({ invite, isMine }) => {
  const navigate = useNavigate();
  const [responded, setResponded] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const projectId = invite.message_metadata?.project_id;
  const projectName = invite.message_metadata?.project_name || "알 수 없음";
  const inviteStatus = invite.invite_status; // ✅ 백엔드에서 내려주는 값

  const handleAcceptInvite = async () => {
    try {
      await acceptProjectInvite(projectId);
      console.log("📦 invite 전달값", invite);
      setAccepted(true);
      setResponded(true);
    } catch (err) {
      console.error("초대 수락 실패:", err);
    }
  };

  const handleDeclineInvite = async () => {
    try {
      await rejectProjectInvite(projectId);
      setAccepted(false);
      setResponded(true);
    } catch (err) {
      console.error("초대 거절 실패:", err);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm max-w-xs">
      <div className="font-semibold text-sm mb-2">프로젝트 초대</div>
      <div className="text-sm mb-3">
        <strong>{projectName}</strong> 프로젝트에 초대했습니다.
      </div>

      {isMine ? (
        <div className="text-xs text-gray-500">초대 메시지를 보냈습니다.</div>
      ) : inviteStatus === "accepted" || accepted ? (
        <div className="text-sm text-green-600 font-medium">
          ✅ 초대를 수락했습니다.
          <button
            onClick={() => navigate("/team-project")}
            className="mt-2 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          >
            바로 이동
          </button>
        </div>
      ) : inviteStatus === "rejected" ? (
        <div className="text-sm text-gray-500">❌ 초대를 거절했습니다.</div>
      ) : (
        !responded && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAcceptInvite}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              수락
            </button>
            <button
              onClick={handleDeclineInvite}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
            >
              거절
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default ProjectInviteCard;
