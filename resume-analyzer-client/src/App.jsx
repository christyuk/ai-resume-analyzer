import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000";

function highlightMatches(text, words) {
  if (!text) return "";
  if (!Array.isArray(words) || words.length === 0) return text;
  const safe = words
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (safe.length === 0) return text;

  const regex = new RegExp(`\\b(${safe.join("|")})\\b`, "gi");
  return text.replace(regex, (m) => `<mark>${m}</mark>`);
}

export default function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescriptionFile, setJobDescriptionFile] = useState(null);

  const [message, setMessage] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [matchPercentage, setMatchPercentage] = useState(null);
  const [matchedWords, setMatchedWords] = useState([]);
  const [missingWords, setMissingWords] = useState([]);

  const [email, setEmail] = useState("");

  // NEW: loading + error states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Analyze handler with loading + error handling
  const handleAnalyze = async () => {
    setErrorMsg("");
    setMessage("");
    setExtractedText("");
    setMatchPercentage(null);
    setMatchedWords([]);
    setMissingWords([]);

    if (!resumeFile || !jobDescriptionFile) {
      setErrorMsg("Please select both a resume PDF and a job description PDF.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jd", jobDescriptionFile);

      const { data } = await axios.post(`${API_BASE}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(data.message || "Analysis complete.");
      setExtractedText(data.extractedText || "");
      setMatchPercentage(
        typeof data.matchPercentage === "number" ? data.matchPercentage : null
      );
      setMatchedWords(Array.isArray(data.matchedWords) ? data.matchedWords : []);
      setMissingWords(Array.isArray(data.missingWords) ? data.missingWords : []);
    } catch (err) {
      console.error(err);
      const apiMsg =
        err?.response?.data?.message || "Error analyzing resume.";
      setErrorMsg(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  // Download the visible result as PDF
  const handleDownloadPDF = async () => {
    const el = document.getElementById("result-section");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("resume-match-report.pdf");
  };

  // Send report via email
  const sendReportByEmail = async () => {
    setErrorMsg("");
    if (!email) {
      setErrorMsg("Please enter a recipient email address.");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        email,
        extractedText,
        matchPercentage,
        matchedWords,
        missingWords,
      };
      await axios.post(`${API_BASE}/email-report`, payload);
      setMessage("Report emailed successfully!");
    } catch (err) {
      console.error(err);
      const apiMsg =
        err?.response?.data?.message || "Failed to send email.";
      setErrorMsg(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>🧠 AI Resume Analyzer</h1>

      <div className="row">
        <div className="col">
          <label className="label">
            <span className="emoji">📄</span> Upload Resume (PDF):
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
          />
          {resumeFile && <div className="meta">Resume: {resumeFile.name}</div>}
        </div>

        <div className="col">
          <label className="label">
            <span className="emoji">📝</span> Upload Job Description (PDF):
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setJobDescriptionFile(e.target.files?.[0] || null)}
          />
          {jobDescriptionFile && (
            <div className="meta">Job Description: {jobDescriptionFile.name}</div>
          )}
        </div>
      </div>

      <button className="primary" onClick={handleAnalyze} disabled={loading}>
        {loading ? "Analyzing…" : "Analyze"}
      </button>

      {/* Error + Info messages */}
      {errorMsg && <div className="error">{errorMsg}</div>}
      {message && <div className="notice">{message}</div>}

      {/* Results */}
      <div id="result-section" className="result-box">
        {extractedText && (
          <>
            <h2>📑 Extracted Resume Text:</h2>
            <pre
              dangerouslySetInnerHTML={{
                __html: highlightMatches(extractedText, matchedWords),
              }}
            />
          </>
        )}

        {typeof matchPercentage === "number" && (
          <div className="score-card">
            <h3>✅ Match Score: {matchPercentage}%</h3>
            <p>
              Your resume matches {matchPercentage}% of the job description.
            </p>
          </div>
        )}

        {matchedWords.length > 0 && (
          <div className="lists">
            <h3>✅ Matched Keywords</h3>
            <ul>
              {matchedWords.map((w, i) => (
                <li key={`${w}-${i}`}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {missingWords.length > 0 && (
          <div className="lists warn">
            <h3>⚠️ Missing Keywords</h3>
            <ul>
              {missingWords.map((w, i) => (
                <li key={`${w}-${i}`}>{w}</li>
              ))}
            </ul>
            <p className="tip">
              Tip: If you actually have these skills, edit your resume to mention
              them clearly (projects, bullets, summary).
            </p>
          </div>
        )}
      </div>

      {/* Actions row */}
      <div className="actions">
        <button
          className="secondary"
          onClick={handleDownloadPDF}
          disabled={loading || !extractedText}
        >
          ⬇️ Download PDF
        </button>

        <div className="email">
          <input
            type="email"
            placeholder="recipient@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="secondary"
            onClick={sendReportByEmail}
            disabled={loading || !extractedText}
          >
            📧 Send Report via Email
          </button>
        </div>
      </div>
    </div>
  );
}













































