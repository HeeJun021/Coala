import React, { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import studymaterialImg from "../assets/studymaterialpage.png";
import quizImg from "../assets/quizpage.png";
import codingTestImg from "../assets/codingtestpage.png";
import AttendancePopup from "../components/AttendancePopup";
import { ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};
const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
};
const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const handleStart = () => {
    if (user) navigate("/StudyMaterialsPage");
    else navigate("/signup");
  };

  const handleScroll = () => {
    if (scrollRef.current)
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const [studyRef, studyInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });
  const [quizRef, quizInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });
  const [codingRef, codingInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <div className="absolute inset-0 min-h-screen overflow-x-hidden bg-white">
      <AttendancePopup tz="Asia/Seoul" userId={user?.user_id} />

      {/* 🌿 Hero Section */}
      <section className="relative flex flex-col justify-center items-center text-center min-h-screen overflow-hidden bg-gradient-to-b from-[#f7fff1] via-green-100 to-yellow-50">
        <motion.div
          className="absolute top-[-10%] left-[10%] w-[35rem] h-[35rem] bg-emerald-200 rounded-full blur-[180px] opacity-40 -z-10"
          animate={{ y: [0, 30, 0], x: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[-5%] right-[15%] w-[40rem] h-[40rem] bg-yellow-100 rounded-full blur-[200px] opacity-50 -z-10"
          animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-6xl font-extrabold mb-8 tracking-tight text-gray-900 drop-shadow-sm"
        >
          웹 개발을 배우는 가장 실용적인 방법
        </motion.h1>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="text-gray-700 mb-12 text-xl"
        >
          퀴즈부터 실습까지, 지금 바로 시작해보세요!
        </motion.p>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="space-x-4"
        >
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            className="bg-green-700 text-white px-10 py-4 rounded-xl shadow-md hover:shadow-xl hover:bg-green-800 transition-all text-lg"
          >
            {user ? "시작하기" : "가입하기"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleScroll}
            className="border border-gray-400 px-10 py-4 rounded-xl hover:bg-gray-100 hover:shadow-sm transition-all text-lg"
          >
            자세히 보기
          </motion.button>
        </motion.div>
      </section>

      <div ref={scrollRef} />

      {/* 🧠 학습자료 섹션 */}
      <section
        ref={studyRef}
        className={`relative py-24 overflow-hidden transition-all duration-700 ease-out ${
          studyInView
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-10 scale-95"
        }`}
      >
        {/* 자연스러운 연결: 노랑+연초록 */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-yellow-50 via-[#f2fcd9] to-[#fafff2]" />
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-12">
          <motion.img
            variants={fadeLeft}
            initial="hidden"
            animate={studyInView ? "visible" : "hidden"}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            src={studymaterialImg}
            alt="학습자료"
            className="rounded-2xl shadow-lg w-full max-w-[600px] transform-gpu"
          />

          <motion.div
            variants={fadeRight}
            initial="hidden"
            animate={studyInView ? "visible" : "hidden"}
            className="w-[45%] bg-[#fffbed] p-10 rounded-lg shadow-sm"
          >
            <h2 className="text-3xl font-bold mb-4 leading-snug">
              단계별 실습으로 HTML부터
              <br />
              Python까지 학습
            </h2>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              커리큘럼 기반 개념 학습과 현업 예제 코드
              <br />
              개념부터 실습까지 자연스럽게 이어지는 학습 경험
            </p>
            <div className="text-right">
              <Link
                to="/StudyMaterialsPage?category=HTML&id=2"
                className="inline-flex items-center justify-center px-5 py-2 text-base font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                학습자료 살펴보기 <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 🧩 퀴즈 섹션 */}
      <section
        ref={quizRef}
        className={`relative py-24 overflow-hidden transition-all duration-700 ease-out delay-150 ${
          quizInView
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-10 scale-95"
        }`}
      >
        {/* 연결: 연초록 → 밝은 라임 */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#fafff2] via-[#e6fadb] to-[#f6fff1]" />
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-12">
          <motion.div
            variants={fadeLeft}
            initial="hidden"
            animate={quizInView ? "visible" : "hidden"}
            className="w-[45%] bg-[#e9f9e1] p-10 rounded-lg shadow-sm"
          >
            <h2 className="text-3xl font-bold mb-4 leading-snug">
              랜덤 퀴즈로 배우는
              <br />
              개발 개념 이해도 점검
            </h2>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              Coala 퀴즈는 연습 퀴즈부터 점수 테스트,
              <br />
              그리고 사용자가 직접 만든 퀴즈까지 다양하게!
            </p>
            <div className="text-left">
              <Link
                to="/quizpage"
                className="inline-flex items-center justify-center px-5 py-2 text-base font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                퀴즈 풀어보기 <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>

          <motion.img
            variants={fadeRight}
            initial="hidden"
            animate={quizInView ? "visible" : "hidden"}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            src={quizImg}
            alt="퀴즈 섹션"
            className="w-3/5 rounded-2xl shadow-lg transform-gpu"
          />
        </div>
      </section>

      {/* 💻 코딩 테스트 섹션 */}
      <section
        ref={codingRef}
        className={`relative py-24 overflow-hidden transition-all duration-700 ease-out delay-300 ${
          codingInView
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-10 scale-95"
        }`}
      >
        {/* 연결: 초록 → 주황톤 부드럽게 */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#f6fff1] via-[#fff6e7] to-[#fff8f3]" />
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.img
            variants={fadeUp}
            initial="hidden"
            animate={codingInView ? "visible" : "hidden"}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            src={codingTestImg}
            alt="코딩 테스트"
            className="w-full max-w-4xl mb-12 rounded-2xl shadow-lg mx-auto transform-gpu"
          />

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={codingInView ? "visible" : "hidden"}
            className="max-w-xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-4 leading-snug">
              다양한 문제를 풀며 쌓아가는
              <br />
              알고리즘 사고력과 문제 해결력
            </h2>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              실전 중심의 문제를 통해 사고력을 훈련하고,
              <br />
              다른 사용자의 풀이로 다각도 학습까지!
            </p>
            <Link
              to="/codingtest"
              className="inline-flex items-center justify-center px-5 py-2 text-base font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              코딩 테스트 풀어보기 <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 🦶 Footer */}
      <footer className="border-t border-gray-300 bg-gray-50 text-center py-10">
        <p className="text-sm text-gray-500 mb-2">
          © 2025 Coala. All rights reserved by{" "}
          <span className="font-semibold text-gray-700">Coala</span>.
        </p>
        <p className="text-sm text-gray-500 mb-2">
          Contact:{" "}
          <a
            href="mailto:coala20020101@gmail.com"
            className="text-green-600 hover:underline"
          >
            coala20020101@gmail.com
          </a>
        </p>
        <p className="text-sm text-gray-500">
          <Link to="/privacy" className="hover:underline">
            Privacy Policy
          </Link>{" "}
          ·{" "}
          <Link to="/terms" className="hover:underline">
            Terms of Use
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default Home;
