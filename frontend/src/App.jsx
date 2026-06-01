import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import DashboardPage from "./DashboardPage";
import FileBrowserPage from "./FileBrowserPage";
import LoginPage from "./LoginPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/repo/:owner/:repoName" element={<FileBrowserPage />} />
      </Routes>
    </Router>
  );
}

export default App;
