const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'campusiq-platform-secret-2026';
const DB_PATH = path.join(__dirname, 'db.json');

// ─── MIDDLEWARE ───────────────────────────────────────
app.use(cors({
    origin: [
        'http://localhost:8080',
        'http://localhost:5173',
        'http://192.168.56.1:8080',
        'http://10.232.23.139:8080'
    ],
    credentials: true
}));
app.use(express.json());

// ─── HELPER: Read/Write DB ────────────────────────────
function readDB() {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
}

function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ─── HELPER: Verify JWT Token ─────────────────────────
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

// ─── ROUTE 1: Health Check ────────────────────────────
app.get('/', (req, res) => {
    res.json({
        status: 'CampusIQ Platform API Running',
        version: '2.0',
        timestamp: new Date().toISOString()
    });
});

// ─── ROUTE 2: LOGIN ───────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
        return res.status(400).json({ error: 'userId and password are required' });
    }

    const db = readDB();
    const user = db.users.find(u => u.userId === userId);

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        {
            id: user.id,
            userId: user.userId,
            name: user.name,
            role: user.role,
            department: user.department,
            studentId: user.studentId || null
        },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.json({
        success: true,
        token,
        user: {
            userId: user.userId,
            name: user.name,
            role: user.role,
            department: user.department,
            studentId: user.studentId || null
        }
    });
});

// ─── ROUTE 3: VERIFY TOKEN ────────────────────────────
app.get('/api/auth/verify', verifyToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// ─── ROUTE 4: LOGOUT ──────────────────────────────────
app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// ─── ROUTE 5: GET ALL USERS (HOD/Principal/Chairman only) ──
app.get('/api/users', verifyToken, (req, res) => {
    const allowedRoles = ['HOD', 'Principal', 'Chairman'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    const db = readDB();
    const safeUsers = db.users.map(u => ({
        ...u,
        password: undefined
    }));
    res.json(safeUsers);
});

// ─── ROUTE 6: SAVE INTERVENTION ──────────────────────
app.post('/api/interventions', verifyToken, (req, res) => {
    const allowedRoles = ['Mentor', 'HOD', 'Subject Teacher'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    const db = readDB();
    const intervention = {
        id: Date.now(),
        studentId: req.body.studentId,
        studentName: req.body.studentName,
        type: req.body.type,
        note: req.body.note,
        createdBy: req.user.name,
        createdByRole: req.user.role,
        status: 'Active',
        createdAt: new Date().toISOString()
    };
    db.interventions.push(intervention);
    writeDB(db);
    res.json({ success: true, intervention });
});

// ─── ROUTE 7: GET INTERVENTIONS ──────────────────────
app.get('/api/interventions', verifyToken, (req, res) => {
    const db = readDB();
    res.json(db.interventions);
});

// ─── ROUTE 8: SEND PARENT ALERT ──────────────────────
app.post('/api/alerts/parent', verifyToken, (req, res) => {
    const db = readDB();
    const alert = {
        id: Date.now(),
        studentId: req.body.studentId,
        studentName: req.body.studentName,
        message: req.body.message,
        sentBy: req.user.name,
        sentAt: new Date().toISOString(),
        type: 'Parent Alert'
    };
    db.alerts.push(alert);
    writeDB(db);
    res.json({ success: true, alert });
});

// ─── ROUTE 9: AI CHAT via OLLAMA (Local Llama) ───────
app.post('/api/ai/chat', verifyToken, async (req, res) => {
    const { systemPrompt, userMessage } = req.body;

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.2',
                prompt: `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`,
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 300
                }
            })
        });

        const data = await response.json();
        res.json({ success: true, response: data.response });

    } catch (error) {
        // Ollama not running — send fallback response
        res.json({
            success: true,
            response: "I'm analyzing your academic profile. Based on the data available, I recommend focusing on consistent attendance and early revision. Please speak with your mentor for personalized guidance.",
            fallback: true
        });
    }
});

// ─── ROUTE 10: AI DROPOUT ANALYSIS ───────────────────
app.post('/api/ai/dropout-analysis', verifyToken, async (req, res) => {
    const { studentData } = req.body;

    const prompt = `You are Campus Copilot AI, an academic risk analyst for Chennai Institute of Technology.

Analyze this student and give a dropout risk report:
Student: ${studentData.name}, ${studentData.year} year, ${studentData.department}
Attendance: ${studentData.attendance}%
IAT Total: ${studentData.iatTotal}/100
LMS Activity: ${studentData.lmsActivity}/100
Hackathon Wins: ${studentData.hackathonWins}
Late Submissions: ${studentData.lateSubmissions}
Current Status: ${studentData.status}
Pattern: ${studentData.persona}

Provide:
1. Dropout probability percentage
2. Top 3 root causes
3. 4-week intervention plan
4. What NOT to do
5. Opening line for mentor to say

Keep response under 350 words.`;

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.2',
                prompt,
                stream: false,
                options: { temperature: 0.7, num_predict: 500 }
            })
        });

        const data = await response.json();
        res.json({ success: true, analysis: data.response });

    } catch (error) {
        res.json({
            success: true,
            analysis: `Dropout Risk Analysis for ${studentData.name}:\n\nRisk Level: ${studentData.status}\nPrimary concern: Attendance at ${studentData.attendance}% requires immediate attention.\n\nRecommendation: Schedule mentor meeting this week. Focus on attendance recovery and IAT preparation.`,
            fallback: true
        });
    }
});

// ─── START SERVER ─────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🏛️  CampusIQ Platform API Running`);
    console.log(`📡  API: http://localhost:${PORT}`);
    console.log(`🤖  AI:  http://localhost:11434 (Ollama)`);
    console.log(`\nRoutes available:`);
    console.log(`  POST /api/auth/login`);
    console.log(`  GET  /api/auth/verify`);
    console.log(`  POST /api/ai/chat`);
    console.log(`  POST /api/ai/dropout-analysis`);
    console.log(`  POST /api/interventions`);
    console.log(`  POST /api/alerts/parent\n`);
});