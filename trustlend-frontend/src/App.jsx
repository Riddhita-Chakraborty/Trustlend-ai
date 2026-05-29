import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AnalyzePage from './pages/Analyze';
import ComparePage from './pages/Compare';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Routes>
    </Router>
  );
}

export default App;