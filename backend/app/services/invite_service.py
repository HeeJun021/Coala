from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from fastapi import HTTPException
from app.models.project_models import Project, ProjectMembers
from app.models.notification import Notification
from app.models.user import User
from app.models.chat import ChatRoom, ChatRoomParticipant, ChatMessage
from sqlalchemy.dialects.postgresql import insert
from app.models.user import UserFollow
from typing import Optional


def accept_project_invite(
    db: Session, user: User, project_id: int, message_id: Optional[int] = None
):
    # 1. 프로젝트 존재 여부 확인
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. 이미 참여 중인지 확인
    existing = (
        db.query(ProjectMembers)
        .filter(
            ProjectMembers.project_id == project_id,
            ProjectMembers.user_id == user.user_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already a project member")

    # ✅ (먼저) 현재 프로젝트 멤버 ID 추출
    members = (
        db.query(ProjectMembers).filter(ProjectMembers.project_id == project_id).all()
    )
    member_ids = [m.user_id for m in members]

    # 3. 멤버 등록
    db.add(
        ProjectMembers(
            project_id=project_id,
            user_id=user.user_id,
            is_leader=False,
            status="accepted",
        )
    )
    db.flush()

    # ✅ 수락 메시지 유형 변경
    if message_id:
        db.query(ChatMessage).filter(ChatMessage.message_id == message_id).update(
            {"message_type": "project_invite_accepted"}
        )
        db.flush()

    # ✅ 팀 프로젝트 멤버들끼리 자동 맞팔 추가
    for other_user_id in member_ids:
        if other_user_id != user.user_id:
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

    # 5. 팀 채팅방이 있는지 확인
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
        # 6. 팀 채팅방 생성
        team_room = ChatRoom(
            room_type="team",
            is_group=True,
            room_name=project.name,
            project_id=project_id,
        )
        db.add(team_room)
        db.flush()

        # 7. 기존 멤버 + 현재 유저 모두 참가자로 등록
        for uid in member_ids + [user.user_id]:
            db.add(ChatRoomParticipant(room_id=team_room.room_id, user_id=uid))

        # 8. 시스템 메시지: "팀 채팅방이 생성되었습니다"
        db.add(
            ChatMessage(
                room_id=team_room.room_id,
                sender_id=user.user_id,
                message="팀 채팅방이 생성되었습니다.",
                message_type="system",
                uploaded_at=func.now(),
            )
        )

    elif team_room:
        # 9. 팀방이 있다면 현재 유저만 추가
        exists = (
            db.query(ChatRoomParticipant)
            .filter_by(room_id=team_room.room_id, user_id=user.user_id)
            .first()
        )
        if not exists:
            db.add(ChatRoomParticipant(room_id=team_room.room_id, user_id=user.user_id))

        # 10. 시스템 메시지: "[닉네임]님이 참여했습니다."
        db.add(
            ChatMessage(
                room_id=team_room.room_id,
                sender_id=user.user_id,
                message=f"{user.nickname}님이 팀 채팅방에 참여했습니다.",
                message_type="system",
                uploaded_at=func.now(),
            )
        )

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

        # 🔁 6. 기존 방이 있는데 soft-deleted 상태라면 복구
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
        message="",  # ✅ 프론트에서 렌더링 처리하므로 message는 빈 문자열
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
