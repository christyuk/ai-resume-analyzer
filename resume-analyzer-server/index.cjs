const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const summarizeText = require("./utils/summarizer"); // optional if you plan to use it

const app = express();
const PORT = 5000;

// CORS
app.use(cors());
app.use(express.json());

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Helper: extract text from PDF file
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

// Endpoint: Analyze resume
app.post("/analyze", upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "jobDescription", maxCount: 1 }
]), async (req, res) => {
  try {
    const resumePath = req.files.resume[0].path;
    const jdPath = req.files.jobDescription[0].path;

    const resumeText = await extractTextFromPDF(resumePath);
    const jobText = await extractTextFromPDF(jdPath);

    // Find match percentage
    const jdWords = jobText.match(/\b\w+\b/g)?.map(w => w.toLowerCase()) || [];
    const resumeWords = resumeText.match(/\b\w+\b/g)?.map(w => w.toLowerCase()) || [];

    const matchCount = jdWords.filter(word => resumeWords.includes(word)).length;
    const matchPercentage = Math.round((matchCount / jdWords.length) * 100);

    // Highlight keywords in resume text
    const uniqueJDWords = [...new Set(jdWords)];
    const highlightedText = resumeText.replace(
      new RegExp(`\\b(${uniqueJDWords.join("|")})\\b`, "gi"),
      (match) => `<mark>${match}</mark>`
    );

    res.json({
      message: "✅ Resume analyzed successfully!",
      highlightedText,
      matchPercentage,
      summary: "Summary feature is optional. You can add OpenAI or custom logic later.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while analyzing resume." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});






