import React, { useEffect, useState } from "react";
import SubmissionStatsPanel from "../components/CodingTest/my_summit/SubmissionStatsPanel";
import SubmissionListTable from "../components/CodingTest/my_summit/SubmissionListTable";
import SubmissionStatsChart from "../components/CodingTest/my_summit/SubmissionStatsChart"; // ✅ 추가

const MyCodingTestSubmissionsPage = () => {
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    // 🔧 하드코딩된 통계 데이터
    const sampleStats = {
      totalSubmissions: 42,
      correctSubmissions: 28,
      accuracy: 66.7,
      solvedByDifficulty: {
        easy: 15,
        medium: 10,
        hard: 3,
      },
      weeklySubmissions: [
        { date: "2025-06-07", count: 3 },
        { date: "2025-06-08", count: 5 },
        { date: "2025-06-09", count: 2 },
        { date: "2025-06-10", count: 4 },
        { date: "2025-06-11", count: 6 },
        { date: "2025-06-12", count: 1 },
        { date: "2025-06-13", count: 7 },
      ],
    };

    // 🔧 하드코딩된 제출 데이터
    const sampleSubmissions = [
      {
        submission_id: 1,
        test_id: 101,
        title: "두 수의 합",
        language: "Python",
        is_correct: true,
        passed_test_cases: 10,
        total_test_cases: 10,
        submitted_at: "2025-06-11 15:32",
      },
      {
        submission_id: 2,
        test_id: 102,
        title: "괄호 유효성 검사",
        language: "JavaScript",
        is_correct: false,
        passed_test_cases: 6,
        total_test_cases: 10,
        submitted_at: "2025-06-12 10:15",
      },
      {
        submission_id: 3,
        test_id: 103,
        title: "최대 수 구하기",
        language: "Java",
        is_correct: true,
        passed_test_cases: 10,
        total_test_cases: 10,
        submitted_at: "2025-06-13 09:20",
      },
    ];

    setStats(sampleStats);
    setSubmissions(sampleSubmissions);
  }, []);

  return (
    <div className="p-6 mt-[80px]">
      {stats && (
        <>
          <SubmissionStatsPanel stats={stats} />

          {/* ✅ 그래프: 가로폭 제한 + 중앙정렬 */}
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
