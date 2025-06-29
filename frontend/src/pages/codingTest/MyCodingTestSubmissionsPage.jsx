import React, { useEffect, useState } from "react";
import SubmissionStatsPanel from "../../components/CodingTest/my_summit/SubmissionStatsPanel";
import SubmissionListTable from "../../components/CodingTest/my_summit/SubmissionListTable";
import SubmissionStatsChart from "../../components/CodingTest/my_summit/SubmissionStatsChart";
import { getSubmissionStats, getAllSubmissionsByUser } from "../../api/codingTestApi";
import { useAuth } from "../../context/AuthContext";

const MyCodingTestSubmissionsPage = () => {
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.user_id) return;

    const fetchData = async () => {
      try {
        const statsData = await getSubmissionStats();
        const { submissions: submissionList } = await getAllSubmissionsByUser(user.user_id);
        setStats(statsData);
        setSubmissions(submissionList || []);
      } catch (err) {
        console.error("❌ 데이터 불러오기 실패:", err);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="p-6 mt-3">
      {stats && (
        <>
          <SubmissionStatsPanel stats={stats} />
          <div className="max-w-5xl mx-auto">
            <SubmissionStatsChart
              weeklyData={stats.weeklySubmissions}
              difficultyData={stats.solvedByDifficulty}
            />
          </div>
        </>
      )}

      <div className="mt-10">
        <SubmissionListTable submissions={submissions} />
      </div>
    </div>
  );
};

export default MyCodingTestSubmissionsPage;
