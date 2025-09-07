// frontend/src/pages/codingTest/MyCodingTestSubmissionsPage.jsx
import React, { useEffect, useState } from "react";
import CodingTestSidebar from "../../Layout/CodingTestSidebar";
import SubmissionListTable from "../../components/CodingTest/my_summit/SubmissionListTable";
import { getAllSubmissionsByUser } from "../../api/codingTestApi";
import { useAuth } from "../../context/AuthContext";

const MyCodingTestSubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.user_id) return;
    (async () => {
      try {
        const { submissions: list } = await getAllSubmissionsByUser(user.user_id);
        setSubmissions(list || []);
      } catch (err) {
        console.error("❌ 제출 내역 불러오기 실패:", err);
      }
    })();
  }, [user]);

  return (
    <div className="relative min-h-screen">
      {/* 사이드바 */}
      <CodingTestSidebar />

      {/* 본문 */}
      <div className="ml-[100px] p-6 bg-[#F9FAFB] min-h-screen">
        <SubmissionListTable submissions={submissions} />
      </div>
    </div>
  );
};

export default MyCodingTestSubmissionsPage;
