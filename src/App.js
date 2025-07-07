import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Homepage from './components/Homepage';
import Profile from './components/Profile';
import Bring from './components/Bring';
import Borrow from './components/Borrow';
import History from './components/History';
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
        
      </Routes>
    </Router>
  );
}
export default App;