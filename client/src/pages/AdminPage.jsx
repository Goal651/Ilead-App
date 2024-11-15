import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [data, setData] = useState([]);
    const [presentMembers, setPresentMembers] = useState([]);
    const [absentMembers, setAbsentMembers] = useState([]);
    const [error, setError] = useState('');
    const [selectedRoundTable, setSelectedRoundTable] = useState(null);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [availableDates, setAvailableDates] = useState([]);
    const [attendingMode, setAttendingMode] = useState(false)
    const navigate = useNavigate();
    const token = localStorage.getItem('token')
    useEffect(() => {
        if (!token) navigate('/login')
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('https://ilead-app-production.up.railway.app/api/overview', {
                    headers: {
                        token
                    },
                    method: 'GET',
                });
                if (response.ok) {
                    const result = await response.json();
                    const rTs = await result.roundTables
                    setAttendingMode(result.attendanceMode)
                    console.log(result.attendanceMode)
                    setData(rTs);
                    const present = [];
                    const absent = [];
                    const dates = new Set();

                    rTs.forEach((roundTable) => {
                        roundTable.members.forEach((member) => {
                            member.attendance.forEach((att) => {
                                dates.add(new Date(att.date).toLocaleDateString()); // Add date to set
                                if (att.status) {
                                    present.push({
                                        name: member.name,
                                        roundTable: roundTable.name,
                                        className: roundTable.class,
                                        date: new Date(att.date).toLocaleDateString(),
                                    });
                                } else {
                                    absent.push({
                                        name: member.name,
                                        roundTable: roundTable.name,
                                        className: roundTable.class,
                                        date: new Date(att.date).toLocaleDateString(),
                                    });
                                }
                            });
                        });
                    });

                    setPresentMembers(present);
                    setAbsentMembers(absent);
                    setAvailableDates([...dates]); // Convert Set to array for tabs
                    setSelectedDate([...dates][0]); // Default to first available date
                } else {
                    const errorMsg = await response.json();
                    setError(errorMsg.message || 'Failed to fetch data');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('An error occurred while fetching data');
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (data.length <= 0) return
        const fetchData = async () => {
            try {
                const response = await fetch('https://ilead-app-production.up.railway.app/api/toggleAttendance', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ data: attendingMode })
                })
                if (response.ok) {
                    setData((prevData) => (prevData.map((rt) => {
                        return { ...rt, allowedToEdit: attendingMode }
                    })));
                }
            } catch (err) {
                console.error(err)
            }
        }
        fetchData()
    }, [attendingMode])

    const toggleAttendance = () => setAttendingMode(!attendingMode)


    const toggleAttendanceForRoundTable = async (roundTable) => {
        try {
            const response = await fetch('https://ilead-app-production.up.railway.app/api/toggleAttendanceForRoundTable', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    header: {
                        'token': token
                    }
                },
                body: JSON.stringify(roundTable),
            });
            const result = await response.json();
            if (response.ok) {
                setData((prevData) => (prevData.map((rt) =>
                    rt.name === roundTable.roundTableName ? { ...rt, allowedToEdit: result } : rt
                )));
            }
        } catch (error) {
            console.error(error);
            setError('Failed to toggle attendance for round table.');
        }
    };


    // Function to handle when a roundtable is clicked
    const handleRoundTableClick = (roundTable) => {
        setSelectedRoundTable(roundTable);
    };

    // Function to open the summary modal
    const openSummaryModal = () => {
        setShowSummaryModal(true);
    };

    // Function to close the modal
    const closeModal = () => {
        setShowSummaryModal(false);
    };

    // Function to handle date tab click
    const handleDateTabClick = (date) => {
        setSelectedDate(date);
    };

    // Filter attendance by selected date
    const filteredPresentMembers = presentMembers.filter((member) => member.date === selectedDate);
    const filteredAbsentMembers = absentMembers.filter((member) => member.date === selectedDate);

    return (
        <div className="max-w-full mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
            <h1 className="w-full text-2xl font-bold mb-4 text-center">Overview of Roundtables, Members, and Attendance</h1>
            {error && (
                <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-6">
                {/* Main Table */}
                {/* Button to open Summary Modal */}
                <div className="w-full p-6 flex gap-10">
                    <button
                        onClick={openSummaryModal}
                        className="p-4 btn bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
                    >
                        View Attendance Summary
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className='btn '
                    >
                        Return home
                    </button>
                    {attendingMode ? (
                        <button
                            className='btn btn-primary text-white'
                            onClick={toggleAttendance}
                        >
                            Disable attendance
                        </button>
                    ) : (
                        <button
                            className='btn btn-warning text-white'
                            onClick={toggleAttendance}
                        >
                            Enable attendance
                        </button>
                    )}
                </div>

                <div className="lg:w-full w-full">
                    <table className="w-full table-auto overflow-x-auto sm:table-sm lg:table-lg border-collapse bg-white rounded-lg shadow-lg">
                        <thead className="bg-gray-300 text-gray-800">
                            <tr>
                                <th className="border p-4 text-center">Roundtable Name</th>
                                <th className="border p-4 text-center">Facilitator</th>
                                <th className="border p-4 text-center">Number of members</th>
                                <th className="border p-4 text-center">Attendance mode</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map((roundTable, index) => (
                                    <tr key={index}
                                        className="hover:bg-gray-50 cursor-pointer"
                                    >
                                        <td
                                            onClick={() => handleRoundTableClick(roundTable)}
                                        >
                                            {roundTable.name} ({roundTable.class})
                                        </td>
                                        <td
                                            onClick={() => handleRoundTableClick(roundTable)}
                                        >
                                            {roundTable.facilitator}
                                        </td>
                                        <td
                                            onClick={() => handleRoundTableClick(roundTable)}
                                        >
                                            {roundTable.members.length}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => toggleAttendanceForRoundTable({ roundTableName: roundTable.name, className: roundTable.class, allowedToEdit: roundTable.allowedToEdit })}
                                                className={`btn text-white ${roundTable.allowedToEdit ? 'bg-green-500' : 'bg-red-500'}`}
                                            >
                                                {roundTable.allowedToEdit ? 'Disable' : 'Enable'}
                                            </button>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-4 text-gray-500">
                                        No data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Modal for Attendance Summary */}
            {
                showSummaryModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-scroll">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full overflow-auto h-full">
                            <h2 className="text-xl font-bold mb-4 text-center">Attendance Summary by Date</h2>

                            {/* Dropdown for Dates */}
                            <div className="mb-4">
                                <label htmlFor="dateDropdown" className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Date:
                                </label>
                                <select
                                    id="dateDropdown"
                                    value={selectedDate}
                                    onChange={(e) => handleDateTabClick(e.target.value)}
                                    className="p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="" disabled>Select a date</option>
                                    {availableDates.map((date, index) => (
                                        <option key={index} value={date}>
                                            {date}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Present Members */}
                            <h3 className="text-lg font-bold">Present Members ({filteredPresentMembers.length})</h3>
                            <ul className="list-disc ml-4 text-gray-700">
                                {filteredPresentMembers.length > 0 ? (
                                    filteredPresentMembers.map((member, index) => (
                                        <li key={index} className="py-1">
                                            {member.name} ({member.className}) - {member.roundTable}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-500">No present members</li>
                                )}
                            </ul>

                            {/* Absent Members */}
                            <h3 className="mt-4 text-lg font-bold">Absent Members ({filteredAbsentMembers.length})</h3>
                            <ul className="list-disc ml-4 text-gray-700">
                                {filteredAbsentMembers.length > 0 ? (
                                    filteredAbsentMembers.map((member, index) => (
                                        <li key={index} className="py-1">
                                            {member.name} ({member.className}) - {member.roundTable}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-500">No absent members</li>
                                )}
                            </ul>

                            {/* Close Modal Button */}
                            <button
                                onClick={closeModal}
                                className="mt-4 p-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }


            {/* Roundtable Details Modal */}
            {
                selectedRoundTable && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-auto">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
                            <h2 className="text-2xl font-bold mb-4 text-center">Roundtable Details</h2>
                            <h3 className="text-lg font-bold mb-2">{selectedRoundTable.name}</h3>
                            <p>Facilitator: {selectedRoundTable.facilitator}</p>
                            <p>Class: {selectedRoundTable.class}</p>

                            <h4 className="mt-4 text-lg font-bold">Members</h4>
                            <ul className="list-disc ml-4 text-gray-700">
                                {selectedRoundTable.members.map((member, index) => (
                                    <li key={index} className="py-1">
                                        <b>{member.name} - Attendance:</b> {member.attendance.map((attendance, attIndex) => (
                                            <div key={attIndex}>
                                                Date: {new Date(attendance.date).toLocaleDateString()}, Status: {attendance.status ? 'Present' : 'Absent'}, Reason: {attendance.reason || 'No reason'}
                                            </div>
                                        ))}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => setSelectedRoundTable(null)}
                                className="mt-4 p-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
