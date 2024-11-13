import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isFacilitator, setIsFacilitator] = useState(false)
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const loginData = { email, facilitator: isFacilitator ? 'facilitator' : 'user' };
            if (isFacilitator) {
                loginData.password = password;
            }

            const response = await fetch('https://ilead-app-production.up.railway.app/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                if(data.role=="admin")navigate("/SudoSu");
                else navigate('/');
            } else if (response.status === 403) {
                if (data.role === "facilitator") setIsFacilitator(true);
                else setIsFacilitator(false);
                setError(data.message);
            }
            else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('An error occurred during login');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-bold text-center">Login</h2>
                {error && (
                    <div className="p-4 text-red-700 bg-red-100 border border-red-400 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="w-full p-2 border rounded"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {isFacilitator && (
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                className="w-full p-2 border rounded"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isFacilitator"
                            checked={isFacilitator}
                            onChange={(e) => setIsFacilitator(e.target.checked)}
                            className="mr-2"
                        />
                        <label htmlFor="isFacilitator" className="text-sm font-medium text-gray-700">
                            Are you a facilitator ?
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 px-4 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                        Login
                    </button>
                </form>
                <Link
                    to={'/register'}
                    className="link link-hover text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                    Create an account
                    </Link>
            </div>
        </div>
    );
}
