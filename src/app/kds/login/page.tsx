"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function KdsLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/kds/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/kds");
    } else {
      setError("Invalid username or password");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-800 p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-white">Kitchen Display</h1>
        <p className="mb-8 text-sm text-gray-400">Staff login</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-lg text-white outline-none placeholder-gray-500 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-lg text-white outline-none placeholder-gray-500 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-900/40 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 py-3 text-lg font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
