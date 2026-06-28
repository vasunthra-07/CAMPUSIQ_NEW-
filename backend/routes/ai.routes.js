const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// AI CHAT via Ollama
router.post('/chat', verifyToken, async (req, res) => {
  const { systemPrompt, userMessage } = req.body;
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: systemPrompt + '\n\nUser: ' + userMessage + '\n\nAssistant:',
        stream: false,
        options: { temperature: 0.7, num_predict: 300 }
      })
    });
    const data = await response.json();
    res.json({ success: true, response: data.response });
  } catch {
    res.json({
      success: true,
      response: 'Based on your academic profile, I recommend focusing on attendance recovery and scheduling a mentor meeting this week.',
      fallback: true
    });
  }
});

// AI DROPOUT ANALYSIS
router.post('/dropout-analysis', verifyToken, async (req, res) => {
  const { studentData } = req.body;
  const prompt = `You are CampusIQ Assistant for CampusIQ.
Analyze dropout risk for:
Name: ${studentData.name}, Year: ${studentData.year}, Dept: ${studentData.department}
Attendance: ${studentData.attendance}%, IAT Total: ${studentData.iatTotal}/100
Status: ${studentData.status}, Pattern: ${studentData.persona}
Provide: 1) Dropout probability % 2) Top 3 root causes 3) 4-week rescue plan 4) What NOT to do 5) Mentor opening line. Under 300 words.`;
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3.2', prompt, stream: false, options: { temperature: 0.7, num_predict: 500 } })
    });
    const data = await response.json();
    res.json({ success: true, analysis: data.response });
  } catch {
    res.json({
      success: true,
      analysis: `Dropout Risk for ${studentData.name}:\nStatus: ${studentData.status}\nAttendance: ${studentData.attendance}%\nImmediate mentor intervention required.`,
      fallback: true
    });
  }
});

module.exports = router;
