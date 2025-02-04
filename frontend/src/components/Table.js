const Table = () => {
    const rows = [
      { id: 75, title: "가나다라마바사아자차카타파하" },
      { id: 74, title: "가나다라마바사아자차카타파하" },
      { id: 73, title: "가나다라마바사아자차카타파하" },
      { id: 72, title: "가나다라마바사아자차카타파하" },
      { id: 71, title: "가나다라마바사아자차카타파하" },
      { id: 70, title: "가나다라마바사아자차카타파하" },
    ];
  
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th className="p-2 text-left">번호</th>
              <th className="p-2 text-left">제목</th>
              <th className="p-2 text-left">파일</th>
              <th className="p-2 text-left">등록일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="p-2">{row.id}</td>
                <td className="p-2">{row.title}</td>
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
  