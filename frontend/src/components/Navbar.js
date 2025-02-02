import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-blue-500 p-4 text-white flex justify-between">
      <h1 className="text-lg font-bold">퀴즈 테스트</h1>
      <div>
        <Link to="/" className="mx-2">홈</Link>
        <Link to="/quiz" className="mx-2">퀴즈</Link>
        <Link to="/profile" className="mx-2">프로필</Link>
      </div>
    </nav>
  );
};

export default Navbar;
