AI Resume Analyzer
An AI-powered resume analysis tool that extracts, parses, and evaluates resume content to identify skills, match job descriptions, and provide actionable insights.

Features
📂 Upload & Parse resumes in PDF format

🔍 Extract Skills & Keywords using Natural Language Processing (NLP)

📊 Match Score calculation against a provided job description

🧠 Uses AI models for semantic skill extraction and keyword matching

⚡ Built with a modular architecture (separate client and server folders)

Tech Stack
Frontend (Client)

React

Vite

Tailwind CSS

Backend (Server)

Node.js + Express

Multer for file uploads

pdf-parse for PDF text extraction

OpenAI API (or NLP libraries) for text analysis

How to Run Locally
Clone the repository

bash
Copy
Edit
git clone https://github.com/christyuk/ai-resume-analyzer.git
cd ai-resume-analyzer
Install dependencies (for both client and server)

bash
Copy
Edit
cd resume-analyzer-server
npm install
cd ../resume-analyzer-client
npm install
Set up environment variables
Create .env files in both server and client directories with your API keys (e.g., OpenAI key) and configurations.

Run the application
Start the server:

bash
Copy
Edit
cd resume-analyzer-server
npm start
Start the client:

bash
Copy
Edit
cd ../resume-analyzer-client
npm run dev
Access the app
Open your browser and go to http://localhost:5173 (or the port Vite specifies).

Folder Structure
lua
Copy
Edit
ai-resume-analyzer/
│
├── resume-analyzer-client/   # React frontend
├── resume-analyzer-server/   # Node.js backend
├── package.json
└── README.md
Future Enhancements
Deploy to cloud (e.g., Vercel + Render)

Add multi-format support (DOCX)

Store user analysis history in database

✍ Author: ChristyUK
