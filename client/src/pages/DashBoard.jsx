import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function HomePage() {
    const navigate = useNavigate();
    const roundTableName = localStorage.getItem('roundtable');
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    useEffect(() => {
        if (!token) navigate('/login');
    }, [token, navigate]);

    // Handlers for navigation
    const handleRegister = () => {
        navigate('/register-roundtable');
        localStorage.removeItem('roundtable');
        localStorage.setItem('new', true);
    };

    const handleEnterRoundtable = () => {
        localStorage.setItem('new', false);
        if (roundTableName) navigate('/attendance');
        else navigate('/enter-roundtable');
    };

    const handleAddMember = () => {
        navigate('/add-members');
    };

    const handleAdminPanel = () => {
        navigate('/admin-panel');
    };

    // Logout handler
    const handleLogout = () => {
        localStorage.clear(); // Clears all data in localStorage
        navigate('/login');   // Navigate to the login page
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded shadow-md max-w-lg w-full">
                <h1 className="text-4xl font-bold text-gray-800 mb-6">Welcome to Roundtable Manager</h1>
                <p className="text-lg text-gray-600 mb-10">
                    Manage and attend your roundtables with ease.
                </p>

                <div className="space-y-4">
                    {/* Show Register New Roundtable button */}
                    {userRole === 'admin' && (
                        <button
                        onClick={handleRegister}
                        className="w-full py-3 px-6 bg-blue-600 text-white text-lg font-semibold rounded hover:bg-blue-700 focus:outline-none transition duration-300 ease-in-out"
                    >
                        Register New Roundtable
                    </button>
                    )}
                    
                    {/* Show Do Attendance button */}
                    <button
                        onClick={handleEnterRoundtable}
                        className="w-full py-3 px-6 bg-green-600 text-white text-lg font-semibold rounded hover:bg-green-700 focus:outline-none transition duration-300 ease-in-out"
                    >
                        Do Attendance
                    </button>

                    {/* Show role-specific buttons */}
                    {userRole === 'facilitator'|| userRole === 'admin' && (
                        <>
                            <button
                                onClick={handleAddMember}
                                className="w-full py-3 px-6 bg-yellow-500 text-white text-lg font-semibold rounded hover:bg-yellow-600 focus:outline-none transition duration-300 ease-in-out"
                            >
                                Add Member
                            </button>
                        </>
                    )}

                    {userRole === 'admin' && (
                        <button
                            onClick={handleAdminPanel}
                            className="w-full py-3 px-6 bg-red-600 text-white text-lg font-semibold rounded hover:bg-red-700 focus:outline-none transition duration-300 ease-in-out"
                        >
                            Admin Panel
                        </button>
                    )}

                    {/* Logout button */}
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 px-6 bg-gray-600 text-white text-lg font-semibold rounded hover:bg-gray-700 focus:outline-none transition duration-300 ease-in-out"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
