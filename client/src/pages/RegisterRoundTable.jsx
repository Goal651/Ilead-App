import { useState } from "react"
import { useNavigate } from "react-router-dom";

export default function RegisterRoundTable() {
    const [formData, setFormData] = useState({});
    const navigate = useNavigate()
    const [error, setError] = useState('');
    const token = localStorage.getItem('token')

    const handleSubmission = async (e) => {
        e.preventDefault();
        try {
            if (!formData.roundtable || !formData.facilitator || !formData.className) return setError('Missing required fields')
            const response = await fetch(`https://ilead-app-production.up.railway.app/api/registerRoundTable/`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    token
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('roundtable', data.roundTableName);
                localStorage.setItem('className', data.className);
                localStorage.setItem('new', 'false');
                navigate('/addMembers');
            } else setError(data.message)
            navigate('/addMembers');
        } catch (error) {
            console.log(error)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value, }));
    }


    return (
        <div className="flex flex-col gap-10 justify-center items-center h-screen">
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
                        onChange={handleChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="RoundTable Name"
                        required
                    />

                    <label
                        htmlFor="facilitator"
                        className="block text-sm font-medium text-gray-700 mt-4"
                    >
                        Enter Full Names (facilitator)
                    </label>
                    <input
                        type="text"
                        name="facilitator"
                        id="facilitator"
                        onChange={handleChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="John Doe"
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
                        onChange={handleChange}
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
            {error && <p className="text-red-500">{error}</p>}
        </div>
    )
}
