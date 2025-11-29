import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../hooks/user/useAuth";
import { userService } from "../../../lib/api/services/user.service";
import toast from "react-hot-toast";
import { ApiKey } from "../../../types/user";

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCreatedKey, setNewCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);

  const { token } = useAuth();

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getKeys();
      if (data.success) {
        setKeys(data.keys || []);
      }
    } catch {
      toast.error("Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      toast.success("API key copied to clipboard!");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const createKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    setCreating(true);
    try {
      const data = await userService.createKey(newKeyName);

      if (data.success) {
        toast.success("API key created successfully!");
        setNewCreatedKey(data.apiKey.key); // Capture raw key
        setShowCreateModal(false);
        setNewKeyName("");
        fetchKeys();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to revoke the key "${keyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await userService.revokeKey(keyId);
      toast.success("API key revoked successfully");
      fetchKeys();
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke API key");
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">🔑 API Keys</h3>
          <p className="text-slate-400 text-sm mt-1">
            Manage your API keys for accessing the UltraScraper API
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold transition-all text-sm"
        >
          + Create Key
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading keys...</div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 hover:bg-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-lg">{key.name}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-sm font-mono text-purple-300 bg-slate-900 px-3 py-1 rounded">
                      {key.key}
                    </code>
                    {/* Only show copy button if key is not masked (which it always will be for list items now) */}
                    {!key.key.includes('*') && (
                      <button
                        onClick={() => copyToClipboard(key.key, key.id)}
                        className="text-slate-400 hover:text-white transition-all px-2"
                        title="Copy to clipboard"
                      >
                        {copiedKey === key.id ? "✓" : "📋"}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt &&
                      ` • Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => revokeKey(key.id, key.name)}
                  className="ml-4 bg-red-600/20 hover:bg-red-600/30 text-red-300 px-4 py-2 rounded-lg transition-all border border-red-500/30 text-sm"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
          {keys.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">No API keys yet</p>
              <p className="text-sm mt-2">Create one to get started!</p>
            </div>
          )}
        </div>
      )}

      {/* New Key Created Modal */}
      {newCreatedKey && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-green-500/50 shadow-2xl shadow-green-900/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-xl font-bold text-white">API Key Created</h3>
              <p className="text-slate-300 text-sm mt-2">
                Please copy your key now. You won't be able to see it again!
              </p>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mb-6 break-all relative group">
              <code className="text-green-400 font-mono text-sm">{newCreatedKey}</code>
              <button
                onClick={() => copyToClipboard(newCreatedKey, 'new-key')}
                className="absolute top-2 right-2 p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copy to clipboard"
              >
                {copiedKey === 'new-key' ? "✓" : "📋"}
              </button>
            </div>

            <button
              onClick={() => setNewCreatedKey(null)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold transition-all"
            >
              I have copied it
            </button>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateModal && !newCreatedKey && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Create New API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-bold mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !creating) {
                      createKey();
                    } else if (e.key === 'Escape') {
                      setShowCreateModal(false);
                    }
                  }}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  placeholder="e.g., Production, Development"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={createKey}
                  disabled={creating || !newKeyName.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold transition-all disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKeyName("");
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}