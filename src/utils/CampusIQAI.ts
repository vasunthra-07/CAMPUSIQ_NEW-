export type RiskPattern =
  | "Technical Star"
  | "Cramming Pattern"
  | "Lab Drift"
  | "Theory Drift"
  | "Critical Risk"
  | "Burnout"
  | "Steady Performer"
  | "Top Performer"
  | "Attendance Slider";

export interface CampusIQAnalysis {
  pattern: RiskPattern;
  pulseScore: number;
  riskLevel: "Critical" | "High" | "Moderate" | "Low";
  primaryTrigger: string;
  recommendation: string;
  peerMatch: string | null;
  weekTriggered: number;
  interventionType: "Theory-Bridge" | "Peer-Bridge" | "Mentor-Direct" | "Parent-Alert" | "None";
}

export function analyzeStudent(student: {
  attendance: number;
  labAttendance: number;
  theoryAttendance: number;
  iat1: number;
  iat2: number;
  model: number;
  lmsActivity: number;
  hackathonWins: number;
  lateSubmissions: number;
  competitionCount: number;
  weeklyAttendance: number[];
  pulseScore: number;
  driftType: string;
}): CampusIQAnalysis {
  const iatTotal = student.iat1 + student.iat2;
  const attendanceDrop =
    student.weeklyAttendance.length >= 2
      ? student.weeklyAttendance[0] - student.weeklyAttendance[student.weeklyAttendance.length - 1]
      : 0;
  const weekTriggered = student.weeklyAttendance.findIndex(w => w < 75) + 1 || 8;

  if (student.hackathonWins >= 3 && iatTotal < 55) {
    return {
      pattern: "Technical Star",
      pulseScore: student.pulseScore,
      riskLevel: "Moderate",
      primaryTrigger: `${student.hackathonWins} hackathon wins but IAT total only ${iatTotal}/100`,
      recommendation: "Schedule Theory-Bridge session. Pair with a subject topper for weekly revision.",
      peerMatch: "Top academic performer in same section",
      weekTriggered,
      interventionType: "Theory-Bridge",
    };
  }

  if (student.lmsActivity > 75 && iatTotal < 45 && student.attendance < 75) {
    return {
      pattern: "Cramming Pattern",
      pulseScore: student.pulseScore,
      riskLevel: "High",
      primaryTrigger: `High LMS activity (${student.lmsActivity}/100) but IAT scores low — surface-level studying detected`,
      recommendation: "Mentor intervention: shift from passive reading to active recall. Assign concept check quizzes.",
      peerMatch: null,
      weekTriggered,
      interventionType: "Mentor-Direct",
    };
  }

  if (student.labAttendance < 65 && student.theoryAttendance >= 75) {
    return {
      pattern: "Lab Drift",
      pulseScore: student.pulseScore,
      riskLevel: "High",
      primaryTrigger: `Lab attendance ${student.labAttendance}% vs theory ${student.theoryAttendance}% — disengagement from practicals`,
      recommendation: "Check lab scheduling conflicts. Assign lab peer buddy. Verify submission records.",
      peerMatch: "High lab performer in same batch",
      weekTriggered,
      interventionType: "Peer-Bridge",
    };
  }

  if (student.theoryAttendance < 65 && student.labAttendance >= 75) {
    return {
      pattern: "Theory Drift",
      pulseScore: student.pulseScore,
      riskLevel: "High",
      primaryTrigger: `Theory attendance ${student.theoryAttendance}% — possible disinterest in lectures`,
      recommendation: "Switch to concept video micro-learning. Mentor to identify root cause of theory avoidance.",
      peerMatch: null,
      weekTriggered,
      interventionType: "Theory-Bridge",
    };
  }

  if (student.attendance < 60 && iatTotal < 40) {
    return {
      pattern: "Critical Risk",
      pulseScore: student.pulseScore,
      riskLevel: "Critical",
      primaryTrigger: `Attendance ${student.attendance}% and IAT total ${iatTotal}/100 — multi-dimensional failure signal`,
      recommendation: "Immediate parent alert. HOD escalation required. Schedule emergency counseling.",
      peerMatch: null,
      weekTriggered: Math.min(weekTriggered, 3),
      interventionType: "Parent-Alert",
    };
  }

  if (attendanceDrop > 25 && student.lateSubmissions > 4) {
    return {
      pattern: "Burnout",
      pulseScore: student.pulseScore,
      riskLevel: "High",
      primaryTrigger: `Attendance dropped ${attendanceDrop}% over semester with ${student.lateSubmissions} late submissions`,
      recommendation: "Wellness check recommended. Reduce academic pressure short-term. Counselor referral.",
      peerMatch: null,
      weekTriggered,
      interventionType: "Mentor-Direct",
    };
  }

  if (student.pulseScore >= 80) {
    return {
      pattern: "Top Performer",
      pulseScore: student.pulseScore,
      riskLevel: "Low",
      primaryTrigger: "All academic indicators healthy",
      recommendation: "Nominate as Peer-Bridge mentor. Encourage competition participation.",
      peerMatch: null,
      weekTriggered: 8,
      interventionType: "None",
    };
  }

  if (student.attendance < 75 && student.attendance >= 65) {
    return {
      pattern: "Attendance Slider",
      pulseScore: student.pulseScore,
      riskLevel: "Moderate",
      primaryTrigger: `Attendance ${student.attendance}% — approaching UGC minimum threshold`,
      recommendation: "Send automated attendance warning. Schedule mentor check-in by Week 5.",
      peerMatch: null,
      weekTriggered,
      interventionType: "Mentor-Direct",
    };
  }

  return {
    pattern: "Steady Performer",
    pulseScore: student.pulseScore,
    riskLevel: "Low",
    primaryTrigger: "No anomalies detected",
    recommendation: "Continue monitoring. Standard semester tracking.",
    peerMatch: null,
    weekTriggered: 8,
    interventionType: "None",
  };
}

export function getBatchRiskSummary(students: any[]): {
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  safeCount: number;
  avgpulseScore: number;
  topPattern: RiskPattern;
  weekOneRisk: number;
} {
  const analyses = students.map(s => analyzeStudent(s));
  const patternCounts: Record<string, number> = {};
  analyses.forEach(a => { patternCounts[a.pattern] = (patternCounts[a.pattern] || 0) + 1; });
  const topPattern = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0][0] as RiskPattern;

  return {
    criticalCount: analyses.filter(a => a.riskLevel === "Critical").length,
    highCount: analyses.filter(a => a.riskLevel === "High").length,
    moderateCount: analyses.filter(a => a.riskLevel === "Moderate").length,
    safeCount: analyses.filter(a => a.riskLevel === "Low").length,
    avgpulseScore: Math.round(students.reduce((a, s) => a + s.pulseScore, 0) / students.length),
    topPattern,
    weekOneRisk: analyses.filter(a => a.weekTriggered <= 3).length,
  };
}
