
export interface Chapter {
  id: number;
  sanskritName: string;
  englishName: string;
  translation: string; // Hindi translation of name
  summary: string;
  detailedUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  citations?: string[];
}

export interface StudyResource {
  title: string;
  url: string;
  description: string;
  type: 'pdf' | 'video' | 'book' | 'web';
  isFavorite?: boolean;
}

export type View = 'home' | 'chapter' | 'chat' | 'resources' | 'privacy';
