const SearchBar = () => {
    return (
      <div className="flex items-center space-x-4 mb-6">
        <input
          type="text"
          placeholder="검색어를 입력해 주세요"
          className="flex-grow bg-gray-200 p-3 rounded border border-gray-400"
        />
        <button className="bg-green-400 px-6 py-3 rounded text-black font-medium border border-black">
          검색
        </button>
      </div>
    );
  };
  
  export default SearchBar;
  