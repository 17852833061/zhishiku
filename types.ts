
export interface Annotation {
  id: string;
  start: number;
  end: number;
  type: 'highlight' | 'underline';
  color: string;
  note?: string;
  text: string;
}

export interface Material {
  id: string;
  title: string;
  content: string;
  category: string;
  domain: string;
  tags: string[];
  annotations: Annotation[];
  createdAt: string;
  isKeyPoint?: boolean;
}

export interface IndexConfig {
  categories: string[];
  domains: string[];
}
