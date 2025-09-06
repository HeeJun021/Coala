import apiClient from "./apiClient";

/* =========================
 *         Repos
 * ========================= */

/**
 * 새 GitHub 저장소를 생성하고 프로젝트에 연결합니다.
 * POST /project-git/repos
 */
export const createRepo = async (payload) => {
  const res = await apiClient.post("/project-git/repos", payload);
  return res.data;
};

/**
 * 프로젝트의 GitHub 저장소 연결 상태를 확인합니다.
 * GET /project-git/{projectId}/connection-status
 */
export const getRepoConnectionStatus = async (projectId) => {
  const res = await apiClient.get(`/project-git/${projectId}/connection-status`);
  return res.data; // { is_connected, repo_url, owner, repo_name }
};

/**
 * 레포 정보 조회 (default_branch 등 확인)
 * GET /project-git/{projectId}/repo
 */
export const getRepoInfo = async (projectId) => {
  const res = await apiClient.get(`/project-git/${projectId}/repo`);
  return res.data; // RepoInfo
};

/* =========================
 *         Tree / File
 * ========================= */

/**
 * 저장소의 파일/폴더 구조를 가져옵니다.
 * GET /project-git/{projectId}/tree?branch&base_path&recursive
 */
export const getRepoTree = async (
  projectId,
  { branch, basePath = "", recursive = true } = {}
) => {
  const params = { base_path: basePath, recursive };
  if (branch) params.branch = branch;
  const res = await apiClient.get(`/project-git/${projectId}/tree`, { params });
  return res.data; // TreeResponse
};

/**
 * 파일 내용을 가져옵니다. (버퍼 또는 GitHub 원본)
 * GET /project-git/{projectId}/file?path&branch
 */
export const getFile = async (projectId, { path, branch }) => {
  const params = { path };
  if (branch) params.branch = branch;
  const res = await apiClient.get(`/project-git/${projectId}/file`, { params });
  return res.data; // FileData
};

/**
 * 파일을 임시 버퍼에 저장합니다.
 * PUT /project-git/{projectId}/file
 */
export const saveFile = async (projectId, payload) => {
  const res = await apiClient.put(`/project-git/${projectId}/file`, payload);
  return res.data; // FileData
};

/**
 * 새 파일을 임시 버퍼에 생성합니다.
 * POST /project-git/{projectId}/file
 */
export const createFile = async (projectId, payload) => {
  const res = await apiClient.post(`/project-git/${projectId}/file`, payload);
  return res.data; // FileData
};

/**
 * 파일을 삭제 목록에 추가하거나 버퍼에서 제거합니다.
 * DELETE /project-git/{projectId}/file
 */
export const deleteFile = async (projectId, { branch, path }) => {
  const res = await apiClient.delete(`/project-git/${projectId}/file`, {
    data: { branch, path },
  });
  return res.data;
};

/* =========================
 *     Stage / Commit / Status
 * ========================= */

/**
 * 변경된 파일들을 Staging 하거나 Unstaging 합니다.
 * POST /project-git/{projectId}/stage
 */
export const stagePaths = async (projectId, payload) => {
  const res = await apiClient.post(`/project-git/${projectId}/stage`, payload);
  return res.data;
};

/**
 * Staging된 변경사항을 커밋합니다.
 * POST /project-git/{projectId}/commit
 */
export const commitChanges = async (projectId, payload) => {
  const res = await apiClient.post(`/project-git/${projectId}/commit`, payload);
  return res.data;
};

/**
 * Staging/Unstaging 상태를 조회합니다.
 * GET /project-git/{projectId}/status?branch
 */
export const getStatus = async (projectId, { branch } = {}) => {
  const params = {};
  if (branch) params.branch = branch;
  const res = await apiClient.get(`/project-git/${projectId}/status`, { params });
  return res.data;
};

/**
 * 특정 브랜치의 커밋 내역을 가져옵니다.
 * GET /project-git/{projectId}/commits?branch={branchName}
 */
export const getCommitHistory = async (projectId, branch) => {
  const res = await apiClient.get(`/project-git/${projectId}/commits`, {
    params: { branch },
  });
  return res.data;
};


/* =========================
 *         Branches
 * ========================= */

/**
 * 새 브랜치를 생성합니다.
 * POST /project-git/{projectId}/branches
 */
export const createBranch = async (projectId, payload) => {
  const res = await apiClient.post(
    `/project-git/${projectId}/branches`,
    payload
  );
  return res.data;
};

/**
 * 현재 브랜치를 변경합니다.
 * POST /project-git/{projectId}/branches/switch
 */
export const switchBranch = async (projectId, branch) => {
  const res = await apiClient.post(
    `/project-git/${projectId}/branches/switch`,
    { branch }
  );
  return res.data;
};

/**
 * 저장소의 모든 브랜치 목록을 가져옵니다.
 * GET /project-git/{projectId}/branches
 */
export const listBranches = async (projectId) => {
  const res = await apiClient.get(`/project-git/${projectId}/branches`);
  return res.data;
};

/**
 * 브랜치를 병합합니다 (head -> base).
 * POST /project-git/{projectId}/branches/merge
 * @param {object} payload - { base, head, commit_message? }
 * @returns {Promise<object>} Merge result
 */
export const mergeBranch = async (projectId, payload) => {
  const res = await apiClient.post(
    `/project-git/${projectId}/branches/merge`,
    payload
  );
  return res.data;
};