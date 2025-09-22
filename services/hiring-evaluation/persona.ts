export type PersonaKey = 'hr' | 'technical' | 'design' | 'finance' | 'ceo' | 'team';

export type PersonaNameMap = Record<PersonaKey, string>;

export const personaNameMap: PersonaNameMap = {
  hr: 'HR Manager',
  technical: 'Director of Engineering',
  design: 'Director of Design',
  finance: 'Finance Director',
  ceo: 'CEO',
  team: 'Senior Product Manager',
};

export function getPersonaDisplayName(persona: PersonaKey | null | undefined): string {
  if (!persona) {
    return 'Unknown';
  }
  return personaNameMap[persona] ?? 'Unknown';
}


