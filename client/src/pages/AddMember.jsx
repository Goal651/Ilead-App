import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddMember() {
    const navigate = useNavigate();
    const [members, setMembers] = useState([{ name: '' }]); // State to track members
    const [formSubmitted, setFormSubmitted] = useState(false); // State for success message
    const [error, setError] = useState('');
    const roundTableName = localStorage.getItem('roundtable');
    const facilitator = localStorage.getItem('facilitator');
    const newTable = localStorage.getItem('new');

    // Fetch existing members when the component mounts
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await fetch(`https://ilead-app-production.up.railway.app/api/members/${roundTableName}`, {
                    headers: { token: localStorage.getItem('token') },
                    method: 'GET'
                });
                if (response.ok) {
                    const existingMembers = await response.json();
                    setMembers(existingMembers.members);
                    localStorage.setItem('new', 'false');
                } else {
                    if (newTable === 'false') {
                        const errorMsg = await response.json();
                        setError(errorMsg.message || 'Failed to fetch members');
                    }
                }
            } catch (error) {
                console.error('Error fetching members:', error);
                setError('An error occurred while fetching members.');
            }
        };

        fetchMembers();
    }, [roundTableName, newTable]);

    const addNewRow = () => {
        setMembers([...members, { name: '', class: '' }]); // Add a new empty member object
    };

    const handleInputChange = (e, index) => {
        const { name, value } = e.target;
        const updatedMembers = members.map((member, i) =>
            i === index ? { ...member, [name]: value } : member
        );
        setMembers(updatedMembers);
    };

    // Submit form to the backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        const validMembers = members.filter(member => member.name);
        if (validMembers.length === 0) {
            setError('Please select at least one member with a name.');
            return;
        }

        try {
            const response = await fetch('https://ilead-app-production.up.railway.app/api/addMembers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    token: localStorage.getItem('token')
                },
                body: JSON.stringify({ members: validMembers, roundTableName, facilitator })
            });

            if (response.ok) {
                localStorage.setItem('new', 'false');
                setFormSubmitted(true);
                setError(''); // Clear error message
                navigate('/');
            } else {
                const errorMsg = await response.json();
                setError(errorMsg.message || 'Failed to add members');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 bg-gray-100 rounded shadow-md">
            <h1 className="text-lg font-bold mb-4">Add New Members</h1>
            <div className="flex justify-between mb-4">
                <button
                    onClick={() => navigate('/')}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    Back to home
                </button>
                <button
                    onClick={() => navigate('/attendance')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Do attendance
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <table className="w-full border-collapse mb-4">
                    <thead>
                        <tr>
                            <th className="border p-2" colSpan={2}>Full Names</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members && members.map((member, index) => (
                            <tr key={index}>
                                <td className="border p-2" colSpan={2}>
                                    <input
                                        type="text"
                                        name="name"
                                        value={member.name}
                                        onChange={(e) => handleInputChange(e, index)}
                                        className="w-full"
                                        placeholder="Full Name"
                                    />
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
                <button
                    type="button"
                    onClick={addNewRow}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
                >
                    Add Row
                </button>
                <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                    Add Members
                </button>
            </form>

            {/* Success message */}
            {formSubmitted && (
                <div className="mt-4 p-2 text-green-700 bg-green-100 border border-green-400 rounded">
                    Members added successfully!
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="mt-4 p-2 text-red-700 bg-red-100 border border-red-400 rounded">
                    {error}
                </div>
            )}
        </div>
    );
}
