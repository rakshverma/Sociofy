import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function Profile() {
  const { email } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({ name: "", dateOfBirth: "", gender: "" });

  useEffect(() => {
    fetchUserProfile();
  }, [email]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/${email}`);
      setUser(response.data);
      setUpdatedUser({
        name: response.data.name,
        dateOfBirth: response.data.dateOfBirth.split("T")[0], // Format Date
        gender: response.data.gender,
      });
      setLoading(false);
    } catch (error) {
      setError("Failed to load profile");
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/update-profile`, { email, ...updatedUser });
      fetchUserProfile(); // Fetch updated user profile after saving changes
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile", error);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="pt-10 flex flex-col items-center mt-10 p-6 bg-white shadow-lg rounded-lg max-w-lg mx-auto">
      <img
        src={user?.profilePicture ? `data:image/jpeg;base64,${user.profilePicture}` : "https://via.placeholder.com/150"}
        alt="Profile"
        className="w-32 h-32 rounded-full border-4 border-blue-500 mb-4"
      />
      {editMode ? (
        <>
          <input
            type="text"
            value={updatedUser.name}
            onChange={(e) => setUpdatedUser({ ...updatedUser, name: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <input
            type="date"
            value={updatedUser.dateOfBirth}
            onChange={(e) => setUpdatedUser({ ...updatedUser, dateOfBirth: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <select
            value={updatedUser.gender}
            onChange={(e) => setUpdatedUser({ ...updatedUser, gender: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <button
            onClick={handleUpdate}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Save
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold">{user?.name}</h2>
          <p className="text-gray-600">DOB: {new Date(user?.dateOfBirth).toLocaleDateString()}</p>
          <p className="text-gray-600">Gender: {user?.gender}</p>
          <button
            onClick={() => setEditMode(true)}
            className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Edit Profile
          </button>
        </>
      )}
    </div>
  );
}

export default Profile;