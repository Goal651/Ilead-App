import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { ClipLoader, RingLoader } from 'react-spinners'

export default function Dashboard() {
    const [data, setData] = useState([]);
    const [presentMembers, setPresentMembers] = useState([]);
    const [absentMembers, setAbsentMembers] = useState([]);
    const [absentDetails, setAbsentDetails] = useState([]);
    const [error, setError] = useState('');
    const [selectedRoundTable, setSelectedRoundTable] = useState(null);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [availableDates, setAvailableDates] = useState([]);
    const [attendingMode, setAttendingMode] = useState(false);
    const [activeTab, setActiveTab] = useState('graph');
    const [loadingRoundTables, setLoadingRoundTables] = useState(true)
    const [changingAttendingMode, setChangingAttendingMode] = useState(false)

    const navigate = useNavigate();
    const summaryModalRef = useRef(null);
    const roundTableModalRef = useRef(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) navigate('/login');
    }, []);

    useEffect(() => {
        // Group absent details by date and roundtable
        const groupedAbsentDetails = availableDates.map((date) => {
            const roundTableDetails = data.map((roundTable) => {
                const absentMembersForRoundTable = roundTable.members
                    .filter((member) =>
                        member.attendance.some((att) => !att.status && new Date(att.date).toLocaleDateString() === date)
                    )
                    .map((member) => member.name);

                return {
                    roundTableName: roundTable.name,
                    absentMembers: absentMembersForRoundTable,
                };
            });

            return {
                date,
                roundTableDetails: roundTableDetails.filter((rt) => rt.absentMembers.length > 0),
            };
        });

        setAbsentDetails(groupedAbsentDetails.filter((detail) => detail.roundTableDetails.length > 0));
    }, [absentMembers, data, availableDates]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('https://ilead-app-production.up.railway.app/api/overview', {
                    headers: { token },
                    method: 'GET',
                });
                if (response.ok) {
                    setError('');
                    const result = await response.json();
                    const rTs = result.roundTables;
                    setAttendingMode(result.attendanceMode);
                    setData(rTs);

                    const present = [];
                    const absent = [];
                    const dates = new Set();
                    const absentDetails = {};

                    rTs.forEach((roundTable) => {
                        roundTable.members.forEach((member) => {
                            member.attendance.forEach((att) => {
                                const date = new Date(att.date).toLocaleDateString();
                                dates.add(date);

                                // Collect attendance info for each date
                                if (att.status) {
                                    present.push({ name: member.name, roundTable: roundTable.name, className: roundTable.class, date });
                                } else {
                                    absent.push({ name: member.name, roundTable: roundTable.name, className: roundTable.class, date });
                                    if (!absentDetails[date]) absentDetails[date] = [];
                                    absentDetails[date].push({ roundTableName: roundTable.name, memberName: member.name });
                                }
                            });
                        });
                    });

                    setPresentMembers(present);
                    setAbsentMembers(absent);
                    setAvailableDates([...dates]);
                    setAbsentDetails(absentDetails); // Set absent details for all dates
                    setSelectedDate([...dates][0]);
                    setLoadingRoundTables(false)
                } else {
                    const errorMsg = await response.json();
                    setError(errorMsg.message || 'Failed to fetch data');
                    setLoadingRoundTables(false)
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('An error occurred while fetching data');
                setLoadingRoundTables(false)
            }
        };
        fetchData();
    }, []);

    const togglingAttendance = () => {
        data.forEach(element => {
            element.allowedToEdit = !element.allowedToEdit
        });
    }

    const toggleAttendance = async () => {
        setChangingAttendingMode(true)
        try {
            const dataToSend = { attendanceMode: !attendingMode }
            const response = await fetch('https://ilead-app-production.up.railway.app/api/toggleAttendance', {
                method: 'POST',
                body: JSON.stringify(dataToSend),
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json()
            if (response.ok) {
                setError('')
                togglingAttendance()
                setAttendingMode(!attendingMode)
                setChangingAttendingMode(false)
            } else setError(data.message)
        } catch (error) {
            setError(error)
            setChangingAttendingMode(false)
        }
    }

    const toggleAttendanceForRoundTable = async (roundTable) => {
        try {
            const response = await fetch('https://ilead-app-production.up.railway.app/api/toggleAttendanceForRoundTable', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    header: { token },
                },
                body: JSON.stringify(roundTable),
            });
            const result = await response.json();
            if (response.ok) {
                setError('')
                setData((prevData) =>
                    prevData.map((rt) => (rt.name === roundTable.roundTableName ? { ...rt, allowedToEdit: result } : rt))
                );
            }
        } catch (error) {
            console.error(error);
            setError('Failed to toggle attendance for round table.');
        }
    };

    const handleRoundTableClick = (roundTable) => {
        setSelectedRoundTable(roundTable);
    };

    const openSummaryModal = () => setShowSummaryModal(true);
    const closeSummaryModal = () => setShowSummaryModal(false);

    const handleOutsideClick = (e, ref, closeFunction) => {
        if (ref.current && !ref.current.contains(e.target)) {
            closeFunction();
        }
    };

    useEffect(() => {
        if (showSummaryModal) {
            const handleClick = (e) => handleOutsideClick(e, summaryModalRef, closeSummaryModal);
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }
    }, [showSummaryModal]);

    useEffect(() => {
        if (selectedRoundTable) {
            const handleClick = (e) => handleOutsideClick(e, roundTableModalRef, () => setSelectedRoundTable(null));
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }
    }, [selectedRoundTable]);

    const attendanceGraphData = {
        labels: availableDates,
        datasets: [
            {
                label: 'Present Members',
                data: availableDates.map((date) =>
                    presentMembers.filter((member) => member.date === date).length
                ),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
                label: 'Absent Members',
                data: availableDates.map((date) =>
                    absentMembers.filter((member) => member.date === date).length
                ),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
            },
        ],
    };

    return (
        <div className="max-w-full mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
            <h1 className="w-full text-2xl font-bold mb-4 text-center">Overview of Roundtables, Members, and Attendance</h1>
            {error && (
                <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">{error}</div>
            )}

            <div className="flex flex-col gap-6">

                <div className="w-full p-6 flex flex-col sm:flex-row gap-4 sm:gap-10">
                    <button
                        onClick={() => navigate('/')} // Navigate to home page
                        className=" btn bg-blue-500 text-white rounded-xl shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 "
                    >
                        Home
                    </button>
                    <button
                        onClick={openSummaryModal}
                        className="p-4 btn bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 w-full sm:w-auto"
                    >
                        View Attendance Summary
                    </button>

                    {/* Buttons for toggling roundtable attendance mode */}
                    {
                        changingAttendingMode ? (
                            <div className="flex justify-center items-center w-full sm:w-auto">
                                <ClipLoader />
                            </div>
                        ) : (
                            <button
                                onClick={toggleAttendance}
                                className={`p-4 btn rounded-lg shadow w-full sm:w-auto ${attendingMode ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                            >
                                {attendingMode ? 'Disable Attending Mode' : 'Enable Attending Mode'}
                            </button>
                        )
                    }
                </div>


                <div className="overflow-auto max-h-[50vh]">
                    <table className="table-auto w-full border-collapse border border-gray-200">
                        <thead className="bg-gray-300">
                            <tr>
                                <th className="border px-4 py-2">Roundtable</th>
                                <th className="border px-4 py-2">Class</th>
                                <th className="border px-4 py-2">Members</th>
                                <th className='border px-4 py-2'>Mode</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingRoundTables ? (
                                <span className="flex items-center justify-center">
                                    <span className="loading loading-spinner w-8 h-8"></span>
                                </span>
                            ) : (data.map((roundTable) => (
                                <tr
                                    key={roundTable._id}
                                    onClick={() => handleRoundTableClick(roundTable)}
                                    className="cursor-pointer hover:bg-gray-200"
                                >
                                    <td className="border px-4 py-2">{roundTable.name}</td>
                                    <td className="border px-4 py-2">{roundTable.class}</td>
                                    <td className="border px-4 py-2">{roundTable.members.length}</td>
                                    <td className="border px-4 py-2">
                                        {changingAttendingMode ? (
                                            <div className="btn text-white bg-base-100">
                                                <ClipLoader
                                                    className='font-bold'
                                                    color='black' />
                                            </div>) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleAttendanceForRoundTable({
                                                        roundTableName: roundTable.name,
                                                        className: roundTable.class,
                                                        allowedToEdit: roundTable.allowedToEdit
                                                    })
                                                }}
                                                className={`btn text-white ${roundTable.allowedToEdit ? 'bg-red-500' : 'bg-green-500'}`}
                                            >
                                                {roundTable.allowedToEdit ? 'Disable' : 'Enable'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showSummaryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div
                        ref={summaryModalRef}
                        className="bg-white p-6 rounded-lg shadow-lg w-full h-full max-w-4xl max-h-[90%] overflow-hidden flex flex-col"
                    >
                        <h2 className="text-xl font-bold mb-4 text-center">Attendance Summary</h2>

                        {/* Tab Navigation */}
                        <div className="flex justify-center my-10 ">
                            <button
                                onClick={() => setActiveTab('graph')}
                                className={`p-2 mx-2 ${activeTab === 'graph' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            >
                                Attendance Graph
                            </button>
                            <button
                                onClick={() => setActiveTab('absentDetails')}
                                className={`p-2 mx-2 ${activeTab === 'absentDetails' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            >
                                Absent Details
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-grow overflow-y-auto">
                            {activeTab === 'graph' && <Bar data={attendanceGraphData} />}
                            {activeTab === 'absentDetails' && (
                                <div className="mt-4 max-h-screen ">
                                    <h3 className="text-lg font-semibold mb-2">Absent Details</h3>
                                    <ul className="list-disc pl-6">
                                        {absentMembers.length > 0 ? (
                                            absentMembers.map((detail, index) => (
                                                <li key={index}>
                                                    <span className="font-bold">{detail.roundTable}</span>: {detail.name + ' (' + detail.className + ')'}
                                                </li>
                                            ))
                                        ) : (
                                            <p>No absent members recorded.</p>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={closeSummaryModal}
                            className="mt-4 p-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Roundtable Modal */}
            {
                selectedRoundTable && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-auto">
                        <div ref={roundTableModalRef} className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-auto">
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
