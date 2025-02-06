import React from "react";
import { Link } from "react-router-dom";

const Table = ({ rows, type, category }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="p-2 text-left">번호</th>
            <th className="p-2 text-left">제목</th>
            <th className="p-2 text-center">파일</th>
            <th className="p-2 text-center">등록일</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b">
              <td className="p-2">{row.id}</td>
              <td className="p-2">
                <Link
                  to={`/StudyMaterialsPage/${type}/${category}/${row.id}`}
                  className="text-blue-500 hover:underline"
                >
                  {row.title}
                </Link>
              </td>
              <td className="p-2 text-center">-</td>
              <td className="p-2 text-center">-</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-4 text-center">
        <button className="px-4 py-2 mx-1 border rounded">1</button>
        <button className="px-4 py-2 mx-1 border rounded">2</button>
        <button className="px-4 py-2 mx-1 border rounded">3</button>
      </div>
    </div>
  );
};

export default Table;
