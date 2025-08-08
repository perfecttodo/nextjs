"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PomodoroWidget from "../components/PomodoroWidget";

type TestingItemStatus = "todo" | "in-progress" | "done";

interface TestingItem {
  id: string;
  name: string;
  description?: string;
  status: TestingItemStatus;
  createdAt: string;
  updatedAt: string;
}

export default function ItemsPage() {
  const [items, setItems] = useState<TestingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TestingItemStatus>("todo");

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/items", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setItems(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, status }),
    });
    if (res.ok) {
      setName("");
      setDescription("");
      setStatus("todo");
      await load();
    }
  }

  async function onDelete(id: string) {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  const stats = useMemo(() => {
    const total = items.length;
    const byStatus = {
      todo: items.filter((i) => i.status === "todo").length,
      inProgress: items.filter((i) => i.status === "in-progress").length,
      done: items.filter((i) => i.status === "done").length,
    };
    return { total, byStatus };
  }, [items]);

  return (
    <div className="font-sans max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Testing Items</h1>
        <div className="flex gap-4">
          <Link href="/pomodoro" className="underline">Pomodoro Timer</Link>
          <Link href="/" className="underline">Home</Link>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">In Progress</div>
          <div className="text-2xl font-bold">{stats.byStatus.inProgress}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Done</div>
          <div className="text-2xl font-bold">{stats.byStatus.done}</div>
        </div>
        <div className="sm:col-span-1">
          <PomodoroWidget compact={true} />
        </div>
      </section>

      <form onSubmit={onCreate} className="space-y-3 border rounded-lg p-4 sm:p-6">
        <h2 className="font-medium">Add new item</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded border px-3 py-2"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded border px-3 py-2"
          rows={3}
        />
        <div className="flex items-center gap-4">
          <label className="text-sm">Status</label>
          <select
            className="rounded border px-2 py-1"
            value={status}
            onChange={(e) => setStatus(e.target.value as TestingItemStatus)}
          >
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <button type="submit" className="rounded bg-black text-white px-4 py-2 w-full sm:w-auto">
          Create
        </button>
      </form>

      <section className="space-y-2">
        <h2 className="font-medium">Items</h2>
        {loading && <div>Loading…</div>}
        {error && <div className="text-red-600">{error}</div>}
        {items.length === 0 && !loading ? (
          <div className="text-gray-500">No items yet.</div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium break-words">{item.name}</div>
                  <div className="text-xs rounded-full border px-2 py-0.5">
                    {item.status}
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1 break-words">{item.description}</p>
                )}
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <Link className="underline" href={`/items/${item.id}`}>Edit</Link>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}


