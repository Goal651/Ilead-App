import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function HomePage() {
    const navigate = useNavigate();
    const roundTableName = localStorage.getItem('roundtable');

    const token = localStorage.getItem('token')
    useEffect(() => {
        if (!token) navigate('/login')
    }, [])

    // Handlers for navigation
    const handleRegister = () => {
        navigate('/register-roundtable');
        localStorage.removeItem('roundtable');
        localStorage.setItem('new', true);
    };

    const handleEnterRoundtable = () => {
        localStorage.setItem('new', false);
        if (roundTableName) navigate('/attendance');
        else navigate('/enter-roundtable')

    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded shadow-md max-w-lg w-full">
                <h1 className="text-4xl font-bold text-gray-800 mb-6">Welcome to Roundtable Manager</h1>
                <p className="text-lg text-gray-600 mb-10">
                    Manage and attend your roundtables with ease.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleRegister}
                        className="w-full py-3 px-6 bg-blue-600 text-white text-lg font-semibold rounded hover:bg-blue-700 focus:outline-none transition duration-300 ease-in-out"
                    >
                        Register New Roundtable
                    </button>
                    <button
                        onClick={handleEnterRoundtable}
                        className="w-full py-3 px-6 bg-green-600 text-white text-lg font-semibold rounded hover:bg-green-700 focus:outline-none transition duration-300 ease-in-out"
                    >
                        Do Attendance
                    </button>
                </div>
            </div>
        </div>
    );
}
