import React, { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

const SelfCodingGitPanel = ({ isGithubConnected }) => {
  const GithubConnectGuide = () => (
    <div>
      <h2 className="text-lg font-semibold mb-2">🔗 GitHub 연동 안내</h2>
      <p className="text-sm text-gray-700 mb-4">
        자율 코딩 프로젝트를 GitHub 원격 저장소에 연동하여 공유하거나 업로드할 수 있습니다.<br />
        아직 GitHub 계정과 연동되어 있지 않습니다. 아래 버튼을 눌러 연동을 진행해 주세요.
      </p>
      <button
        onClick={() => window.location.href = "http://localhost:8000/auth/social/github/login"}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
      >
        GitHub 계정 연동하기
      </button>
    </div>
  );

  const GithubRepoList = () => {
    const [repos, setRepos] = useState([]);
  
    useEffect(() => {
      const fetchRepos = async () => {
        const res = await apiClient.get("/freecode/github/repos");
        setRepos(res.data);
      };
      fetchRepos();
    }, []);
  
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">📂 내 GitHub 저장소</h2>
        {repos.length === 0 ? (
          <p className="text-sm text-gray-500">저장소가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {repos.map((repo) => (
              <li key={repo.id} className="p-3 bg-gray-100 rounded hover:bg-gray-200 transition">
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600">
                  {repo.full_name}
                </a>
                <p className="text-sm text-gray-600">{repo.description || "설명 없음"}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <>
      {isGithubConnected ? <GithubRepoList /> : <GithubConnectGuide />}
    </>
  );
};

export default SelfCodingGitPanel;