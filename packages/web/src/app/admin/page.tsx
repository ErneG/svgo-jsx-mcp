import Link from "next/link";
import { Key, BarChart3, Activity } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/keys"
          className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-violet-500 transition-colors group"
        >
          <div className="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-violet-500/30 transition-colors">
            <Key className="w-6 h-6 text-violet-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">API Keys</h2>
          <p className="text-gray-400">
            Create, manage, and revoke API keys for programmatic access.
          </p>
        </Link>

        <Link
          href="/admin/stats"
          className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-violet-500 transition-colors group"
        >
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition-colors">
            <BarChart3 className="w-6 h-6 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Statistics</h2>
          <p className="text-gray-400">View usage statistics, optimization metrics, and trends.</p>
        </Link>

        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Health Status</h2>
          <p className="text-gray-400 mb-4">API and database connection status.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-400">All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
