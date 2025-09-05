// frontend/src/api/project_gitApi.js
import apiClient from "./apiClient";

/* =========================
 *         Repos
 * ========================= */

/**
 * 레포 생성
 * POST /project-git/repos
 * body: RepoCreateRequest
 * ex) { owner, repo_name, is_private, description, ... }
 */
export const createRepo = async (payload) => {
  const res = await apiClient.post("/project-git/repos", payload);
  return res.data; // RepoInfo
};

/* =========================
 *         Tree / File
 * ========================= */

/**
 * 트리 조회
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
 * 파일 읽기 (버퍼/깃허브 통합)
 * GET /project-git/{projectId}/file?path&branch
 */
export const getFile = async (projectId, { path, branch }) => {
  const params = { path };
  if (branch) params.branch = branch;
  const res = await apiClient.get(`/project-git/${projectId}/file`, { params });
  return res.data; // FileData { content, base_sha, encoding, ... }
};

/**
 * 파일 버퍼 저장(생성/수정/삭제 의도 포함)
 * PUT /project-git/{projectId}/file
 * body: {
 *   branch?, path, content, change_type?, encoding?("utf-8"|"base64"),
 *   expected_base_sha?
 * }
 */
export const saveFile = async (projectId, payload) => {
  const res = await apiClient.put(`/project-git/${projectId}/file`, payload);
  return res.data; // FileData
};

/**
 * 새 파일 버퍼 생성('A')
 * POST /project-git/{projectId}/file
 * body: { branch?, path, content }
 */
export const createFile = async (projectId, payload) => {
  const res = await apiClient.post(`/project-git/${projectId}/file`, payload);
  return res.data; // FileData
};

/**
 * 파일 삭제(버퍼 삭제 표시 또는 신규추가 취소)
 * 현재 라우터는 DELETE body 사용: FileDeleteRequest { branch?, path }
 * DELETE /project-git/{projectId}/file
 *
 * 만약 서버를 쿼리 방식으로 바꾸면:
 *   await apiClient.delete(`/project-git/${projectId}/file`, { params: { branch, path } })
 */
export const deleteFile = async (projectId, { branch, path }) => {
  const res = await apiClient.delete(`/project-git/${projectId}/file`, {
    data: { branch, path }, // axios는 DELETE body 전송 시 data 키 사용
  });
  return res.data; // { message, path, branch } 또는 204
};

/* =========================
 *     Stage / Commit / Status
 * ========================= */

/**
 * 스테이징/언스테이징
 * POST /project-git/{projectId}/stage
 * body: { branch?, paths: string[], staged: boolean }
 */
export const stagePaths = async (projectId, payload) => {
  const res = await apiClient.post(`/project-git/${projectId}/stage`, payload);
  return res.data; // { branch, staged:[], unstaged:[] }
};

/**
 * 커밋(=푸시)
 * POST /project-git/{projectId}/commit
 * body: {
 *   branch?, message, useStagedOnly?, paths?,
 *   expected_head_sha?   // 낙관적 잠금
 * }
 */
export const commitChanges = async (projectId, payload) => {
  const res = await apiClient.post(`/project-git/${projectId}/commit`, payload);
  return res.data; // { branch, commit_sha }
};

/**
 * 상태 조회(버퍼)
 * GET /project-git/{projectId}/status?branch
 */
export const getStatus = async (projectId, { branch } = {}) => {
  const params = {};
  if (branch) params.branch = branch;
  const res = await apiClient.get(`/project-git/${projectId}/status`, { params });
  return res.data; // StatusResponse { staged[], unstaged[], has_uncommitted }
};

/* =========================
 *         Branches
 * ========================= */

/**
 * 브랜치 생성 (생성 후 자동 스위치)
 * POST /project-git/{projectId}/branches
 * body: { from_branch?: string|null, new_branch: string }
 */
export const createBranch = async (projectId, payload) => {
  const res = await apiClient.post(
    `/project-git/${projectId}/branches`,
    payload
  );
  return res.data; // BranchInfo { branch_name, head_sha, is_protected }
};

/**
 * 브랜치 스위치
 * POST /project-git/{projectId}/branches/switch
 * body: { branch: string }
 */
export const switchBranch = async (projectId, branch) => {
  const res = await apiClient.post(
    `/project-git/${projectId}/branches/switch`,
    { branch }
  );
  return res.data; // BranchInfo
};

/**
 * 브랜치 목록
 * GET /project-git/{projectId}/branches
 */
export const listBranches = async (projectId) => {
  const res = await apiClient.get(`/project-git/${projectId}/branches`);
  return res.data; // BranchInfo[]
};

/* =========================
 *       Repo Info
 * ========================= */

/**
 * 레포 정보 조회 (default_branch 등 확인)
 * GET /project-git/{projectId}/repo
 */
export const getRepoInfo = async (projectId) => {
  const res = await apiClient.get(`/project-git/${projectId}/repo`);
  return res.data; // RepoInfo
};
