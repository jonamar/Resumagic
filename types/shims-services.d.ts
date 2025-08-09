// Ambient module shims for excluded services during staged typing re-enable
declare module '../services/keyword-analysis.js' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const analyzeKeywords: any;
}

declare module '../services/hiring-evaluation.js' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const evaluateCandidate: any;
}


