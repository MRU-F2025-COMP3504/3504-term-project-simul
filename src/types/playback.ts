export type KeystrokeEvent = {
  timestamp: number;
  type: "insert" | "delete" | "select"; // vi flashbacks...
  position: { line: number; column: number };
  content?: string;
  length?: number;
};

export type Section = {
  id: string;
  videoUrl: string;
  initialCode: string;
  keystrokeEvents: KeystrokeEvent[];
  pausePoints: number[];
};
