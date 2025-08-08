// frontend/src/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function DashboardPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { /* ... (this part is unchanged) ... */
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/repos`)
      .then(response => {
        setRepos(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching repos:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    // Use the CSS loader instead of text
    return <div className="loader"></div>;
  }

  return (
    <div>
      <h2>Your Repositories</h2>
      {/* Apply the list style */}
      <ul className="repo-list">
        {repos.map(repo => (
          <li key={repo.id}>
            <Link to={`/repo/${repo.owner.login}/${repo.name}`}>
              {repo.full_name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DashboardPage;