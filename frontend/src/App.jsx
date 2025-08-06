
import './App.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import DashboardPage from "./DashboardPage";
import FileBrowserPage from './FileBrowserPage';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/repo/:owner/:repoName" element={<FileBrowserPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
