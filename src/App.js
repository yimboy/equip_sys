import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Homepage from './components/Homepage';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} /> {/* เพิ่มบรรทัดนี้ */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/homepage" element={<Homepage />} />
      </Routes>
    </Router>
  );
}
export default App;