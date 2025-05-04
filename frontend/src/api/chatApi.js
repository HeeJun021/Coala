import apiClient from "./apiClient";

// ✅ 채팅방 목록 조회
export const getChatRooms = async () => {
  const response = await apiClient.get("/api/chat/list");
  return response.data;
};

// ✅ 보관된 채팅방 목록 조회
export const getArchivedChatRooms = async () => {
  const response = await apiClient.get("/api/chat/archived");
  return response.data;
};

// ✅ 채팅방 생성
export const createChatRoom = async (userIds) => {
    const isGroup = userIds.length > 1;
  
    const body = {
      room_type: "general",             // 기본 채팅방 타입
      is_group: isGroup,                // ✅ 1:1이면 false
      participant_ids: userIds,         // ✅ 정확한 필드명
    };
    console.log("🚀 보내는 채팅방 생성 요청:", body); // ← 확인용 로그
    const response = await apiClient.post("/api/chat/create", body);
    return response.data;
  };
  

// ✅ 채팅방 이름 변경
export const renameChatRoom = async (roomId, newName) => {
  const response = await apiClient.patch(`/api/chat/${roomId}/rename`, {
    name: newName,
  });
  return response.data;
};

// ✅ 채팅방 나가기
export const leaveChatRoom = async (roomId) => {
  const response = await apiClient.delete(`/api/chat/${roomId}/leave`);
  return response.data;
};

// ✅ 채팅방 고정/해제
export const togglePinChatRoom = async (roomId) => {
  const response = await apiClient.patch(`/api/chat/${roomId}/pin`);
  return response.data;
};

// ✅ 채팅방 보관 처리
export const archiveChatRoom = async (roomId) => {
  const response = await apiClient.patch(`/api/chat/${roomId}/archive`);
  return response.data;
};

// ✅ 채팅방 참여자 목록 조회
export const getChatParticipants = async (roomId) => {
  const response = await apiClient.get(`/api/chat/${roomId}/participants`);
  return response.data;
};

// ✅ 채팅방에 유저 초대
export const inviteToChatRoom = async (roomId, userIds) => {
  const response = await apiClient.post(`/api/chat/${roomId}/invite`, {
    user_ids: userIds, // 배열
  });
  return response.data;
};

// ✅ 메시지 전송 (텍스트 또는 파일)
export const sendMessage = async (roomId, payload) => {
  const response = await apiClient.post(`/api/chat/${roomId}/send`, payload);
  return response.data;
};

// ✅ 메시지 목록 조회 (페이징)
export const getMessages = async (roomId, limit = 20, offset = 0) => {
  const response = await apiClient.get(`/api/chat/${roomId}/messages`, {
    params: { limit, offset },
  });
  return response.data;
};

// ✅ 메시지 읽음 처리
export const markMessagesAsRead = async (roomId) => {
  const response = await apiClient.patch(`/api/chat/${roomId}/read`);
  return response.data;
};

// ✅ 파일 업로드 (이미지/파일)
export const uploadFile = async (formData) => {
  const response = await apiClient.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
