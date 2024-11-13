import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import AddMember from './pages/AddMember';
import Home from './pages/Home';
import Attendance from './pages/Attendance';
import Dashboard from './pages/AdminPage';
import Login from './pages/Login';
import HomePage from './pages/DashBoard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <div className="h-screen">
      <Router>
        <Suspense fallback={
          <div className='h-screen flex justify-center bg-slate-900'>
            <span className='loading loading-infinity h-screen bg-white'></span>
          </div>
        }>
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/addMembers' element={<AddMember />} />
            <Route path='/enter-roundtable' element={<Home />} />
            <Route path='/register-roundTable' element={<Home />} />
            <Route path='/attendance' element={<Attendance />} />
            <Route path='/admin' element={<Login />} />
            <Route path='/SudoSu' element={<Dashboard />} />
            <Route path='*' element={<NotFound/>} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
}


