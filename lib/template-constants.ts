export type TemplateId = 'beach' | 'countryside';

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
}

export const AVAILABLE_TEMPLATES: Template[] = [
  {
    id: 'beach',
    name: 'Beach',
    description: 'Warm, beach-inspired design with ocean blues and sandy tones'
  },
  {
    id: 'countryside',
    name: 'Countryside',
    description: 'Clean, professional design with green accents and square cards'
  }
];

