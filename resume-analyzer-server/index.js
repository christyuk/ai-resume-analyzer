import express from "express";
import cors from "cors";
import multer from "multer";
import pdf from "pdf-parse";
import nodemailer from "nodemailer";

const app = express();

// CORS (you can restrict origin later)
app.use(
  cors({
    origin: "*",
  })
);

// JSON body
app.use(express.json({ limit: "2mb" }));

// Multer in-memory storage + limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB each
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Helper: extract text from PDF Buffer
async function extractPdfText(fileBuffer) {
  const { text } = await pdf(fileBuffer);
  return text || "";
}

// Simple tokenizer
function tokenize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Weighted matching
function computeWeightedMatch(resumeText, jdText) {
  const resumeTokens = new Set(tokenize(resumeText));
  const jdTokens = tokenize(jdText);

  const skillKeywords = [
    "javascript",
    "react",
    "node",
    "nodejs",
    "node.js",
    "typescript",
    "html",
    "css",
    "redux",
    "mongodb",
    "express",
    "next",
    "nextjs",
    "rest",
    "api",
    "restful",
    "docker",
    "kubernetes",
  ];

  const expKeywords = [
    "experience",
    "projects",
    "built",
    "maintained",
    "developed",
    "implemented",
    "designed",
  ];

  let skillHits = 0;
  let expHits = 0;

  const matchedWords = new Set();
  const missingWords = new Set();

  jdTokens.forEach((token) => {
    const inResume = resumeTokens.has(token);
    if (skillKeywords.includes(token)) {
      if (inResume) {
        skillHits++;
        matchedWords.add(token);
      } else {
        missingWords.add(token);
      }
    }
    if (expKeywords.includes(token)) {
      if (inResume) {
        expHits++;
        matchedWords.add(token);
      } else {
        missingWords.add(token);
      }
    }
  });

  const totalWeighted = skillHits * 2 + expHits * 1;
  const maxPossible = (skillKeywords.length * 2) + expKeywords.length;
  const matchPercentage = Math.round(
    Math.min(100, (totalWeighted / maxPossible) * 100)
  );

  return {
    matchPercentage,
    matchedWords: Array.from(matchedWords),
    missingWords: Array.from(missingWords),
  };
}

// Analyze endpoint
app.post(
  "/analyze",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "jd", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const resume = req.files?.resume?.[0];
      const jd = req.files?.jd?.[0];

      if (!resume || !jd) {
        return res
          .status(400)
          .json({ message: "Both resume and job description PDFs are required." });
      }

      const [resumeText, jdText] = await Promise.all([
        extractPdfText(resume.buffer),
        extractPdfText(jd.buffer),
      ]);

      if (!resumeText.trim()) {
        return res
          .status(422)
          .json({ message: "Could not read text from the resume PDF." });
      }

      const {
        matchPercentage,
        matchedWords,
        missingWords,
      } = computeWeightedMatch(resumeText, jdText);

      return res.json({
        message: "Resume analyzed successfully!",
        extractedText: resumeText,
        matchPercentage,
        matchedWords,
        missingWords,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// Email report endpoint
app.post("/email-report", async (req, res, next) => {
  try {
    const {
      email,
      extractedText = "",
      matchPercentage = 0,
      matchedWords = [],
      missingWords = [],
    } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: "Recipient email is required." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,     // your gmail
        pass: process.env.EMAIL_PASS,     // app password
      },
    });

    const html = `
      <h2>AI Resume Analyzer Report</h2>
      <p><strong>Match Score:</strong> ${matchPercentage}%</p>
      <h3>Matched Keywords</h3>
      <p>${matchedWords.join(", ") || "—"}</p>
      <h3>Missing Keywords</h3>
      <p>${missingWords.join(", ") || "—"}</p>
      <h3>Extracted Resume Text</h3>
      <pre style="white-space:pre-wrap;">${extractedText
        .slice(0, 6000)
        .replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]))}</pre>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your AI Resume Analyzer Report",
      html,
    });

    return res.json({ message: "Email sent successfully" });
  } catch (err) {
    return next(err);
  }
});

// Global error handler (better messages)
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File too large (max 10MB)." });
  }
  return res.status(500).json({ message: "Server error. Please try again." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
















