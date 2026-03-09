"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BlogPost } from "@/types/blog";

interface PostCardProps {
  post: BlogPost;
}

export function PostCard({ post }: PostCardProps) {
  const locale = useLocale();

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
        {post.coverImage && (
          <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          </div>
        )}
        <div className="mb-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <h2 className="text-lg font-semibold group-hover:text-primary">
          {post.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {post.excerpt}
        </p>
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt}
            className="mt-3 block text-xs text-muted-foreground"
          >
            {new Date(post.publishedAt).toLocaleDateString(locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
        )}
      </article>
    </Link>
  );
}
