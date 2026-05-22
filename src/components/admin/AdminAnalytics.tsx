import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Users,
  Download,
  Heart,
  Gamepad2,
  Loader2,
  RefreshCw,
  Monitor,
  TrendingUp,
} from "lucide-react";

export interface AdminAnalyticsData {
  usersTotal: number;
  usersAdmin: number;
  usersRegular: number;
  activeSessions: number;
  downloadEvents: number;
  favoriteEvents: number;
  catalogues: {
    tableName: string;
    label: string;
    gameCount: number;
    totalDownloads: number;
    totalLikes: number;
  }[];
  topDownloaded: {
    title: string;
    tableName: string;
    downloadsCount: number;
    likesCount: number;
  }[];
  topFavorited: {
    title: string;
    tableName: string;
    downloadsCount: number;
    likesCount: number;
  }[];
  recentDownloads: {
    gameTitle: string;
    tableName: string;
    userId?: string;
    createdAt?: string;
  }[];
  recentFavorites: {
    gameTitle: string;
    tableName: string;
    userId?: string;
    createdAt?: string;
  }[];
  activeUsers: {
    userUuid: string;
    deviceLabel?: string;
    lastSeenAt?: string;
  }[];
}

const SUPABASE_REST = "https://vranqahyvqlraksqsffp.supabase.co/rest/v1";

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatWhen(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16);
  }
}

function tableLabel(name: string): string {
  if (name === "games") return "Standard";
  if (name === "online_games") return "Online";
  if (name === "installer_games") return "Repacks";
  return name;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accentClass?: string;
}

function StatCard({ icon, label, value, sub, accentClass = "text-brand-redLight" }: StatCardProps) {
  return (
    <div className="bg-[#161616]/40 border border-[#2a2a2a]/60 rounded-xl p-4 flex-1 min-w-[160px] backdrop-blur-sm transition-all duration-300 hover:border-[#3a3a3a]">
      <div className={`flex items-center gap-2 mb-2 ${accentClass}`}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6a6a6a]">
          {label}
        </span>
      </div>
      <div className="text-2xl font-extrabold text-white leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-[#6a6a6a] mt-2 font-medium">{sub}</div>}
    </div>
  );
}

interface DataTableProps {
  title: string;
  columns: string[];
  rows: (string | React.ReactNode)[][];
  empty: string;
}

function DataTable({ title, columns, rows, empty }: DataTableProps) {
  return (
    <div className="bg-[#161616]/40 border border-[#2a2a2a]/60 rounded-xl overflow-hidden backdrop-blur-sm">
      <div className="px-4 py-3 border-b border-[#2a2a2a]/60 text-xs font-bold text-white uppercase tracking-wider">
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-xs text-[#6a6a6a] italic">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1c1c1c]/50 text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider border-b border-[#2a2a2a]/40">
                {columns.map((c) => (
                  <th key={c} className="px-4 py-2.5">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]/30">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors duration-150">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 text-[#a0a0a0]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface AdminAnalyticsProps {
  adminKey: string;
  onUnauthorized: () => void;
}

export default function AdminAnalytics({ adminKey, onUnauthorized }: AdminAnalyticsProps) {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const restCount = async (table: string, selectCol: string, filter = ""): Promise<number> => {
    const url = `${SUPABASE_REST}/${table}?select=${selectCol}${filter ? `&${filter}` : ""}`;
    const resp = await fetch(url, {
      headers: {
        apikey: adminKey,
        Authorization: `Bearer ${adminKey}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
    });
    if (resp.status === 401) {
      onUnauthorized();
      return 0;
    }
    if (!resp.ok) return 0;
    const rangeHeader = resp.headers.get("content-range") || "0-0/0";
    const total = parseInt(rangeHeader.split("/")[1]) || 0;
    return total;
  };

  const sumCatalogueMetrics = async (table: string): Promise<{ totalDownloads: number; totalLikes: number }> => {
    let offset = 0;
    const page = 1000;
    let totalDl = 0;
    let totalLikes = 0;
    while (true) {
      const url = `${SUPABASE_REST}/${table}?select=downloads_count,likes_count`;
      const resp = await fetch(url, {
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
          Range: `${offset}-${offset + page - 1}`,
        },
      });
      if (resp.status === 401) {
        onUnauthorized();
        return { totalDownloads: 0, totalLikes: 0 };
      }
      if (!resp.ok) break;
      const rows = await resp.json().catch(() => []);
      if (!rows.length) break;
      for (const r of rows) {
        totalDl += r.downloads_count || 0;
        totalLikes += r.likes_count || 0;
      }
      if (rows.length < page) break;
      offset += page;
    }
    return { totalDownloads: totalDl, totalLikes };
  };

  const fetchTopGames = async (table: string, orderCol: string, limit = 8) => {
    const url = `${SUPABASE_REST}/${table}?select=title,downloads_count,likes_count&${orderCol}=gt.0&order=${orderCol}.desc.nullslast&limit=${limit}`;
    const resp = await fetch(url, {
      headers: {
        apikey: adminKey,
        Authorization: `Bearer ${adminKey}`,
      },
    });
    if (resp.status === 401) {
      onUnauthorized();
      return [];
    }
    if (!resp.ok) return [];
    const rows = await resp.json().catch(() => []);
    return rows.map((r: any) => ({
      title: r.title,
      tableName: table,
      downloadsCount: r.downloads_count || 0,
      likesCount: r.likes_count || 0,
    }));
  };

  const fetchTrackerRecent = async (table: string, limit = 20) => {
    const url = `${SUPABASE_REST}/${table}?select=game_title,table_name,user_id,created_at&order=created_at.desc&limit=${limit}`;
    const resp = await fetch(url, {
      headers: {
        apikey: adminKey,
        Authorization: `Bearer ${adminKey}`,
      },
    });
    if (resp.status === 401) {
      onUnauthorized();
      return [];
    }
    if (!resp.ok) {
      const urlFb = `${SUPABASE_REST}/${table}?select=game_title,table_name,user_id&limit=${limit}`;
      const respFb = await fetch(urlFb, {
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
        },
      });
      if (respFb.status === 401) {
        onUnauthorized();
        return [];
      }
      if (!respFb.ok) return [];
      const rows = await respFb.json().catch(() => []);
      return rows.map((r: any) => ({
        gameTitle: r.game_title || "Unknown",
        tableName: r.table_name || "",
        userId: r.user_id,
        createdAt: null,
      }));
    }
    const rows = await resp.json().catch(() => []);
    return rows.map((r: any) => ({
      gameTitle: r.game_title || "Unknown",
      tableName: r.table_name || "",
      userId: r.user_id,
      createdAt: r.created_at,
    }));
  };

  const fetchRoleCounts = async () => {
    const url = `${SUPABASE_REST}/profiles?select=role`;
    let offset = 0;
    const page = 1000;
    let admin = 0;
    let regular = 0;
    while (true) {
      const resp = await fetch(url, {
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
          Range: `${offset}-${offset + page - 1}`,
        },
      });
      if (resp.status === 401) {
        onUnauthorized();
        return { usersTotal: 0, usersAdmin: 0, usersRegular: 0 };
      }
      if (!resp.ok) {
        const total = await restCount("profiles", "uuid");
        return { usersTotal: total, usersAdmin: 0, usersRegular: total };
      }
      const rows = await resp.json().catch(() => []);
      if (!rows.length) break;
      for (const r of rows) {
        if (r.role === "admin") admin++;
        else regular++;
      }
      if (rows.length < page) break;
      offset += page;
    }
    return { usersTotal: admin + regular, usersAdmin: admin, usersRegular: regular };
  };

  const fetchActiveSessions = async () => {
    const url = `${SUPABASE_REST}/user_sessions?select=user_uuid,device_label,last_seen_at&order=last_seen_at.desc&limit=50`;
    const resp = await fetch(url, {
      headers: {
        apikey: adminKey,
        Authorization: `Bearer ${adminKey}`,
      },
    });
    if (resp.status === 401) {
      onUnauthorized();
      return [];
    }
    if (!resp.ok) return [];
    const rows = await resp.json().catch(() => []);
    return rows.map((r: any) => ({
      userUuid: r.user_uuid || "",
      deviceLabel: r.device_label,
      lastSeenAt: r.last_seen_at,
    }));
  };

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const [
        roleCounts,
        activeSessionsCount,
        downloadEventsCount,
        favoriteEventsCount,
        cataloguesData,
        recentDownloads,
        recentFavorites,
        activeUsers,
      ] = await Promise.all([
        fetchRoleCounts(),
        restCount("user_sessions", "user_uuid"),
        restCount("downloads_tracker", "game_id"),
        restCount("favorites_tracker", "game_id"),
        Promise.all([
          restCount("games", "id"),
          sumCatalogueMetrics("games"),
          restCount("online_games", "id"),
          sumCatalogueMetrics("online_games"),
          restCount("installer_games", "id"),
          sumCatalogueMetrics("installer_games"),
        ]),
        fetchTrackerRecent("downloads_tracker", 20),
        fetchTrackerRecent("favorites_tracker", 20),
        fetchActiveSessions(),
      ]);

      const catalogues = [
        {
          tableName: "games",
          label: "Standard catalogue",
          gameCount: cataloguesData[0],
          totalDownloads: cataloguesData[1].totalDownloads,
          totalLikes: cataloguesData[1].totalLikes,
        },
        {
          tableName: "online_games",
          label: "Online only",
          gameCount: cataloguesData[2],
          totalDownloads: cataloguesData[3].totalDownloads,
          totalLikes: cataloguesData[3].totalLikes,
        },
        {
          tableName: "installer_games",
          label: "Repacks / installers",
          gameCount: cataloguesData[4],
          totalDownloads: cataloguesData[5].totalDownloads,
          totalLikes: cataloguesData[5].totalLikes,
        },
      ];

      const [topDlGames, topFavGames] = await Promise.all([
        Promise.all([
          fetchTopGames("games", "downloads_count", 8),
          fetchTopGames("online_games", "downloads_count", 8),
          fetchTopGames("installer_games", "downloads_count", 8),
        ]),
        Promise.all([
          fetchTopGames("games", "likes_count", 8),
          fetchTopGames("online_games", "likes_count", 8),
          fetchTopGames("installer_games", "likes_count", 8),
        ]),
      ]);

      const topDownloaded = [...topDlGames[0], ...topDlGames[1], ...topDlGames[2]]
        .sort((a, b) => b.downloadsCount - a.downloadsCount)
        .slice(0, 15);

      const topFavorited = [...topFavGames[0], ...topFavGames[1], ...topFavGames[2]]
        .sort((a, b) => b.likesCount - a.likesCount)
        .slice(0, 15);

      setData({
        ...roleCounts,
        activeSessions: activeSessionsCount,
        downloadEvents: downloadEventsCount,
        favoriteEvents: favoriteEventsCount,
        catalogues,
        topDownloaded,
        topFavorited,
        recentDownloads,
        recentFavorites,
        activeUsers,
      });
    } catch (e: any) {
      setError(e.message || String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [adminKey, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const totalGames = data?.catalogues.reduce((s, c) => s + c.gameCount, 0) ?? 0;
  const totalCatalogueDownloads = data?.catalogues.reduce((s, c) => s + c.totalDownloads, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2a2a2a] flex items-center justify-center border border-[#3a3a3a]">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">Analytics</h1>
            <p className="text-[11px] text-[#6a6a6a]">
              Users, downloads, favorites, and catalogue stats from Supabase
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#202020] hover:bg-[#2d2d2d] border border-[#2a2a2a] rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center gap-2 text-xs text-[#6a6a6a] p-12 justify-center">
          <Loader2 size={16} className="animate-spin" />
          Loading analytics…
        </div>
      ) : data ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <StatCard
              icon={<Users size={14} />}
              label="Users"
              value={formatNum(data.usersTotal)}
              sub={`${data.usersAdmin} admin · ${data.usersRegular} regular`}
            />
            <StatCard
              icon={<Monitor size={14} />}
              label="Active sessions"
              value={formatNum(data.activeSessions)}
              sub="Registered devices"
              accentClass="text-emerald-400"
            />
            <StatCard
              icon={<Download size={14} />}
              label="Download events"
              value={formatNum(data.downloadEvents)}
              sub={`${formatNum(totalCatalogueDownloads)} total on catalogue`}
              accentClass="text-blue-400"
            />
            <StatCard
              icon={<Heart size={14} />}
              label="Favorite events"
              value={formatNum(data.favoriteEvents)}
              sub="Total likes tracked"
              accentClass="text-rose-400"
            />
            <StatCard
              icon={<Gamepad2 size={14} />}
              label="Games total"
              value={formatNum(totalGames)}
              sub="Across all tables"
              accentClass="text-purple-400"
            />
          </div>

          {/* Catalogue breakdown */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-extrabold text-[#6a6a6a] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={14} className="text-brand-redLight" />
              Catalogue breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {data.catalogues.map((c) => (
                <div key={c.tableName} className="bg-[#161616]/40 border border-[#2a2a2a]/60 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-xs font-bold text-white mb-3">{c.label}</div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <span className="text-[#6a6a6a] font-medium block">Games</span>
                      <div className="text-sm font-extrabold text-white mt-0.5">{formatNum(c.gameCount)}</div>
                    </div>
                    <div>
                      <span className="text-[#6a6a6a] font-medium block">Downloads</span>
                      <div className="text-sm font-extrabold text-white mt-0.5">{formatNum(c.totalDownloads)}</div>
                    </div>
                    <div>
                      <span className="text-[#6a6a6a] font-medium block">Likes</span>
                      <div className="text-sm font-extrabold text-white mt-0.5">{formatNum(c.totalLikes)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DataTable
              title="Top downloaded games"
              columns={["Game", "Source", "Downloads"]}
              rows={data.topDownloaded.map((g) => [
                <span key={g.title} className="font-semibold text-white">{g.title}</span>,
                tableLabel(g.tableName),
                formatNum(g.downloadsCount),
              ])}
              empty="No download counts yet."
            />
            <DataTable
              title="Top favorited games"
              columns={["Game", "Source", "Likes"]}
              rows={data.topFavorited.map((g) => [
                <span key={g.title} className="font-semibold text-white">{g.title}</span>,
                tableLabel(g.tableName),
                formatNum(g.likesCount),
              ])}
              empty="No likes yet."
            />
          </div>

          {/* Recent Events */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DataTable
              title="Recent downloads"
              columns={["Game", "Source", "When"]}
              rows={data.recentDownloads.map((r) => [
                r.gameTitle,
                tableLabel(r.tableName),
                formatWhen(r.createdAt),
              ])}
              empty="No tracked downloads yet."
            />
            <DataTable
              title="Recent favorites"
              columns={["Game", "Source", "When"]}
              rows={data.recentFavorites.map((r) => [
                r.gameTitle,
                tableLabel(r.tableName),
                formatWhen(r.createdAt),
              ])}
              empty="No tracked favorites yet."
            />
          </div>

          {/* Active Devices Table */}
          <DataTable
            title="Active devices (sessions)"
            columns={["User ID", "Device", "Last seen"]}
            rows={data.activeUsers.map((s) => [
              <code key={s.userUuid} className="font-mono text-[10px] text-white bg-black/20 px-1.5 py-0.5 rounded border border-white/5">{s.userUuid}</code>,
              s.deviceLabel || "—",
              formatWhen(s.lastSeenAt),
            ])}
            empty="No user sessions recorded yet."
          />
        </>
      ) : null}
    </div>
  );
}
