import type { PersonaKey } from './persona.js';

// Lightweight keyword shape for mapping purposes
export type KeywordLike = { kw: string; [key: string]: unknown };

export interface DomainAssignments {
  hr: KeywordLike[];
  technical: KeywordLike[];
  design: KeywordLike[];
  finance: KeywordLike[];
  ceo: KeywordLike[];
  team: KeywordLike[];
}

export function getKeywordsForPersona(assignments: DomainAssignments, persona: PersonaKey): KeywordLike[] {
  switch (persona) {
  case 'hr':
    return assignments.hr;
  case 'technical':
    return assignments.technical;
  case 'design':
    return assignments.design;
  case 'finance':
    return assignments.finance;
  case 'ceo':
    return assignments.ceo;
  case 'team':
    return assignments.team;
  default:
    return [];
  }
}


