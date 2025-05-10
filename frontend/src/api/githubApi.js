import apiClient from "./apiClient";

const githubApi = {
  getRepos: () => apiClient.get("/freecode/github/repos", { withCredentials: true }),
  createRepo: (repoData) => apiClient.post("/freecode/github/repos/create", repoData, { withCredentials: true }),
  unlinkGithub: () => apiClient.post("/auth/social/unlink/github", {}, { withCredentials: true }),
  getRepoFiles: (repoName) => apiClient.get(`/freecode/github/repos/files/${encodeURIComponent(repoName)}`, { withCredentials: true }),
  getFileContent: (repoName, filePath) => apiClient.get(`/freecode/github/repos/files/content/${encodeURIComponent(repoName)}/${encodeURIComponent(filePath)}`, { withCredentials: true }),
  uploadToRepo: (uploadData) => apiClient.post("/freecode/github/repos/upload", uploadData, { withCredentials: true }),
  cancelUpload: (repoName, sessionId) => apiClient.post("/freecode/github/repos/cancel-upload", { repo_name: repoName, session_id: sessionId }, { withCredentials: true }),
  createFolder: (repoName, folderPath) => apiClient.post("/freecode/github/repos/folder/create", { repo_name: repoName, folder_path: folderPath }, { withCredentials: true }),
  deleteFile: (repoName, path) => apiClient.post("/freecode/github/repos/file/delete", { repo_name: repoName, path }, { withCredentials: true }),
};

export default githubApi;