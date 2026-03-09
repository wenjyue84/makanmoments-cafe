"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PostContentProps {
  content: string;
}

export function PostContent({ content }: PostContentProps) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </article>
  );
}
