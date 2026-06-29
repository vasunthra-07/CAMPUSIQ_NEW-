import type { DecisionRecord, DecisionStatus } from "./types";

const STORAGE_KEY = "campusiq.brain.decisions.v1";

function read(): Record<string, DecisionRecord> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export const DecisionLogService = {
  getAll: read,
  decide(recommendationId: string, status: Exclude<DecisionStatus, "Pending">, decidedBy: string): DecisionRecord {
    const records = read();
    const record: DecisionRecord = { recommendationId, status, decidedAt: new Date().toISOString(), decidedBy };
    records[recommendationId] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return record;
  },
};
