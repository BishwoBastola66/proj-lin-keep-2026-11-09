'use client';

import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Layers, 
  Copy, 
  Check, 
  ExternalLink, 
  Loader2, 
  Tv, 
  FileCode, 
  Sparkles,
  PlaySquare,
  AlertCircle
} from 'lucide-react';
import { UnifiedEpisode, UnifiedServer, UnifiedEpisodeDetails, ProviderType } from '@/lib/anime';

interface EpisodeServersExplorerProps {
  episodes: UnifiedEpisode[];
  animeTitle: string;
  provider: ProviderType;
  initialEpisodeUrl?: string;
}

export function EpisodeServersExplorer({
  episodes,
  animeTitle,
  provider,
  initialEpisodeUrl
}: EpisodeServersExplorerProps) {
  const [selectedEpisode, setSelectedEpisode] = useState<UnifiedEpisode | null>(null);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [streamDetails, setStreamDetails] = useState<UnifiedEpisodeDetails | null>(null);
  const [selectedServer, setSelectedServer] = useState<UnifiedServer | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SUB' | 'DUB'>('ALL');
  const [episodeSearch, setEpisodeSearch] = useState('');

  // Set initial episode
  useEffect(() => {
    if (episodes.length > 0 && !selectedEpisode) {
      const match = initialEpisodeUrl
        ? episodes.find(e => e.url === initialEpisodeUrl)
        : episodes[0];
      setSelectedEpisode(match || episodes[0]);
    }
  }, [episodes, initialEpisodeUrl, selectedEpisode]);

  // Fetch episode streams whenever selected episode changes
  useEffect(() => {
    if (!selectedEpisode?.url) return;

    let isMounted = true;
    setLoadingStreams(true);
    setStreamDetails(null);
    setSelectedServer(null);

    const fetchStreams = async () => {
      try {
        const urlParam = encodeURIComponent(selectedEpisode.url);
        const res = await fetch(`/api/anime/episode?url=${urlParam}&provider=${provider}`);
        const data = await res.json();
        if (isMounted) {
          setStreamDetails(data);
          if (data.servers && data.servers.length > 0) {
            setSelectedServer(data.servers[0]);
          }
        }
      } catch (err) {
        console.error('Error loading episode streams:', err);
      } finally {
        if (isMounted) setLoadingStreams(false);
      }
    };

    fetchStreams();

    return () => {
      isMounted = false;
    };
  }, [selectedEpisode, provider]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filter episodes by search
  const filteredEpisodes = episodes.filter((ep) => {
    if (!episodeSearch.trim()) return true;
    return (
      ep.number.includes(episodeSearch.trim()) ||
      (ep.title && ep.title.toLowerCase().includes(episodeSearch.trim().toLowerCase()))
    );
  });

  // Filter servers by category
  const filteredServers = (streamDetails?.servers || []).filter((server) => {
    if (categoryFilter === 'ALL') return true;
    const cat = (server.category || '').toUpperCase();
    return cat.includes(categoryFilter);
  });

  return (
    <div className="w-full space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-indigo-400" />
            Episodes & Stream Servers
          </h3>
          <p className="text-xs text-slate-400">
            Total {episodes.length} episodes available on {provider === 'yomi' ? 'Yomi' : 'AnimeSalt'}.
          </p>
        </div>

        {/* Search episode input */}
        {episodes.length > 8 && (
          <div className="w-full sm:w-auto">
            <input
              type="text"
              value={episodeSearch}
              onChange={(e) => setEpisodeSearch(e.target.value)}
              placeholder="Filter episode # or title..."
              className="w-full sm:w-56 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Episode Grid List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>Select Episode:</span>
            <span>{filteredEpisodes.length} shown</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-1 space-y-1.5 hide-scrollbar">
            {filteredEpisodes.length > 0 ? (
              filteredEpisodes.map((ep) => {
                const isSelected = selectedEpisode?.url === ep.url;
                return (
                  <button
                    key={ep.id + '-' + ep.url}
                    onClick={() => setSelectedEpisode(ep)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs transition-all border ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md'
                        : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`px-2 py-1 rounded-md font-mono font-bold shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300'
                      }`}>
                        EP {ep.number}
                      </span>
                      <span className="truncate font-medium">
                        {ep.title || `Episode ${ep.number}`}
                      </span>
                    </div>

                    {ep.type && (
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2 px-1.5 py-0.5 rounded bg-white/5">
                        {ep.type}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs rounded-xl bg-white/[0.01] border border-white/5">
                No episodes found for this provider.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Server Extractor & Stream Details */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-5">
            {/* Episode Active Banner */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                  Active Episode
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">
                  {selectedEpisode?.title || `Episode ${selectedEpisode?.number || '1'}`}
                </h4>
              </div>

              {/* Category Filter Pills */}
              <div className="inline-flex rounded-lg p-0.5 bg-black/40 border border-white/10 text-xs">
                {(['ALL', 'SUB', 'DUB'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      categoryFilter === cat
                        ? 'bg-white/20 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Server Extraction State */}
            {loadingStreams ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Loader2 className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
                <p className="text-sm font-medium">Extracting video servers & master streams...</p>
                <p className="text-xs text-slate-500">Querying {provider === 'yomi' ? 'Yomi' : 'AnimeSalt'} extractors</p>
              </div>
            ) : filteredServers.length > 0 ? (
              <div className="space-y-4">
                {/* Server Selection Buttons */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-2">
                    Available Streaming Servers:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filteredServers.map((server, idx) => {
                      const isSelected = selectedServer?.name === server.name && selectedServer?.category === server.category;
                      return (
                        <button
                          key={server.name + idx}
                          onClick={() => setSelectedServer(server)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border-indigo-400 shadow-md glow-indigo'
                              : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Server className="w-3.5 h-3.5" />
                          <span>{server.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase ${
                            server.category === 'DUB' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                          }`}>
                            {server.category}
                          </span>
                          <span className="text-[9px] opacity-70 font-mono">
                            {server.type.toUpperCase()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Server Details & Actions */}
                {selectedServer && (
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{selectedServer.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300">
                          {selectedServer.category}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                          selectedServer.type === 'm3u8' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {selectedServer.type === 'm3u8' ? 'Direct .m3u8' : 'Iframe Embed'}
                        </span>
                      </div>
                    </div>

                    {/* Direct m3u8 stream link box */}
                    {selectedServer.streamUrl && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-medium text-slate-400">Direct Master Stream (.m3u8):</span>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-black/60 border border-white/10 text-xs font-mono text-cyan-300 break-all">
                          <span className="flex-1 truncate">{selectedServer.streamUrl}</span>
                          <button
                            onClick={() => copyToClipboard(selectedServer.streamUrl!, 'm3u8')}
                            className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white shrink-0 transition-colors"
                            title="Copy .m3u8 URL"
                          >
                            {copiedField === 'm3u8' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Headers Box */}
                    {selectedServer.headers && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-medium text-slate-400">Required Video Headers:</span>
                        <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 text-xs font-mono text-slate-300 space-y-1">
                          {Object.entries(selectedServer.headers).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between gap-2">
                              <span className="text-slate-400">{k}:</span>
                              <span className="text-indigo-300 truncate">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Intro skip timestamps */}
                    {selectedServer.intro && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 p-2 rounded-lg">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Intro Skip: <strong className="text-white">{selectedServer.intro.start}s - {selectedServer.intro.end}s</strong></span>
                      </div>
                    )}

                    {/* External Player Integration Note */}
                    <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-indigo-100">External Player Integration</p>
                        <p className="text-slate-300 text-[11px] mt-0.5">
                          Stream is ready for your external video player (<code className="font-mono text-indigo-300">/home/bishwaxyz/Player/tryembeded</code>). Copy the stream URL or pass the headers above.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Layers className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm">No streaming servers found for this episode.</p>
                <p className="text-xs text-slate-500">Try switching to the other provider ({provider === 'yomi' ? 'AnimeSalt' : 'Yomi'}).</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
