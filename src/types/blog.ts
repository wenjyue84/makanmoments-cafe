export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;       // Markdown string
  coverImage: string | null;
  tags: string[];
  language: string;      // en | ms | zh
  published: boolean;
  publishedAt: string | null;  // YYYY-MM-DD
}
