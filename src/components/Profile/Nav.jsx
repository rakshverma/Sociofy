import { FaHome, FaUserCircle, FaBell, FaCog, FaEnvelope, FaSignOutAlt } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";

function Nav() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("email");

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log("Storage cleared!");
    navigate("/", { replace: true });
  };

  return (
    <nav className="bg-white shadow-md py-3 px-6 flex items-center justify-between fixed w-full top-0 z-50">
      {/* Left Icons */}
      <div className="flex items-center gap-4">
        <Link to={userEmail ? `/dashboard/${userEmail}` : "/"}>
          <FaHome className="text-2xl text-gray-700 hover:text-blue-500 transition" />
        </Link>
        <Link to={userEmail ? `/dashboard/profile/${userEmail}` : "/"}>
          <FaUserCircle className="text-2xl text-gray-700 hover:text-blue-500 transition" />
        </Link>
        <Link to="/chatroom">
          <FaEnvelope className="text-2xl text-gray-700 hover:text-blue-500 transition" />
        </Link>
        <FaBell className="text-2xl text-gray-700 hover:text-blue-500 transition cursor-pointer" />
      </div>

      {/* Search Bar */}
      <div className="relative w-1/3">
        <input
          type="text"
          className="w-full py-2 px-4 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Explore Something..."
        />
        <IoSearch className="absolute right-3 top-3 text-gray-500" />
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-4">
        <Link to="/settings">
          <FaCog className="text-2xl text-gray-700 hover:text-blue-500 transition" />
        </Link>
        <FaSignOutAlt
          className="text-2xl text-red-500 hover:text-red-700 cursor-pointer transition"
          onClick={handleLogout}
        />
      </div>
    </nav>
  );
}

export default Nav;