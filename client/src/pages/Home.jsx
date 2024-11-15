import { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();
    const [roundTableName, setRoundTableName] = useState(localStorage.getItem('roundtable') || '');
    const [errorMessage, setErrorMessage] = useState('');

    const token = localStorage.getItem('token')
    useEffect(() => {
      if (!token) navigate('/login')
    }, [])
    const handleSubmission = async (e) => {
        e.preventDefault();
        const { roundtable, className } = e.target;
        const newRoundTableName = roundtable.value;
        const class_name = className.value;

        // Store values in localStorage
        localStorage.setItem('roundtable', newRoundTableName);
        localStorage.setItem('className', class_name);

        try {
            const result = await fetch(`https://ilead-app-production.up.railway.app/api/checkRoundTable/${newRoundTableName}/${class_name}`,{
                header: {
                    'token': token
                },
                method:'GET'
            });
            const data = await result.json();
            if (result.ok) {
                localStorage.setItem('roundtable', data.message.name);
                localStorage.setItem('new', 'false');
                setRoundTableName(data.message.name);
                navigate('/attendance');
                navigate('/attendance');
            } else if (result.status == 404) {
                setErrorMessage('RoundTable not found. Please try again.');
            } else {
                localStorage.setItem('new', 'true');
                navigate('/addMembers');
            }
        } catch (error) {
            // Error handling
            setErrorMessage('RoundTable not found. Please try again.');
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                {errorMessage && (
                    <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                        {errorMessage}
                    </div>
                )}
                {roundTableName ? (
                    <>
                        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
                            Welcome to the {roundTableName} RoundTable!
                        </h1>
                        <div className="mt-4 flex justify-between">
                            <button
                                onClick={() => navigate('/attendance')}
                                className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mr-2"
                            >
                                Do Attendance
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
                            Welcome to the Ilead Program
                        </h1>
                        <form onSubmit={handleSubmission} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="roundtable"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Enter RoundTable name
                                </label>
                                <input
                                    type="text"
                                    name="roundtable"
                                    id="roundtable"
                                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="RoundTable Name"
                                    required
                                />
                                <label
                                    htmlFor="className"
                                    className="block text-sm font-medium text-gray-700 mt-4"
                                >
                                    Enter Class Name
                                </label>
                                <input
                                    type="text"
                                    name="className"
                                    id="className"
                                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Class Name"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Submit
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
