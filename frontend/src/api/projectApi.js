import apiClient from "./apiClient";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 로그인된 사용자의 프로젝트 목록 가져오기
export const getMyProjects = async () => {
  const response = await apiClient.get("/projects/my");
  return response.data;
};

// 특정 프로젝트의 팀원 목록 불러오기
export const getProjectMembers = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}/members`);
  return response.data;
};

// 프로젝트 생성
export const createProject = async (projectData) => {
  const response = await apiClient.post("/projects", projectData);
  return response.data;
};

// 프로젝트 수정 (설명, 위젯 등)
export const updateProject = async (projectId, projectData) => {
  const response = await apiClient.patch(`/projects/${projectId}`, projectData);
  return response.data;
};

// 팀장 권한 이전
export const transferLeader = async (projectId, newLeaderId) => {
  const response = await apiClient.post(`/projects/${projectId}/transfer-leader`, { new_leader_id: newLeaderId });
  return response.data;
};

// 멤버 추가
export const addMember = async (projectId, userId) => {
  const response = await apiClient.post(`/projects/${projectId}/members`, { user_id: userId });
  return response.data;
};

// 멤버 방출
export const removeMember = async (projectId, userId) => {
  const response = await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
};

// 활동 기록 조회
export const getProjectActivity = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}/activity`);
  return response.data;
};

// 활동 기록 추가
export const addProjectActivity = async (projectId, action) => {
  const response = await apiClient.post(`/projects/${projectId}/activity`, { action });
  return response.data;
};

// 프로젝트 이름 get
export const fetchProjectNameByErd = async (erdId) => {
  const response = await apiClient.get(`/erds/${erdId}/project-name`);
  return response.data;
};


// 1. 프로젝트 초대 전송
export const sendProjectInvite = (projectId, receiverId) =>
  apiClient.post(`/projects/${projectId}/invite`, {
    receiver_id: receiverId,
  });

export const acceptProjectInvite = async (projectId, body = {}) => {
  const url = `/projects/${projectId}/accept`;

  let lastErr = null;
  for (let i = 0; i < 3; i++) {
    try {
      const { data } = await apiClient.post(url, body);
      return data;
    } catch (e) {
      lastErr = e;
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail;

      // FastAPI 기본 404 ("Not Found")일 때만 짧게 재시도
      if (status === 404 && (detail === "Not Found" || detail == null)) {
        await sleep(220);
        continue;
      }
      throw e; // 다른 에러는 즉시 중단
    }
  }
  throw lastErr;
};

export const inviteProjectCollaborator = async (projectId) => {
  const url = `/projects/${projectId}/invite-collaborator`;
  let lastErr = null;
  for (let i = 0; i < 3; i++) {
    try {
      const { data } = await apiClient.post(url);
      return data;
    } catch (e) {
      lastErr = e;
      const st = e?.response?.status;
      const detail = e?.response?.data?.detail;
      if (st === 404 && (detail === "Not Found" || detail == null)) {
        await new Promise(r => setTimeout(r, 220));
        continue;
      }
      if (st === 409) {
        // 이미 초대/이미 콜라보 → 성공 간주
        return { ok: true, alreadyDone: true, detail: e?.response?.data };
      }
      throw e;
    }
  }
  throw lastErr;
};

// 3. 프로젝트 초대 거절
export const rejectProjectInvite = (projectId) =>
  apiClient.post(`/projects/${projectId}/reject`);

// 멤버 역할 업데이트
export const updateMemberRoles = async (projectId, userId, roles) => {
  const response = await apiClient.patch(`/projects/${projectId}/members/${userId}/roles`, roles);
  return response.data;
};

export const leaveProject = async (projectId) => {
  const res = await apiClient.post(`/projects/${projectId}/leave`);
  return res.data;
};

export const closeProject = async (projectId) => {
  const res = await apiClient.post(`/projects/${projectId}/close`);
  return res.data;
};