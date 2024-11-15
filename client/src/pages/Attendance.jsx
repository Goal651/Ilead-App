import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Attendance() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [reason, setReason] = useState({});
    const [loading, setLoading] = useState(true);
    const [allowedToEdit, setAllowedToEdit] = useState(false);
    const [attended, setAttended] = useState(false);

    const token = localStorage.getItem('token')
    useEffect(() => {
        if (!token) navigate('/login')
    }, [])

    // Retrieve data from localStorage with fallback
    const roundTableName = localStorage.getItem('roundtable') || '';
    const className = localStorage.getItem('className') || '';

    // Redirect if no round table name exists
    useEffect(() => {
        if (!roundTableName) navigate('/');
    }, [roundTableName, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`https://ilead-app-production.up.railway.app/api/membersAndAttendance/${roundTableName}/${className}`,{
                    header: {
                        'token': token
                    },
                    method:'GET'
                });
                const data = await response.json();
                if (response.ok) {
                    setLoading(false);
                    if (data.message === 404) navigate('/attendance');
                    setUsers(data.members || []);
                    setAllowedToEdit(data.allowedToEdit || false);
                } else {
                    navigate('/');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                navigate('/');
            }
        };
        fetchData();
    }, [attended, roundTableName, className, navigate]);

    // Set up SSE
    useEffect(() => {
        const eventSource = new EventSource('https://ilead-app-production.up.railway.app/events');
        let isMounted = true;

        eventSource.onmessage = (event) => {
            if (isMounted) {
                const data = JSON.parse(event.data);
                if (data.forAll) return setAllowedToEdit(data.message)
                if (data.roundTableName === roundTableName) return setAllowedToEdit(data.message)

            }
        };

        // Clean up on component unmount
        return () => {
            isMounted = false;
            eventSource.close();
        };
    }, []);

    // Handle checkbox changes
    const handleCheckboxChange = (userId) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter((id) => id !== userId));
            setReason((prev) => ({ ...prev, [userId]: '' }));
        } else {
            setSelectedMembers([...selectedMembers, userId]);
            setReason((prev) => ({ ...prev, [userId]: '' }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setReason((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Submit attendance data to the backend
    const handleSubmitAttendance = async (e) => {
        e.preventDefault();
        const attendanceData = users.map((user) => ({
            memberId: user._id,
            date: new Date(),
            status: selectedMembers.includes(user._id),
            reason: selectedMembers.includes(user._id) ? '' : reason[user._id] || '',
        }));

        try {
            const response = await fetch('https://ilead-app-production.up.railway.app/api/handle-attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    token
                },
                body: JSON.stringify({ roundTableName, attendanceData, className }),
            });
            if (response.ok) {
                setFormSubmitted(true);
                setSelectedMembers([]);
                setReason({});
                setAttended(!attended);
            } else {
                alert('Failed to update attendance');
            }
        } catch (error) {
            console.error('Error submitting attendance:', error);
        }
    };

    return (
        <>
            {loading ? (
                <div className="flex justify-center items-center h-screen">
                    <span className="loading loading-spinner"></span>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto p-4 bg-gray-100 rounded shadow-md">
                    <h1 className="text-2xl font-bold mb-6">Manage Attendance</h1>
                    <button
                        onClick={() => navigate('/')}
                        className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Back to home
                    </button>
                    {users && (

                        <form onSubmit={handleSubmitAttendance}>
                            <table className="table w-full bg-white rounded-lg shadow-md">
                                <thead>
                                    <tr className="bg-gray-200 text-gray-700">
                                        <th className="py-2 px-4 border-b text-left">Member Names</th>
                                        <th className="py-2 px-4 border-b">Present</th>
                                        <th className="py-2 px-4 border-b">Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length > 0 ? (
                                        users.map((user) => (
                                            <tr key={user._id} className="hover:bg-gray-100">
                                                <td className="py-2 px-4 border-b">{user.name}</td>
                                                <td className="py-2 px-4 border-b">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox"
                                                        checked={
                                                            allowedToEdit
                                                                ? selectedMembers.includes(user._id)
                                                                : user.attendance?.length > 0 && user.attendance[user.attendance.length - 1].status
                                                        }
                                                        onChange={() => handleCheckboxChange(user._id)}
                                                        disabled={!allowedToEdit}
                                                    />
                                                </td>
                                                <td className="py-2 px-4 border-b">
                                                    {allowedToEdit ? (
                                                        <input
                                                            type="text"
                                                            placeholder="Reason for absence"
                                                            className="input w-full border-none focus:outline-none"
                                                            onChange={handleChange}
                                                            value={reason[user._id] || ''}
                                                            name={user._id}
                                                            disabled={selectedMembers.includes(user._id)}
                                                        />
                                                    ) : (
                                                        user.attendance?.length > 0 ? user.attendance[user.attendance.length - 1].reason : ''
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="py-2 px-4 text-center">No users found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <button
                                type="submit"
                                className={`mt-4 w-full text-white px-4 py-2 rounded ${allowedToEdit ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-300 cursor-not-allowed'}`}
                                disabled={!allowedToEdit}
                            >
                                Submit Attendance
                            </button>
                        </form>

                    )}
                    {formSubmitted && (
                        <div className="mt-4 p-2 text-green-700 bg-green-100 border border-green-400 rounded">
                            Attendance updated successfully!
                        </div>
                    )}

                    {users.length <= 0 && (
                        <div
                            className='mt-4 p-2 text-red-700 bg-red-100 border border-red-400 rounded'
                        >
                            <div>No members present</div>
                            <button
                                className='btn btn-info text-white'
                                onClick={() => navigate('/addMembers')}>Add members</button>

                        </div>
                    )}
                </div>
            )}
        </>
    );
}
