import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        
        if (email === "admin@example.com" && password === "password") {
            navigate("/dashboard");
        } else {
            setError("Invalid email or password");
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-80">
                <h2 className="text-xl font-semibold mb-4 text-center">Login</h2>
                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full px-3 py-2 border rounded-md" 
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full px-3 py-2 border rounded-md" 
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;

