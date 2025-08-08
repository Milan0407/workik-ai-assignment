import { GoogleGenerativeAI } from "@google/generative-ai";
import { Buffer } from "buffer";
import "dotenv/config"; // Special syntax for dotenv
import express from "express";
import cors from "cors";
import axios from "axios";
import { Octokit } from "@octokit/rest";

const app = express();
const PORT = process.env.PORT || 8000;

// --- We will store the access token in memory for this assignment ---
// In a real app, you'd store this in a database or a secure session.
let accessToken = null;

const corsOptions = {
  origin: [
    "http://localhost:5173", // Your local frontend
    "https://workik-ai-assignment.vercel.app",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// ENDPOINT 1: Redirects user to GitHub's login page
app.get("/auth/github", (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo`;
  res.redirect(githubAuthUrl);
});

// ENDPOINT 2: The callback URL GitHub hits after the user logs in
app.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query; // GitHub provides a temporary code

  try {
    // Exchange the temporary code for a permanent access token
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    accessToken = response.data.access_token; // Extract and store the token
    console.log("Successfully obtained access token!");

    // Redirect the user back to the frontend dashboard
    res.redirect("https://workik-ai-assignment.vercel.app/dashboard");
  } catch (error) {
    console.error("Error getting access token:", error);
    res.status(500).send("Failed to authenticate");
  }
});

app.get("/", (req, res) => {
  res.send("Hello from the Workik AI Assignment Backend!");
});

// ENDPOINT 3: Fetches the authenticated user's repositories
app.get("/api/repos", async (req, res) => {
  if (!accessToken) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const octokit = new Octokit({ auth: accessToken });
    const { data } = await octokit.repos.listForAuthenticatedUser();
    res.json(data);
  } catch (error) {
    console.error("Error fetching repos:", error);
    res.status(500).json({ message: "Error fetching repositories" });
  }
});

// ENDPOINT 4: Fetches the files/content of a specific repository
app.get("/api/files", async (req, res) => {
  if (!accessToken) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { owner, repo } = req.query; // e.g., ?owner=google&repo=gemini-api

  if (!owner || !repo) {
    return res.status(400).json({ message: "Owner and repo are required" });
  }

  try {
    const octokit = new Octokit({ auth: accessToken });
    // We use getTree with 'recursive: true' to get all files in all subdirectories
    const { data } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: "main", // Or 'master', depending on the default branch
      recursive: "true",
    });

    const codeFiles = data.tree.filter((file) => file.type === "blob");
    res.json(codeFiles);
  } catch (error) {
    console.error("Error fetching files:", error);
    res
      .status(500)
      .json({ message: "Error fetching files for the repository" });
  }
});

app.post("/api/generate-summary", async (req, res) => {
  if (!accessToken) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { owner, repo, fileShas } = req.body;
  if (!owner || !repo || !fileShas || fileShas.length === 0) {
    return res.status(400).json({ message: "Missing required information." });
  }

  try {
    const octokit = new Octokit({ auth: accessToken });
    let combinedFileContents = "";

    // Loop through each file SHA, fetch its content from GitHub
    for (const sha of fileShas) {
      const { data: blob } = await octokit.git.getBlob({
        owner,
        repo,
        file_sha: sha,
      });
      const fileContent = Buffer.from(blob.content, "base64").toString("utf-8");
      combinedFileContents += `\n---\nFile Path: ${blob.url}\n---\n${fileContent}`;
    }

    // --- AI PROMPT ENGINEERING ---
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
      You are an expert test case writer for a software development team.
      Based on the content of the following code files, provide a numbered list of short, one-sentence summaries for potential test cases.
      Focus on functionality, edge cases, and potential errors.

      ${combinedFileContents}

      Please provide only the numbered list of summaries.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const summaries = text.split("\n").filter((s) => s.length > 0);

    res.json({ summaries });
  } catch (error) {
    console.error("Error generating test case summaries:", error);
    res.status(500).json({ message: "Failed to generate summaries" });
  }
});

app.post("/api/generate-code", async (req, res) => {
  if (!accessToken) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { owner, repo, fileShas, selectedSummary } = req.body;
  if (
    !owner ||
    !repo ||
    !fileShas ||
    fileShas.length === 0 ||
    !selectedSummary
  ) {
    return res
      .status(400)
      .json({ message: "Missing required information for code generation." });
  }

  try {
    const octokit = new Octokit({ auth: accessToken });
    let combinedFileContents = "";

    for (const sha of fileShas) {
      const { data: blob } = await octokit.git.getBlob({
        owner,
        repo,
        file_sha: sha,
      });
      const fileContent = Buffer.from(blob.content, "base64").toString("utf-8");
      combinedFileContents += `\n---\nFile Content\n---\n${fileContent}`;
    }

    // --- NEW, MORE SPECIFIC AI PROMPT ---
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    // Since we are testing a web page (HTML/CSS), let's use a popular JavaScript testing framework.
    const framework = "Playwright";

    const prompt = `
      You are an expert software engineer specializing in automated testing.
      Your task is to write a complete, runnable test case.
      Based on the provided code files and the specific test case summary, generate the code using the ${framework} framework.
      Provide only the raw code for the test file. Do not include any explanation, comments, or markdown formatting like \`\`\`javascript.

      CONTEXT:
      ${combinedFileContents}

      REQUESTED TEST CASE:
      "${selectedSummary}"

      Generate the ${framework} code now.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const code = response.text();

    res.json({ code });
  } catch (error) {
    console.error("Error generating test case code:", error);
    res.status(500).json({ message: "Failed to generate code" });
  }
});

app.post("/api/create-pr", async (req, res) => {
  if (!accessToken) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const {
    owner,
    repo,
    fileName,
    branchName,
    code,
    commitMessage,
    prTitle,
    prBody,
  } = req.body;
  const octokit = new Octokit({ auth: accessToken });

  try {
    // Step 1: Get the default branch (usually 'main' or 'master')
    const repoData = await octokit.repos.get({ owner, repo });
    const baseBranch = repoData.data.default_branch;

    // Step 2: Get the SHA of the latest commit on the default branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    const baseSha = refData.object.sha;

    // Step 3: Create a new branch from that commit
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Step 4: Create the new file on the new branch
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: fileName,
      message: commitMessage,
      content: Buffer.from(code).toString("base64"), // Content must be base64 encoded
      branch: branchName,
    });

    // Step 5: Create the Pull Request
    const { data: prData } = await octokit.pulls.create({
      owner,
      repo,
      title: prTitle,
      head: branchName, // The new branch
      base: baseBranch, // The branch to merge into
      body: prBody,
    });

    res.json({ prUrl: prData.html_url });
  } catch (error) {
    console.error("Error in PR creation process:", error);
    res.status(500).json({ message: "Failed to create pull request." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
