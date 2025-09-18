// frontend/src/components/chat/ProjectInviteCard.jsx

import React, { useState } from "react";
// inviteProjectCollaborator를 API 파일에서 꼭 import 해줘야 해!
import { acceptProjectInvite, rejectProjectInvite, inviteProjectCollaborator } from "../../api/projectApi";
import { useNavigate } from "react-router-dom";

const ProjectInviteCard = ({ invite, isMine }) => {
    const navigate = useNavigate();
    const [responded, setResponded] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // 처리 중 상태

    const projectId = invite.message_metadata?.project_id;
    const projectName = invite.message_metadata?.project_name || "알 수 없음";
    const inviteStatus = invite.invite_status;

    // 이 함수가 핵심이야!
    const handleAcceptInvite = async () => {
        const messageId = invite.message_id;

        if (!projectId || !messageId) {
            alert("초대 정보를 처리할 수 없습니다. (projectId 또는 messageId 없음)");
            return;
        }

        if (isProcessing) return; // 중복 클릭 방지
        setIsProcessing(true);

        try {
            console.log(`Project ID: ${projectId}, Message ID: ${messageId}`);

            // 1. 프로젝트 참여 API 호출
            const payload = { message_id: messageId };
            const acceptRes = await acceptProjectInvite(projectId, payload);
            console.log("'acceptProjectInvite' API successful:", acceptRes);

            // 2. DB 반영을 위한 잠시 대기
            await new Promise((r) => setTimeout(r, 350));

            // 3. GitHub Collaborator 초대 API 호출
            const ghRes = await inviteProjectCollaborator(projectId);
            console.log("[SUCCESS] 'inviteProjectCollaborator' API successful:", ghRes);

            // 4. UI 상태 업데이트
            setAccepted(true);
            setResponded(true);

        } catch (error) {
            console.error("❌ [PROCESS FAILED] An error occurred in handleAcceptInvite:", error);
            if (error.response) {
                console.error("Error Response Data:", error.response.data);
                console.error("Error Response Status:", error.response.status);
            }
            alert("요청 수락 처리 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
        } finally {
            console.log("--- [PROCESS END in ProjectInviteCard] ---");
            setIsProcessing(false);
        }
    };

    const handleDeclineInvite = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            await rejectProjectInvite(projectId);
            setAccepted(false);
            setResponded(true);
        } catch (err) {
            console.error("초대 거절 실패:", err);
            alert("초대 거절에 실패했습니다.");
        } finally {
            setIsProcessing(false);
        }
    };

    // 아래 return 부분은 UI/UX 개선을 위해 조금 수정했어. 그대로 붙여넣으면 돼.
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
                    초대를 수락했습니다.
                    <button
                        onClick={() => navigate(`/team-project/${projectId}`)}
                        className="mt-2 ml-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                    >
                        프로젝트로 이동
                    </button>
                </div>
            ) : inviteStatus === "rejected" || (responded && !accepted) ? (
                 <div className="text-sm text-gray-500">초대를 거절했습니다.</div>
            ) : (
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={handleAcceptInvite}
                        disabled={isProcessing}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isProcessing ? "처리 중..." : "수락"}
                    </button>
                    <button
                        onClick={handleDeclineInvite}
                        disabled={isProcessing}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                        거절
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProjectInviteCard;