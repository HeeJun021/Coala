import React, { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";   
import studymaterialImg from "../assets/studymaterialpage.png";
import quizImg from "../assets/quizpage.png";
import codingTestImg from "../assets/codingtestpage.png";
import AttendancePopup from "../components/AttendancePopup";

const Home = () => {
  const { user } = useAuth(); 
  const navigate = useNavigate();
  const scrollRef = useRef(null); 

  const handleStart = () => {
    if (user) {
      navigate("/StudyMaterialsPage");
    } else {
      navigate("/signup");
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full">
      <AttendancePopup tz="Asia/Seoul" userId={user?.user_id} />
      {/* 히어로 영역 */}
      <section className="text-center py-24">
        <h1 className="text-4xl font-bold mb-4">웹 개발을 배우는 가장 실용적인 방법</h1>
        <p className="text-gray-600 mb-6">퀴즈부터 실습까지, 지금 바로 시작해보세요!</p>
        <div className="space-x-4">
          <button
            onClick={handleStart}
            className="bg-green-700 text-white px-6 py-2 rounded hover:bg-navbar transition inline-block"
          >
            {user ? "시작하기" : "가입하기"}
          </button>
          <button
            onClick={handleScroll}
            className="border border-gray-400 px-6 py-2 rounded hover:bg-gray-100 transition"
          >
            자세히 보기
          </button>
        </div>
      </section>

      {/* 스크롤 도착 지점 */}
      <div ref={scrollRef} />

      {/* 학습자료 섹션 */}
      <section className="flex w-full h-auto mb-10">
        <div className="w-[60%] bg-[#fff7d6] px-10 py-20 flex justify-center items-center">
          <img
            src={studymaterialImg}
            alt="학습자료"
            className="rounded shadow-lg w-full max-w-[600px]"
          />
        </div>
        <div className="w-[40%] bg-[#fffbed] px-10 py-20 flex flex-col justify-center">
          <div className="text-left max-w-md ml-auto">
            <h2 className="text-2xl font-bold mb-4 leading-snug">
              HTML부터 <span className="font-black">Python</span>까지,<br />
              단계별로 실습하며 배우는 개발 기초
            </h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              커리큘럼 기반 개념 학습과 현업에서 자주 쓰이는 예제 코드 <br />
              개념부터 실습까지 한 페이지 안에서 자연스러운 학습
            </p>
            <div className="text-right">
              <Link to="/StudyMaterialsPage?category=HTML&id=2" className="text-blue-600 font-semibold hover:underline">
                학습자료 살펴보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 퀴즈 섹션 */}
      <section className="flex w-full h-auto mb-10">
        <div className="w-[70%] bg-[#ddf4d7] px-10 py-20 flex flex-col justify-center">
          <div className="text-left max-w-md">
            <h2 className="text-2xl font-bold mb-4 leading-snug">
              랜덤 퀴즈부터 점수 테스트까지,<br />
              직접 풀며 확인하는 개발 개념 이해도
            </h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Coala 퀴즈는 직접 선택해 푸는 연습 퀴즈 <br />
              점수에 반영이 되는 퀴즈 테스트 <br />
              내가 직접 만들고 남이 만든 걸 풀 수 있는 사용자 퀴즈
            </p>
            <Link to="/quizpage" className="text-blue-600 font-semibold hover:underline">
              퀴즈 풀어보기 →
            </Link>
          </div>
        </div>
        <div className="w-[30%] bg-[#e9f9e1] px-10 py-20 flex justify-center items-center">
          <img
            src={quizImg}
            alt="퀴즈 섹션"
            className="rounded shadow-lg w-full max-w-[400px]"
          />
        </div>
      </section>

      {/* 코딩 테스트 섹션 */}
      <section className="w-full bg-[#fde7d8] py-20 px-6 flex flex-col items-center text-center mb-10">
        <img
          src={codingTestImg}
          alt="코딩 테스트"
          className="w-full max-w-4xl mb-12 rounded shadow-md"
        />
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold mb-4 leading-snug">
            다양한 문제를 풀며 쌓아가는<br />
            알고리즘 사고력과 문제 해결력
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            자료구조, 구현, 탐색, 정렬 등 다양한 유형의 문제<br />
            난이도별로 구성된 체계적인 실전 언어 학습<br />
            다른 사용자의 풀이 조회를 통한 다각도의 학습
          </p>
          <Link to="/codingtest" className="text-blue-600 font-semibold hover:underline">
            코딩 테스트 풀어보기 →
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
