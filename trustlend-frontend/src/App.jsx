import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AnalyzePage from './pages/Analyze';
import ComparePage from './pages/Compare';
import ChatPage from './pages/Chat';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/chat"    element={<ChatPage />} />
      </Routes>
    </Router>
  );
}

export default App;