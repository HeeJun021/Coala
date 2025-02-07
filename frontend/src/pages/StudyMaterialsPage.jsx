import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Table from "../components/Table";

const StudyMaterialsPage = () => {
  const [category, setCategory] = useState("HTML");

  // 학습자료인지 예제인지 구분
  const isExample = category.startsWith("예제-");
  const type = isExample ? "examples" : "materials";
  const displayCategory = isExample ? category.replace("예제-", "") : category;

  // 더미 데이터 (나중에 DB에서 불러올 예정)
  const rows = [
    { id: 1, title: `${displayCategory} 자료 1` },
    { id: 2, title: `${displayCategory} 자료 2` },
    { id: 3, title: `${displayCategory} 자료 3` },
    { id: 4, title: `${displayCategory} 자료 4` },
    { id: 5, title: `${displayCategory} 자료 5` },
  ];

  return (
    <div className="flex mt-36">
      <Sidebar setCategory={setCategory} />

      {/* 메인 컨텐츠 */}
      <div className="ml- flex-1 bg-white rounded-lg shadow-lg">
  <h2 className="text-3xl font-bold mb-4 mt-4 ml-4">
    {isExample ? "예제" : "학습자료"} - {displayCategory}
  </h2>

  {/* Table 컴포넌트 사용 */}
  <Table rows={rows} type={type} category={displayCategory} />
</div>
    </div>
  );
};

export default StudyMaterialsPage;
