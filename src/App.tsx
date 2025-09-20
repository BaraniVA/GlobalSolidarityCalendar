import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import SubmitEvent from './pages/SubmitEvent';
import ModerationDashboard from './pages/ModerationDashboard';
import TransparencyLog from './pages/TransparencyLog';
import Auth from './pages/Auth';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-palestine-white">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/submit" element={<SubmitEvent />} />
          <Route path="/moderation" element={<ModerationDashboard />} />
          <Route path="/log" element={<TransparencyLog />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;