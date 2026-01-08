"use client";

import { useState } from "react";
import { Plus, Copy, Check, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: string;
  key: string;
  name: string | null;
  enabled: boolean;
  rateLimit: number;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(100);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateKey = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName || undefined,
          rateLimit: newKeyRateLimit,
        }),
      });
      const newKey = await response.json();
      setKeys([newKey, ...keys]);
      setShowCreate(false);
      setNewKeyName("");
      setNewKeyRateLimit(100);
    } catch (error) {
      console.error("Failed to create key:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleKey = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/admin/keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      setKeys(keys.map((k) => (k.id === id ? { ...k, enabled: !enabled } : k)));
    } catch (error) {
      console.error("Failed to toggle key:", error);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;
    try {
      await fetch(`/api/admin/keys/${id}`, { method: "DELETE" });
      setKeys(keys.filter((k) => k.id !== id));
    } catch (error) {
      console.error("Failed to delete key:", error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {/* Create Key Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create API Key</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name (optional)</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="My App"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Rate Limit (req/min)</label>
                <input
                  type="number"
                  value={newKeyRateLimit}
                  onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value))}
                  min={1}
                  max={10000}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateKey}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Name</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">API Key</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Rate Limit</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Created</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {keys.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No API keys yet. Create one to get started.
                </td>
              </tr>
            ) : (
              keys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4">{key.name || "Unnamed"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-800 px-2 py-1 rounded">
                        {key.key.slice(0, 12)}...
                      </code>
                      <button
                        onClick={() => handleCopyKey(key.key)}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        {copiedKey === key.key ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">{key.rateLimit}/min</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        key.enabled
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {key.enabled ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleKey(key.id, key.enabled)}
                        className="p-2 hover:bg-gray-700 rounded"
                        title={key.enabled ? "Disable" : "Enable"}
                      >
                        {key.enabled ? (
                          <ToggleRight className="w-5 h-5 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="p-2 hover:bg-gray-700 rounded text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
