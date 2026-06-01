import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function DashboardPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/api/repos`)
      .then((response) => {
        setRepos(response.data);
        setError("");
      })
      .catch((requestError) => {
        console.error("Error fetching repos:", requestError);
        setError("Unable to load repositories. Please login again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRepos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return repos;
    }

    return repos.filter((repo) =>
      repo.full_name.toLowerCase().includes(normalizedQuery)
    );
  }, [query, repos]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link to="/dashboard" className="app-logo">
          <span className="brand-mark small">AI</span>
          <span>Test Case Generator</span>
        </Link>
        <span className="topbar-meta">{repos.length} repositories</span>
      </header>

      <section className="page-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Your Repositories</h1>
        </div>
        <input
          aria-label="Search repositories"
          className="search-input"
          placeholder="Search repositories"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </section>

      {loading && (
        <div className="center-state">
          <div className="loader" />
          <p>Loading repositories...</p>
        </div>
      )}

      {!loading && error && <div className="notice error">{error}</div>}

      {!loading && !error && (
        <section className="repo-grid">
          {filteredRepos.map((repo) => (
            <Link
              to={`/repo/${encodeURIComponent(repo.owner.login)}/${encodeURIComponent(
                repo.name
              )}`}
              className="repo-card"
              key={repo.id}
            >
              <div>
                <p className="repo-owner">{repo.owner.login}</p>
                <h2>{repo.name}</h2>
              </div>
              <div className="repo-meta">
                <span>{repo.private ? "Private" : "Public"}</span>
                <span>{repo.language || "Code"}</span>
              </div>
            </Link>
          ))}
        </section>
      )}

      {!loading && !error && filteredRepos.length === 0 && (
        <div className="center-state">No repositories match your search.</div>
      )}
    </main>
  );
}

export default DashboardPage;
