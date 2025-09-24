// frontend/src/page/mypage/MyPageProject.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getMyProjects } from "../../api/projectApi";

const MyPageProject = () => {
  const navigate = useNavigate();
  const { userData } = useOutletContext();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    if (!userData?.user_id) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        const res = await getMyProjects();
        const list = Array.isArray(res) ? res : (res?.projects ?? []);
        if (!list || list.length === 0) {
          setError("프로젝트 이력이 없습니다.");
          return;
        }
        setProjects(list);
      } catch {
        setError("프로젝트 이력을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [userData]);

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>{error}</p>;

  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const totalPages = Math.max(1, Math.ceil(projects.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = projects.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // 역할 표기: my_role 우선, 없으면 leader_id 비교
  const roleToKorean = (proj) => {
    if (proj?.my_role) return proj.my_role === "leader" ? "팀장" : "팀원";
    if (userData?.user_id && proj?.leader_id != null) {
      return proj.leader_id === userData.user_id ? "팀장" : "팀원";
    }
    const legacy = proj?.role || (proj?.is_leader ? "leader" : "member");
    return legacy === "leader" ? "팀장" : "팀원";
  };

  const goProject = (projectId) => {
  navigate(`/team-project/${projectId}`, {
    state: {
      tab: "overview",   // 🔹 대시보드 대신 개요(디테일) 탭이 기본
      projectId: projectId
    }
  });
};

  return (
    <div className="flex min-h-screen">
      <div className="w-[250px]" />

      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mt-4 flex items-center gap-2">
          프로젝트 참여 이력
        </h2>

        {projects.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2">프로젝트 이력이 없습니다.</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4 mt-4">
            <table className="w-full border-collapse border text-base">
              <thead>
                <tr className="bg-gray-100 text-sm]">
                  <th className="border px-4 py-2 text-center">프로젝트 이름</th>
                  <th className="border px-4 py-2 text-center">프로젝트 주제</th>
                  <th className="border px-4 py-2 text-center">역할</th>
                  <th className="border px-4 py-2 text-center">시작일</th>
                  <th className="border px-4 py-2 text-center">종료일</th>
                  <th className="border px-4 py-2 text-center">이동</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((p) => (
                  <tr
                    key={p.project_id}
                    className="border text-sm hover:bg-gray-50 cursor-pointer"
                    onClick={() => goProject(p.project_id)} // 행 클릭 시 이동
                  >
                    <td className="px-4 py-2 text-center">{p.name}</td>
                    <td className="px-4 py-2 text-center">{p.topic ?? "-"}</td>
                    <td className="px-4 py-2 text-center">{roleToKorean(p)}</td>
                    <td className="px-4 py-2 text-center">{fmtDate(p.start_date)}</td>
                    <td className="px-4 py-2 text-center">{fmtDate(p.end_date)}</td>
                    <td
                      className="px-4 py-2 text-center"
                      onClick={(e) => {
                        e.stopPropagation(); // 버튼 클릭 시 행 클릭과 중복 방지
                        goProject(p.project_id);
                      }}
                    >
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg">
                        이동
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === 1
                      ? "bg-gray-300 text-gray-600"
                      : "bg-accent text-white"
                  }`}
                  disabled={currentPage === 1}
                >
                  ◀
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === i + 1
                        ? "bg-accent text-white"
                        : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === totalPages
                      ? "bg-gray-300 text-gray-600"
                      : "bg-accent text-white"
                  }`}
                  disabled={currentPage === totalPages}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPageProject;
