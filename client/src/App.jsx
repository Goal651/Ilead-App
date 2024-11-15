import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import AddMember from './pages/AddMember';
import Attendance from './pages/Attendance';
import Dashboard from './pages/AdminPage';
import Login from './pages/Login';
import HomePage from './pages/DashBoard'; // Updated name for consistency
import NotFound from './pages/NotFound';
import RegisterRoundTable from './pages/RegisterRoundTable';
import { useEffect, useState } from 'react';

export default function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('role')); // Get role from localStorage

  useEffect(() => {
    const role = localStorage.getItem('role');
    setUserRole(role);
  }, []);

  return (
    <div className="h-screen">
      <Router>
        <Suspense
          fallback={
            <div className="h-screen flex justify-center bg-slate-900">
              <span className="loading loading-infinity h-screen bg-white"></span>
            </div>
          }
        >
          <Routes>
            {/* General Routes */}
            <Route path="/" element={<HomePage />} />

            {/* Role-based Routes */}

            <Route path="/add-members" element={<AddMember />} />
            <Route path="/attendance" element={<Attendance />} />


            <Route path="/admin-panel" element={<Dashboard />} />


            {/* Common Routes */}
            <Route path="/register-roundtable" element={<RegisterRoundTable />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
}
