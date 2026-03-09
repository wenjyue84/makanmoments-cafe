import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getBlogPosts } from "@/lib/blog";
import { PostCard } from "@/components/blog/post-card";
import { FeaturedPost } from "@/components/blog/featured-post";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = await getBlogPosts(locale);

  const [featuredPost, ...otherPosts] = posts;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {posts.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          {t("noPosts")}
        </p>
      ) : (
        <>
          <div className="mb-10">
            <FeaturedPost post={featuredPost} />
          </div>

          {otherPosts.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {otherPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
