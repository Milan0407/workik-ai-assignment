import React from "react";

function LoginPage() {
  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="brand-mark">AI</div>
        <p className="eyebrow">GitHub powered testing assistant</p>
        <h1>Test Case Generator</h1>
        <p className="login-copy">
          Connect your GitHub account, select source files, and generate focused
          test suggestions with Gemini.
        </p>
        <a
          href={`${import.meta.env.VITE_API_BASE_URL}/auth/github`}
          className="primary-action"
        >
          Continue with GitHub
        </a>
      </section>
    </main>
  );
}

export default LoginPage;
