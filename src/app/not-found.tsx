import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-neutral-300">404</h1>
          <p className="mt-4 text-lg text-neutral-600">Page not found</p>
          <Link
            href="/en"
            className="mt-6 inline-block rounded-lg bg-orange-600 px-6 py-3 text-white hover:bg-orange-700"
          >
            Go Home
          </Link>
        </div>
      </body>
    </html>
  );
}
