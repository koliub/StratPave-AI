'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AI_PROVIDERS } from '@/ai/providers/meta';
import type { AiProviderId } from '@/ai/providers/types';
import { getAiSettings, saveAiCredential, setActiveAiProvider } from '@/lib/db/ai-credentials';

export default function SettingsPage() {
  const { user, loading: userLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeProvider, setActiveProvider] = useState<AiProviderId>('anthropic');
  const [configuredProviders, setConfiguredProviders] = useState<Set<string>>(new Set());
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);

  const providerMeta = AI_PROVIDERS.find(p => p.id === activeProvider);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    getAiSettings()
      .then(settings => {
        if (settings.activeProvider) setActiveProvider(settings.activeProvider as AiProviderId);
        setConfiguredProviders(new Set(settings.credentials.map(c => c.provider)));
      })
      .catch(err => {
        toast({ title: 'Failed to load AI settings', description: err.message, variant: 'destructive' });
      })
      .finally(() => setLoadingSettings(false));
  }, [user, userLoading, router, toast]);

  const alreadyConfigured = configuredProviders.has(activeProvider);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!apiKey.trim() && alreadyConfigured) {
        await setActiveAiProvider(activeProvider);
      } else {
        await saveAiCredential(activeProvider, {
          apiKey,
          model: model || undefined,
          baseUrl: baseUrl || undefined,
        });
        setConfiguredProviders(prev => new Set(prev).add(activeProvider));
      }
      setApiKey('');
      toast({ title: 'AI provider saved', description: `${providerMeta?.label} is now your active provider.` });
    } catch (err: any) {
      toast({ title: 'Failed to save', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || loadingSettings) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>AI Provider Settings</CardTitle>
          <CardDescription>
            Choose which AI provider generates your roadmaps, and supply your own API key for it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={activeProvider} onValueChange={v => setActiveProvider(v as AiProviderId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                    {configuredProviders.has(p.id) ? ' (configured)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder={configuredProviders.has(activeProvider) ? 'Leave blank to keep the saved key' : 'sk-...'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
          </div>

          {providerMeta?.needsModel && (
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder={activeProvider === 'openrouter' ? 'openai/gpt-4o-mini' : 'model-name'}
                value={model}
                onChange={e => setModel(e.target.value)}
              />
            </div>
          )}

          {providerMeta?.needsBaseUrl && (
            <div className="space-y-2">
              <Label htmlFor="base-url">Base URL</Label>
              <Input
                id="base-url"
                placeholder="https://api.example.com/v1"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must be an OpenAI-compatible endpoint (i.e. it serves POST {'{baseUrl}'}/chat/completions).
              </p>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving || (!apiKey.trim() && !alreadyConfigured)} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save & Activate
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
