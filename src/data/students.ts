export interface Student {
  id: string;
  name: string;
  department: string;
  year: number;
  attendance: number;
  iat1: number;
  iat2: number;
  model: number;
  hackathonWins: number;
  lateSubmissions: number;
  status: "Safe" | "Critical" | "Observation" | "At-Risk";
  persona: string;
  badges: string[];
  // New fields
  lmsActivity: number;
  labAttendance: number;
  theoryAttendance: number;
  weeklyAttendance: number[];
  cgpa: number;
  competitionCount: number;
  pulseScore: number;
  weekTriggered: number;
  interventionStatus: "None" | "Pending" | "Active" | "Resolved";
  driftType: "None" | "Lab Drift" | "Theory Drift" | "Critical Risk" | "Burnout";
  reasoningNote: string;
}

const firstNames = [
  "Arun","Priya","Sanjay","Deepak","Meera","Karthik","Anitha","Rahul","Sneha","Vignesh",
  "Lakshmi","Arjun","Divya","Mohan","Kavya","Surya","Nithya","Vijay","Pooja","Ganesh",
  "Revathi","Prasad","Sowmya","Harish","Janani","Ravi","Sangeetha","Manoj","Abinaya","Suresh",
  "Keerthana","Rajesh","Pavithra","Saravanan","Bhavani","Dinesh","Gayathri","Ashwin","Madhumitha","Senthil",
  "Dharani","Naveen","Swathi","Balaji","Ramya","Gokul","Thenmozhi","Kiran","Aishwarya","Sathish",
];

const lastInitials = ["K.","D.","R.","V.","J.","S.","B.","G.","M.","P.","L.","A.","N.","T.","H."];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generateWeeklyAttendance(status: string, baseAttendance: number, rand: () => number): number[] {
  const weeks: number[] = [];
  if (status === "Safe") {
    let val = Math.min(95, baseAttendance + 10 + rand() * 5);
    for (let i = 0; i < 8; i++) {
      val = Math.max(75, val + (rand() * 6 - 3));
      weeks.push(Math.round(val));
    }
  } else if (status === "At-Risk") {
    let val = 78 + rand() * 5;
    for (let i = 0; i < 8; i++) {
      val = val - rand() * 2.5;
      weeks.push(Math.round(Math.max(60, val)));
    }
  } else if (status === "Critical") {
    let val = 82 + rand() * 5;
    for (let i = 0; i < 8; i++) {
      const drop = i >= 3 ? rand() * 8 : rand() * 2;
      val = val - drop;
      weeks.push(Math.round(Math.max(40, val)));
    }
  } else {
    // Observation
    let val = 74 + rand() * 5;
    for (let i = 0; i < 8; i++) {
      val = val + (rand() * 4 - 2);
      weeks.push(Math.round(Math.max(55, Math.min(90, val))));
    }
  }
  return weeks;
}

function computepulseScore(attendance: number, iatTotal: number, lmsActivity: number, model: number, hackathonWins: number): number {
  const score = Math.round(
    (attendance / 100) * 30 +
    (iatTotal / 100) * 25 +
    (lmsActivity / 100) * 20 +
    (model / 100) * 15 +
    Math.min(hackathonWins * 5, 10)
  );
  return Math.max(0, Math.min(100, score));
}

function computeDriftType(labAttendance: number, theoryAttendance: number, attendance: number, lmsActivity: number, iatTotal: number): Student["driftType"] {
  if (labAttendance < 65 && theoryAttendance >= 75) return "Lab Drift";
  if (theoryAttendance < 65 && labAttendance >= 75) return "Theory Drift";
  if (labAttendance < 60 && theoryAttendance < 60) return "Critical Risk";
  if (attendance < 75 && lmsActivity > 70 && iatTotal < 50) return "Burnout";
  return "None";
}

function computeReasoningNote(
  driftType: string, labAttendance: number, theoryAttendance: number,
  lmsActivity: number, iatTotal: number, hackathonWins: number,
  attendance: number, weekTriggered: number, pulseScore: number
): string {
  if (driftType === "Lab Drift") return `Attendance drops specifically on lab days (${labAttendance}% lab vs ${theoryAttendance}% theory). Possible disengagement from practical work.`;
  if (driftType === "Theory Drift") return `Theory attendance critically low (${theoryAttendance}%) despite lab regularity (${labAttendance}%). Lecture disengagement suspected.`;
  if (driftType === "Critical Risk") return `Both lab (${labAttendance}%) and theory (${theoryAttendance}%) attendance are below 60%. Multi-dimensional dropout risk.`;
  if (driftType === "Burnout") return `High LMS activity (${lmsActivity}) but low IAT scores (${iatTotal}/100) suggest cramming without retention. Risk of burnout.`;
  if (hackathonWins > 2 && iatTotal < 50) return `Strong competition performer (${hackathonWins} wins) but theory scores lagging (${iatTotal}/100). Theory-Bridge intervention recommended.`;
  if (attendance < 65) return `Attendance critically low at ${attendance}%. Flagged in Week ${weekTriggered}. Immediate mentor contact required.`;
  return `Performance stable. Campus Pulse Score: ${pulseScore}/100.`;
}

function computeStatus(attendance: number, iatTotal: number, hackathonWins: number): { status: Student["status"]; persona: string; badges: string[] } {
  const isCritical = attendance < 70 || iatTotal < 50;
  const badges: string[] = [];
  if (isCritical && hackathonWins > 2) {
    badges.push("Technical Talent");
    return { status: "Observation", persona: "Technical Star", badges };
  }
  if (isCritical) {
    if (attendance < 65) return { status: "Critical", persona: "High Risk", badges };
    if (iatTotal < 35) return { status: "Critical", persona: "Academic Risk", badges };
    return { status: "Critical", persona: "Attendance Risk", badges };
  }
  if (attendance < 75) return { status: "At-Risk", persona: "Attendance Slider", badges };
  if (iatTotal > 85) { badges.push("Top Performer"); return { status: "Safe", persona: "Topper", badges }; }
  if (hackathonWins >= 2) { badges.push("Hackathon Star"); return { status: "Safe", persona: "Peer Mentor", badges }; }
  return { status: "Safe", persona: "Steady", badges };
}

function computeWeekTriggered(weeklyAttendance: number[]): number {
  const idx = weeklyAttendance.findIndex(w => w < 75);
  return idx === -1 ? 8 : idx + 1;
}

function computeInterventionStatus(status: Student["status"], driftType: string): Student["interventionStatus"] {
  if (status === "Critical") return "Pending";
  if (driftType !== "None") return "Active";
  if (status === "At-Risk") return "Active";
  return "None";
}

export function generateStudents(): Student[] {
  const rand = seededRandom(42);
  const students: Student[] = [];

  const docData: Array<Omit<Student, "status"|"persona"|"badges"|"pulseScore"|"driftType"|"reasoningNote"|"weekTriggered"|"weeklyAttendance"|"interventionStatus">> = [
    { id:"CIT01", name:"Arun Kumar",   department:"AI & DS", year:3, attendance:68.5, iat1:22, iat2:18, model:42, hackathonWins:0, lateSubmissions:4, lmsActivity:45, labAttendance:55, theoryAttendance:72, cgpa:5.8, competitionCount:0 },
    { id:"CIT02", name:"Priya D.",     department:"AI & DS", year:3, attendance:72.0, iat1:15, iat2:12, model:35, hackathonWins:5, lateSubmissions:5, lmsActivity:80, labAttendance:70, theoryAttendance:73, cgpa:6.2, competitionCount:6 },
    { id:"CIT03", name:"Sanjay R.",    department:"AI & DS", year:3, attendance:88.0, iat1:48, iat2:45, model:92, hackathonWins:2, lateSubmissions:0, lmsActivity:78, labAttendance:90, theoryAttendance:87, cgpa:8.9, competitionCount:3 },
    { id:"CIT04", name:"Deepak V.",    department:"AI & DS", year:3, attendance:71.2, iat1:38, iat2:40, model:78, hackathonWins:1, lateSubmissions:1, lmsActivity:62, labAttendance:68, theoryAttendance:73, cgpa:7.1, competitionCount:1 },
    { id:"CIT05", name:"Meera J.",     department:"AI & DS", year:3, attendance:65.0, iat1:10, iat2:15, model:30, hackathonWins:0, lateSubmissions:8, lmsActivity:30, labAttendance:58, theoryAttendance:70, cgpa:4.5, competitionCount:0 },
    { id:"CIT06", name:"Karthik S.",   department:"AI & DS", year:3, attendance:95.0, iat1:49, iat2:50, model:98, hackathonWins:3, lateSubmissions:0, lmsActivity:95, labAttendance:96, theoryAttendance:94, cgpa:9.5, competitionCount:4 },
    { id:"CIT07", name:"Anitha B.",    department:"AI & DS", year:3, attendance:74.5, iat1:20, iat2:22, model:45, hackathonWins:4, lateSubmissions:2, lmsActivity:72, labAttendance:62, theoryAttendance:82, cgpa:6.0, competitionCount:5 },
    { id:"CIT08", name:"Rahul G.",     department:"AI & DS", year:3, attendance:69.8, iat1:30, iat2:28, model:55, hackathonWins:0, lateSubmissions:3, lmsActivity:50, labAttendance:65, theoryAttendance:73, cgpa:6.3, competitionCount:0 },
    { id:"CIT09", name:"Sneha M.",     department:"AI & DS", year:3, attendance:82.0, iat1:35, iat2:33, model:70, hackathonWins:1, lateSubmissions:1, lmsActivity:70, labAttendance:80, theoryAttendance:83, cgpa:7.4, competitionCount:2 },
    { id:"CIT10", name:"Vignesh P.",   department:"AI & DS", year:3, attendance:70.5, iat1:12, iat2:10, model:28, hackathonWins:0, lateSubmissions:6, lmsActivity:35, labAttendance:65, theoryAttendance:74, cgpa:4.8, competitionCount:0 },
  ];

  for (const d of docData) {
    const iatTotal = d.iat1 + d.iat2;
    const { status, persona, badges } = computeStatus(d.attendance, iatTotal, d.hackathonWins);
    const pulseScore = computepulseScore(d.attendance, iatTotal, d.lmsActivity, d.model, d.hackathonWins);
    const weeklyAttendance = generateWeeklyAttendance(status, d.attendance, seededRandom(d.id.charCodeAt(3)));
    const weekTriggered = computeWeekTriggered(weeklyAttendance);
    const driftType = computeDriftType(d.labAttendance, d.theoryAttendance, d.attendance, d.lmsActivity, iatTotal);
    const reasoningNote = computeReasoningNote(driftType, d.labAttendance, d.theoryAttendance, d.lmsActivity, iatTotal, d.hackathonWins, d.attendance, weekTriggered, pulseScore);
    const interventionStatus = computeInterventionStatus(status, driftType);
    students.push({ ...d, status, persona, badges, pulseScore, weeklyAttendance, weekTriggered, driftType, reasoningNote, interventionStatus });
  }

  const departments = ["AI & DS","AI & DS","AI & DS","CSE","CSE","CSE","ECE","ECE","ECE","MECH","MECH","MECH","AI & DS","CSE","ECE"];

  for (let i = 10; i < 60; i++) {
    const id = `CIT${String(i + 1).padStart(2, "0")}`;
    const name = `${firstNames[i % firstNames.length]} ${lastInitials[Math.floor(rand() * lastInitials.length)]}`;
    const dept = departments[i % departments.length];
    const year = Math.floor(rand() * 4) + 1;
    const attendance = Math.round((55 + rand() * 42) * 10) / 10;
    const iat1 = Math.round(5 + rand() * 45);
    const iat2 = Math.round(5 + rand() * 45);
    const model = Math.round(20 + rand() * 80);
    const hackathonWins = Math.floor(rand() * 6);
    const lateSubmissions = Math.floor(rand() * 10);
    const lmsActivity = Math.round(20 + rand() * 78);
    const labAttendance = Math.round((attendance - 10 + rand() * 20) * 10) / 10;
    const theoryAttendance = Math.round((attendance - 5 + rand() * 15) * 10) / 10;
    const cgpa = Math.round((4 + rand() * 6) * 10) / 10;
    const competitionCount = Math.floor(rand() * 8);
    const iatTotal = iat1 + iat2;
    const { status, persona, badges } = computeStatus(attendance, iatTotal, hackathonWins);
    const pulseScore = computepulseScore(attendance, iatTotal, lmsActivity, model, hackathonWins);
    const weeklyAttendance = generateWeeklyAttendance(status, attendance, seededRandom(i * 17 + 3));
    const weekTriggered = computeWeekTriggered(weeklyAttendance);
    const driftType = computeDriftType(labAttendance, theoryAttendance, attendance, lmsActivity, iatTotal);
    const reasoningNote = computeReasoningNote(driftType, labAttendance, theoryAttendance, lmsActivity, iatTotal, hackathonWins, attendance, weekTriggered, pulseScore);
    const interventionStatus = computeInterventionStatus(status, driftType);
    students.push({ id, name, department: dept, year, attendance, iat1, iat2, model, hackathonWins, lateSubmissions, lmsActivity, labAttendance, theoryAttendance, cgpa, competitionCount, status, persona, badges, pulseScore, weeklyAttendance, weekTriggered, driftType, reasoningNote, interventionStatus });
  }

  return students;
}

export const students = generateStudents();

export const departmentStats = (() => {
  const depts = ["AI & DS","CSE","ECE","MECH"];
  return depts.map(dept => {
    const ds = students.filter(s => s.department === dept);
    if (ds.length === 0) return { dept, total: 0, critical: 0, safe: 0, atRisk: 0, avgPulse: 0, avgAttendance: 0, avgIAT: 0, avgLMS: 0, interventionRate: 0 };
    const critical = ds.filter(s => s.status === "Critical").length;
    const safe = ds.filter(s => s.status === "Safe").length;
    const atRisk = ds.filter(s => s.status === "At-Risk").length;
    const avgPulse = Math.round(ds.reduce((a, s) => a + s.pulseScore, 0) / ds.length);
    const avgAttendance = Math.round(ds.reduce((a, s) => a + s.attendance, 0) / ds.length * 10) / 10;
    const avgIAT = Math.round(ds.reduce((a, s) => a + s.iat1 + s.iat2, 0) / ds.length);
    const avgLMS = Math.round(ds.reduce((a, s) => a + s.lmsActivity, 0) / ds.length);
    const interventionRate = Math.round((ds.filter(s => s.interventionStatus !== "None").length / ds.length) * 100);
    return { dept, total: ds.length, critical, safe, atRisk, avgPulse, avgAttendance, avgIAT, avgLMS, interventionRate };
  });
})();

export const weeklyRiskTrend = Array.from({ length: 8 }, (_, weekIdx) => {
  let critical = 0, atRisk = 0, safe = 0;
  for (const s of students) {
    const w = s.weeklyAttendance[weekIdx] ?? s.attendance;
    if (w < 65) critical++;
    else if (w < 75) atRisk++;
    else safe++;
  }
  return { week: weekIdx + 1, critical, atRisk, safe };
});

export const conceptVideos = [
  { title: "Neural Networks Fundamentals", duration: "8 min", topic: "Deep Learning" },
  { title: "Linear Regression Recap", duration: "5 min", topic: "ML Basics" },
  { title: "Probability Distributions", duration: "6 min", topic: "Statistics" },
  { title: "Python Data Structures", duration: "7 min", topic: "Programming" },
  { title: "Gradient Descent Explained", duration: "10 min", topic: "Optimization" },
  { title: "SQL Joins Masterclass", duration: "9 min", topic: "Database" },
];
