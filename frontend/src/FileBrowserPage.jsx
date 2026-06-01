import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";

const SKIPPED_EXTENSIONS = [
  ".ico",
  ".jpg",
  ".jpeg",
  ".png",
  ".svg",
  ".webp",
];

const SKIPPED_FILE_NAMES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"];
const SKIPPED_PATH_PARTS = ["/build/", "/dist/", "/node_modules/"];

function isRecommendedFile(filePath) {
  const normalizedPath = `/${filePath.toLowerCase()}`;
  const hasSkippedExtension = SKIPPED_EXTENSIONS.some((extension) =>
    normalizedPath.endsWith(extension)
  );
  const hasSkippedFileName = SKIPPED_FILE_NAMES.some((fileName) =>
    normalizedPath.endsWith(`/${fileName}`)
  );
  const hasSkippedFolder = SKIPPED_PATH_PARTS.some((part) =>
    normalizedPath.includes(part)
  );

  return !hasSkippedExtension && !hasSkippedFileName && !hasSkippedFolder;
}

function FileBrowserPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const { owner, repoName } = useParams();

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/api/files`, {
        params: { owner, repo: repoName },
      })
      .then((response) => {
        const filesWithCheckbox = response.data.map((file) => ({
          ...file,
          checked: false,
          recommended: isRecommendedFile(file.path),
        }));
        setFiles(filesWithCheckbox);
        setStatus({ type: "", message: "" });
      })
      .catch((error) => {
        console.error("Error fetching files:", error);
        setStatus({
          type: "error",
          message: "Unable to load repository files. Please try again.",
        });
      })
      .finally(() => setLoading(false));
  }, [owner, repoName]);

  const selectedFiles = useMemo(
    () => files.filter((file) => file.checked),
    [files]
  );

  const visibleFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return files.filter((file) => {
      if (!normalizedQuery) {
        return true;
      }
      return file.path.toLowerCase().includes(normalizedQuery);
    });
  }, [files, query]);

  const handleCheckboxChange = (fileSha) => {
    setFiles((currentFiles) =>
      currentFiles.map((file) =>
        file.sha === fileSha ? { ...file, checked: !file.checked } : file
      )
    );
  };

  const handleSelectRecommended = () => {
    setFiles((currentFiles) =>
      currentFiles.map((file) => ({
        ...file,
        checked: file.recommended && visibleFiles.some((item) => item.sha === file.sha),
      }))
    );
  };

  const handleClearSelection = () => {
    setFiles((currentFiles) =>
      currentFiles.map((file) => ({ ...file, checked: false }))
    );
  };

  const handleGenerateSuggestions = async () => {
    if (selectedFiles.length === 0) {
      setStatus({ type: "error", message: "Select at least one source file." });
      return;
    }

    setIsGenerating(true);
    setGeneratedCode("");
    setSummaries([]);
    setStatus({
      type: "info",
      message: "Reading selected files and preparing suggestions...",
    });

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/generate-summary`,
        {
          owner,
          repo: repoName,
          fileShas: selectedFiles.map((file) => file.sha),
        }
      );
      setSummaries(response.data.summaries);
      setStatus({
        type: "success",
        message: "Suggestions are ready. Choose one to generate code.",
      });
    } catch (error) {
      console.error("Error generating summaries:", error);
      setStatus({
        type: "error",
        message: "Failed to generate summaries. Try fewer or smaller files.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSummaryClick = async (selectedSummary) => {
    if (selectedFiles.length === 0) {
      setStatus({
        type: "error",
        message: "The selected files were cleared. Select them again.",
      });
      return;
    }

    setIsGeneratingCode(true);
    setGeneratedCode("");
    setStatus({ type: "info", message: "Generating Playwright test code..." });

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/generate-code`,
        {
          owner,
          repo: repoName,
          fileShas: selectedFiles.map((file) => file.sha),
          selectedSummary,
        }
      );
      setGeneratedCode(response.data.code);
      setStatus({ type: "success", message: "Test code generated." });
    } catch (error) {
      console.error("Error generating code:", error);
      setStatus({
        type: "error",
        message: "Failed to generate code. Try a smaller selection.",
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setStatus({ type: "success", message: "Generated code copied." });
  };

  const handleCreatePr = async () => {
    if (!generatedCode) {
      setStatus({ type: "error", message: "Generate code before creating a PR." });
      return;
    }

    setIsCreatingPr(true);
    setStatus({ type: "info", message: "Creating branch and pull request..." });

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/create-pr`,
        {
          owner,
          repo: repoName,
          code: generatedCode,
          fileName: `tests/ai-generated-${Date.now()}.spec.js`,
          branchName: `feat/ai-test-${Date.now()}`,
          commitMessage: "feat: Add AI-generated test case",
          prTitle: "Add AI-Generated Test Case",
          prBody:
            "This PR was automatically created by the Workik AI Test Case Generator and includes a new test case.",
        }
      );
      setStatus({ type: "success", message: "Pull request created." });
      window.open(response.data.prUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error creating Pull Request:", error);
      setStatus({
        type: "error",
        message: "Failed to create pull request. Check backend logs.",
      });
    } finally {
      setIsCreatingPr(false);
    }
  };

  return (
    <main className="app-shell wide">
      <header className="topbar">
        <Link to="/dashboard" className="app-logo">
          <span className="brand-mark small">AI</span>
          <span>Test Case Generator</span>
        </Link>
        <Link to="/dashboard" className="secondary-link">
          Back to repos
        </Link>
      </header>

      <section className="page-header compact">
        <div>
          <p className="eyebrow">Repository</p>
          <h1>
            {owner}/{repoName}
          </h1>
        </div>
        <div className="selection-pill">{selectedFiles.length} selected</div>
      </section>

      {status.message && (
        <div className={`notice ${status.type}`}>{status.message}</div>
      )}

      {loading ? (
        <div className="center-state">
          <div className="loader" />
          <p>Loading repository files...</p>
        </div>
      ) : (
        <section className="workspace-grid">
          <aside className="workspace-panel file-panel">
            <div className="panel-header">
              <div>
                <h2>Files</h2>
                <p>{visibleFiles.length} visible</p>
              </div>
              <input
                aria-label="Search files"
                className="search-input compact-input"
                placeholder="Search files"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="toolbar">
              <button className="ghost-button" onClick={handleSelectRecommended}>
                Select source files
              </button>
              <button className="ghost-button" onClick={handleClearSelection}>
                Clear
              </button>
            </div>

            <div className="file-list-container">
              {visibleFiles.map((file) => (
                <label
                  className={`file-row ${file.checked ? "selected" : ""}`}
                  key={file.sha}
                  htmlFor={file.sha}
                >
                  <input
                    type="checkbox"
                    id={file.sha}
                    checked={file.checked}
                    onChange={() => handleCheckboxChange(file.sha)}
                  />
                  <span className="file-path">{file.path}</span>
                  {!file.recommended && <span className="file-badge">Large</span>}
                </label>
              ))}
            </div>

            <button
              className="primary-action full-width"
              onClick={handleGenerateSuggestions}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Suggestions"}
            </button>
          </aside>

          <section className="workspace-panel result-panel">
            <div className="panel-header">
              <div>
                <h2>AI Output</h2>
                <p>Suggestions and generated Playwright code</p>
              </div>
              {(isGenerating || isGeneratingCode) && <div className="loader small" />}
            </div>

            <div className="output-section">
              <h3>Suggested Test Cases</h3>
              {summaries.length === 0 ? (
                <div className="empty-state">
                  Select source files and generate suggestions to begin.
                </div>
              ) : (
                <div className="summary-list">
                  {summaries.map((summary, index) => (
                    <button
                      className="summary-button"
                      key={`${summary}-${index}`}
                      onClick={() => handleSummaryClick(summary)}
                      disabled={isGeneratingCode}
                    >
                      {summary}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="output-section">
              <div className="code-header">
                <h3>Generated Code</h3>
                {generatedCode && (
                  <button className="ghost-button" onClick={handleCopyCode}>
                    Copy
                  </button>
                )}
              </div>

              {generatedCode ? (
                <>
                  <pre className="code-block">
                    <code>{generatedCode}</code>
                  </pre>
                  <button
                    className="primary-action"
                    onClick={handleCreatePr}
                    disabled={isCreatingPr}
                  >
                    {isCreatingPr ? "Creating PR..." : "Create Pull Request"}
                  </button>
                </>
              ) : (
                <div className="empty-state">
                  Choose a suggestion to generate runnable test code.
                </div>
              )}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}

export default FileBrowserPage;
