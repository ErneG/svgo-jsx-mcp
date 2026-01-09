"use client";

import { useState } from "react";
import { Plus, Copy, Check, Trash2, ToggleLeft, ToggleRight, Key, Loader2 } from "lucide-react";
import {
  useApiKeys,
  useCreateApiKey,
  useUpdateApiKey,
  useDeleteApiKey,
} from "@/hooks/use-api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ApiKeysPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(100);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: keys, isLoading, error } = useApiKeys();
  const createMutation = useCreateApiKey();
  const updateMutation = useUpdateApiKey();
  const deleteMutation = useDeleteApiKey();

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateKey = async () => {
    await createMutation.mutateAsync({
      name: newKeyName || undefined,
      rateLimit: newKeyRateLimit,
    });
    setShowCreate(false);
    setNewKeyName("");
    setNewKeyRateLimit(100);
  };

  const handleToggleKey = async (id: string, enabled: boolean) => {
    await updateMutation.mutateAsync({ id, data: { enabled: !enabled } });
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;
    await deleteMutation.mutateAsync(id);
  };

  if (error) {
    return (
      <Card className="border-[rgb(var(--destructive))]">
        <CardHeader>
          <CardTitle className="text-[rgb(var(--destructive))]">Error</CardTitle>
          <CardDescription>Failed to load API keys. Please try again.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-[rgb(var(--muted-foreground))]">
            Manage your API keys for authentication
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key to authenticate your requests.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="My App"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rateLimit">Rate Limit (requests/min)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={newKeyRateLimit}
                  onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value) || 100)}
                  min={1}
                  max={10000}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey} loading={createMutation.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Key className="h-4 w-4" />
            Your API Keys
          </CardTitle>
          <CardDescription>
            Use these keys to authenticate API requests. Keep them secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : keys && keys.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name || "Unnamed"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="relative rounded bg-[rgb(var(--muted))] px-[0.3rem] py-[0.2rem] font-mono text-sm">
                          {key.key.slice(0, 12)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyKey(key.key)}
                          aria-label="Copy API key"
                        >
                          {copiedKey === key.key ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{key.rateLimit}/min</TableCell>
                    <TableCell>
                      <Badge variant={key.enabled ? "success" : "destructive"}>
                        {key.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[rgb(var(--muted-foreground))]">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleKey(key.id, key.enabled)}
                          disabled={updateMutation.isPending}
                          aria-label={key.enabled ? "Disable key" : "Enable key"}
                        >
                          {key.enabled ? (
                            <ToggleRight className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[rgb(var(--destructive))] hover:text-[rgb(var(--destructive))] hover:bg-[rgb(var(--destructive))]/10"
                          onClick={() => handleDeleteKey(key.id)}
                          disabled={deleteMutation.isPending}
                          aria-label="Delete key"
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Key className="h-12 w-12 text-[rgb(var(--muted-foreground))] mb-4" />
              <h3 className="text-lg font-medium">No API keys yet</h3>
              <p className="text-[rgb(var(--muted-foreground))] mb-4">
                Create your first API key to get started.
              </p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
