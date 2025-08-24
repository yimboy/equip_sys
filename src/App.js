import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Homepage from './components/Homepage';
import Profile from './components/Profile';
import Bring from './components/Bring';
import Borrow from './components/Borrow';
import History from './components/History';
import Return from './components/Return';
import EditBring from './components/EditBring';
import EditBorrow from './components/EditBorrow';
import ApproveBring from './components/ApproveBring';
import ApproveBorrow from './components/ApproveBorrow';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} /> {/* หน้าแรก */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/homepage" element={<Homepage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/bring" element={<Bring />} />
        <Route path="/borrow" element={<Borrow />} />
        <Route path="/history" element={<History />} />
        <Route path="/return" element={<Return />} />
        <Route path="/edit-bring" element={<EditBring />} />
        <Route path="/edit-borrow" element={<EditBorrow />} />
        <Route path="/approvebring" element={<ApproveBring />} />
        <Route path="/approveborrow" element={<ApproveBorrow />} />
        {/* เพิ่มเส้นทางอื่น ๆ ตามต้องการ */}
        </Routes>
    </Router>
  );
}
export default App;