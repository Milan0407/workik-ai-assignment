// frontend/src/FileBrowserPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function FileBrowserPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const { owner, repoName } = useParams();
  const [isCreatingPr, setIsCreatingPr] = useState(false);

  useEffect(() => { /* ... (unchanged) ... */
    axios.get(`http://localhost:8000/api/files?owner=${owner}&repo=${repoName}`)
      .then(response => {
        const filesWithCheckbox = response.data.map(file => ({ ...file, checked: false }));
        setFiles(filesWithCheckbox);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching files:', error);
        setLoading(false);
      });
  }, [owner, repoName]);

  const handleCheckboxChange = (fileSha) => { /* ... (unchanged) ... */
    const updatedFiles = files.map(file => {
      if (file.sha === fileSha) {
        return { ...file, checked: !file.checked };
      }
      return file;
    });
    setFiles(updatedFiles);
  };

  const handleGenerateSuggestions = async () => { /* ... (unchanged) ... */
    const selectedFiles = files.filter(file => file.checked);
    if (selectedFiles.length === 0) {
      alert('Please select at least one file.');
      return;
    }
    setIsGenerating(true);
    setGeneratedCode('');
    setSummaries([]);
    const fileShas = selectedFiles.map(file => file.sha);
    try {
      const response = await axios.post('http://localhost:8000/api/generate-summary', {
        owner: owner,
        repo: repoName,
        fileShas: fileShas,
      });
      setSummaries(response.data.summaries);
    } catch (error) {
      console.error('Error generating summaries:', error);
      alert('Failed to generate summaries. Please check the console.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSummaryClick = async (selectedSummary) => { /* ... (unchanged) ... */
    const selectedFiles = files.filter(file => file.checked);
    if (selectedFiles.length === 0) {
      alert('It seems no files are selected. Please select the relevant files again.');
      return;
    }
    setIsGeneratingCode(true);
    setGeneratedCode('');
    const fileShas = selectedFiles.map(file => file.sha);
    try {
      const response = await axios.post('http://localhost:8000/api/generate-code', {
        owner: owner,
        repo: repoName,
        fileShas: fileShas,
        selectedSummary: selectedSummary,
      });
      setGeneratedCode(response.data.code);
    } catch (error) {
      console.error('Error generating code:', error);
      alert('Failed to generate code. Please check the console.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Add this new function inside your FileBrowserPage component
const handleCreatePr = async () => {
  if (!generatedCode) {
    alert('No code has been generated yet.');
    return;
  }
  setIsCreatingPr(true);
  try {
    const response = await axios.post('http://localhost:8000/api/create-pr', {
      owner,
      repo: repoName,
      code: generatedCode,
      // You can customize the filename and branch name here
      fileName: `tests/ai-generated-${Date.now()}.spec.js`,
      branchName: `feat/ai-test-${Date.now()}`,
      commitMessage: 'feat: Add AI-generated test case',
      prTitle: 'Add AI-Generated Test Case',
      prBody: 'This PR was automatically created by the Workik AI Test Case Generator and includes a new test case.'
    });
    alert(`Successfully created Pull Request! You can view it here: ${response.data.prUrl}`);
    window.open(response.data.prUrl, '_blank'); // Open the PR in a new tab
  } catch (error) {
    console.error('Error creating Pull Request:', error);
    alert('Failed to create Pull Request. Please check the console.');
  } finally {
    setIsCreatingPr(false);
  }
};
  
  // Use the CSS loader for the initial file loading
  if (loading) {
    return <div className="loader"></div>;
  }

  return (
    <div>
      <h2>Files in {owner}/{repoName}</h2>
      <div className="file-list-container">
        {files.map((file) => (
          <div key={file.sha}>
            <input
              type="checkbox"
              id={file.sha}
              checked={file.checked}
              onChange={() => handleCheckboxChange(file.sha)}
            />
            <label htmlFor={file.sha} style={{ marginLeft: '8px' }}>{file.path}</label>
          </div>
        ))}
      </div>

      <button onClick={handleGenerateSuggestions} disabled={isGenerating} style={{ marginTop: '20px' }}>
        {isGenerating ? 'Generating...' : 'Generate Test Case Suggestions'}
      </button>

      {/* Show loader while generating summaries */}
      {isGenerating && <div className="loader"></div>}

      {summaries.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Suggested Test Cases: (Click one to generate code)</h3>
          <ul className="summary-list">
            {summaries.map((summary, index) => (
              <li key={index}>
                <button onClick={() => handleSummaryClick(summary)} disabled={isGeneratingCode}>
                  {summary}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Show loader while generating code */}
      {isGeneratingCode && <div className="loader"></div>}

      {generatedCode && (
        <div style={{ marginTop: '20px' }}>
          <h3>Generated Test Case Code:</h3>
          <pre>
            <code>{generatedCode}</code>
          </pre>
          <button onClick={handleCreatePr} disabled={isCreatingPr} style={{ marginTop: '10px' }}>
      {isCreatingPr ? 'Creating PR...' : 'Create Pull Request on GitHub'}
    </button>
        </div>
      )}
    </div>
  );
}

export default FileBrowserPage;