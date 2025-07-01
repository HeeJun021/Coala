import React from "react"; // React 라이브러리 가져오기

const SearchBar = () => { // SearchBar 컴포넌트 정의
  return (
    <div className="flex items-center space-x-4 mb-6"> 
      {/* 검색바 전체 컨테이너 */}
      {/* flex 사용으로 입력 필드와 버튼을 가로 정렬, `space-x-4`로 간격 추가 */}
      <input
        type="text"
        placeholder="검색어를 입력해 주세요"
        className="flex-grow bg-gray-200 p-3 rounded border border-gray-400"
      />
      {/* 검색 입력 필드 */}
      {/* `flex-grow`로 남은 공간을 모두 차지, `bg-gray-200`으로 배경색 설정 */}
      <button className="bg-green-400 px-6 py-3 rounded text-black font-medium border border-black">
        검색
      </button>
      {/* 검색 버튼 */}
      {/* `bg-green-400`(초록색)으로 설정, `px-6 py-3`로 패딩 적용 */}
    </div>
  );
};

export default SearchBar; // SearchBar 컴포넌트 내보내기
