# Workik AI - Test Case Generator

This is a full-stack web application built as an assignment for the Workik AI internship. The application integrates with a user's GitHub account, allows them to select files from a repository, and uses the Google Gemini AI to generate test case summaries and full test case code.

---

### 🎥 Live Demo

A complete walkthrough of the application's features can be viewed here:

[https://www.youtube.com/watch?v=7NHJhzUP7W4]

---

### ✨ Features

- Secure user authentication via GitHub OAuth.
- Fetches and displays a user's GitHub repositories and their file structures.
- Integrates with the Google Gemini API for intelligent content generation.
- **AI-Powered Summary Generation**: Creates a list of suggested test case summaries based on the content of selected files.
- **AI-Powered Code Generation**: Generates complete, runnable test case code (using the Playwright framework) based on a selected summary.
- **Bonus - Automated Pull Requests**: Automatically creates a new branch and opens a pull request on GitHub with the newly generated test file.
- Clean, modern, and responsive user interface.

---

### 💻 Tech Stack

- **Frontend**: React, Vite, Axios
- **Backend**: Node.js, Express.js
- **APIs**: GitHub REST API, Google Gemini API
- **Styling**: Pure CSS

---

### 🚀 Setup and Installation

To run this project locally, follow these steps:

1.  Clone the repository.
2.  **Backend Setup**:
    - Navigate to the `backend` directory: `cd backend`
    - Install dependencies: `npm install`
    - Create a `.env` file and add your `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GEMINI_API_KEY`.
    - Start the server: `node index.js`
3.  **Frontend Setup**:
    - Navigate to the `frontend` directory: `cd frontend`
    - Install dependencies: `npm install`
    - Start the client: `npm run dev`
