"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type TestingItemStatus = "todo" | "in-progress" | "done";

interface TestingItem {
  id: string;
  name: string;
  description?: string;
  status: TestingItemStatus;
  createdAt: string;
  updatedAt: string;
}

export default function EditItemPage() {
  const params = useParams();
  const id = (params as { id: string }).id;
  const [item, setItem] = useState<TestingItem | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TestingItemStatus>("todo");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/items/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Not found");
        return;
      }
      setItem(data);
      setName(data.name || "");
      setDescription(data.description || "");
      setStatus(data.status || "todo");
    }
    load();
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, status }),
    });
    if (res.ok) {
      history.back();
    }
  }

  if (error) {
    return (
      <div className="font-sans max-w-3xl mx-auto py-10">
        <Link href="/items" className="underline">Back</Link>
        <div className="text-red-600 mt-4">{error}</div>
      </div>
    );
  }

  if (!item) return <div className="p-8">Loading…</div>;

  return (
    <div className="font-sans max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Edit item</h1>
        <Link href="/items" className="underline">Back</Link>
      </div>

      <form onSubmit={onSave} className="space-y-3 border rounded-lg p-4 sm:p-6">
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
          Save
        </button>
      </form>
    </div>
  );
}


