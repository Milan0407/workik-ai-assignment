// frontend/src/LoginPage.jsx - CORRECTED AND IMPROVED

import React from 'react';

function LoginPage() {
  return (

    <div>
      <h1 style={{ fontSize: '3.5rem', marginBottom: '15px' }}>
        Test Case Generator
      </h1>

      <p style={{ fontSize: '1.2rem', color: '#b0b0b0', marginBottom: '40px' }}>
        Login with your GitHub account to analyze your repositories.
      </p>
      
      {/* This is the key change: adding className="button-link"
        tells the <a> tag to look like a button, based on our App.css file.
      */}
      <a href="http://localhost:8000/auth/github" className="button-link">
        Login with GitHub
      </a>
    </div>
  );
}

export default LoginPage;