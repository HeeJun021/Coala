from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from fastapi import HTTPException
from app.models.project_models import Project, ProjectMembers
from app.models.notification_models import Notification
from app.models.user import User
from app.models.chat_models import ChatRoom, ChatRoomParticipant, ChatMessage
from sqlalchemy.dialects.postgresql import insert
from app.models.user import UserFollow
from typing import Optional


# app/services/invite_service.py

def accept_project_invite(
    db: Session, user: User, project_id: int, message_id: Optional[int] = None
):
    # 1. 프로젝트가 있는지 확인
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. 'pending' 상태의 초대 기록을 찾기
    invitation = (
        db.query(ProjectMembers)
        .filter(
            ProjectMembers.project_id == project_id,
            ProjectMembers.user_id == user.user_id,
            # ProjectMembers.status == "pending" # 이 조건을 빼서 이미 수락한 경우도 고려
        )
        .first()
    )

    # 3. 초대 기록이 없으면 에러
    if not invitation:
        raise HTTPException(status_code=404, detail="초대 정보를 찾을 수 없습니다.")
    
    # 이미 수락한 경우라면 400 에러
    if invitation.status == "accepted":
        raise HTTPException(status_code=400, detail="이미 프로젝트 멤버입니다.")

    # ✅ 핵심: 기존 초대 기록의 상태를 'accepted'로 변경
    invitation.status = "accepted"
    
    # 4. (자신을 제외한) 기존 멤버들의 ID를 추출 (맞팔 및 채팅방 참여용)
    members = (
        db.query(ProjectMembers)
        .filter(
            ProjectMembers.project_id == project_id,
            ProjectMembers.user_id != user.user_id, # 자기 자신은 제외
            ProjectMembers.status == "accepted"
           )
        .all()
    )
    member_ids = [m.user_id for m in members]
    
    # --- 이하 맞팔, 채팅방 로직은 기존과 거의 동일 ---
    
    # 5. 수락 메시지 유형 변경
    if message_id:
        db.query(ChatMessage).filter(ChatMessage.message_id == message_id).update(
            {"message_type": "project_invite_accepted"}
        )
        db.flush()

    # 6. 자동 맞팔 추가
    for other_user_id in member_ids:
        # 내가 상대를 팔로우
        db.execute(
            insert(UserFollow)
            .values(follower_id=user.user_id, following_id=other_user_id)
            .on_conflict_do_nothing()
        )
        # 상대가 나를 팔로우
        db.execute(
            insert(UserFollow)
            .values(follower_id=other_user_id, following_id=user.user_id)
            .on_conflict_do_nothing()
        )

    # 7. 팀 채팅방 확인 및 참여
    team_room = (
        db.query(ChatRoom)
        .filter(
            ChatRoom.project_id == project_id,
            ChatRoom.room_type == "team",
            ChatRoom.is_group == True,
        )
        .first()
    )

    if not team_room and len(member_ids) + 1 >= 2:
        # 팀 채팅방 생성
        team_room = ChatRoom(room_type="team", is_group=True, room_name=project.name, project_id=project_id)
        db.add(team_room)
        db.flush()
        # 모든 멤버(나 포함) 참가자로 등록
        for uid in member_ids + [user.user_id]:
            db.add(ChatRoomParticipant(room_id=team_room.room_id, user_id=uid))
        db.add(ChatMessage(room_id=team_room.room_id, sender_id=user.user_id, message="팀 채팅방이 생성되었습니다.", message_type="system", uploaded_at=func.now()))

    elif team_room:
        # 기존 팀 채팅방에 참여
        exists = db.query(ChatRoomParticipant).filter_by(room_id=team_room.room_id, user_id=user.user_id).first()
        if not exists:
            db.add(ChatRoomParticipant(room_id=team_room.room_id, user_id=user.user_id))
        db.add(ChatMessage(room_id=team_room.room_id, sender_id=user.user_id, message=f"{user.nickname}님이 팀 채팅방에 참여했습니다.", message_type="system", uploaded_at=func.now()))

    db.commit()

    return {"message": "프로젝트에 참여하고 팀 채팅방에 연결되었습니다."}




# 프로젝트 초대
def send_project_invite(db: Session, sender: User, receiver_id: int, project_id: int):
    # 1. 프로젝트 유효성 확인
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. 이미 팀 멤버인지 확인
    existing_member = (
        db.query(ProjectMembers)
        .filter_by(project_id=project_id, user_id=receiver_id)
        .first()
    )
    if existing_member:
        raise HTTPException(status_code=400, detail="이미 해당 프로젝트의 팀원입니다.")

    db.add(
        ProjectMembers(
            project_id=project_id, 
            user_id=receiver_id, 
            status="pending"
        )
    )

    # 3. 요청방 존재 확인 (1:1 invite room)
    existing_room = (
        db.query(ChatRoom)
        .join(ChatRoomParticipant, ChatRoom.room_id == ChatRoomParticipant.room_id)
        .filter(
            ChatRoom.room_type == "invite",
            ChatRoom.is_group == False,
            ChatRoomParticipant.user_id.in_([sender.user_id, receiver_id]),
        )
        .group_by(ChatRoom.room_id)
        .having(func.count(ChatRoomParticipant.user_id) == 2)
        .first()
    )

    if not existing_room:
        # 4. 요청방 새로 생성
        new_room = ChatRoom(room_type="invite", is_group=False)
        db.add(new_room)
        db.flush()

        # 5. 참가자 등록
        for uid in [sender.user_id, receiver_id]:
            db.add(
                ChatRoomParticipant(
                    room_id=new_room.room_id,
                    user_id=uid,
                    is_deleted=False,  # 수락/거절 기록 복구 대비
                )
            )
        room_id = new_room.room_id

    else:
        room_id = existing_room.room_id

        # 6. 기존 방이 있는데 soft-deleted 상태라면 복구
        participants = (
            db.query(ChatRoomParticipant)
            .filter(
                ChatRoomParticipant.room_id == room_id,
                ChatRoomParticipant.user_id == receiver_id,
            )
            .first()
        )
        if participants and participants.is_deleted:
            participants.is_deleted = False  # 다시 보이도록 복구

    # 7. 초대 메시지 전송
    invite_message = ChatMessage(
        room_id=room_id,
        sender_id=sender.user_id,
        message=f"{sender.nickname}님이 '{project.name}' 프로젝트에 초대했습니다. 수락/거절을 선택해주세요.",
        message_type="project_invite",
        uploaded_at=func.now(),
        message_metadata={
            "project_id": project.project_id,
            "project_name": project.name,
        },
    )

    db.add(invite_message)

    # 8. 알림 전송
    db.add(
        Notification(
            sender_id=sender.user_id,
            receiver_id=receiver_id,
            type="project_invite",
            content=f"{sender.nickname}님이 프로젝트 '{project.name}'에 초대했습니다.",
            link_url=f"/team-project/{project.project_id}",
        )
    )

    db.commit()

    return {"message": "초대 메시지 및 알림 전송 완료", "room_id": room_id}
