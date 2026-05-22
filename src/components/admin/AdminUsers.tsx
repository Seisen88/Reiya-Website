import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Users,
  Loader2,
  RefreshCw,
  Check,
  Calendar,
  Plus,
  Search,
  X,
} from "lucide-react";

export interface ProfileRow {
  uuid: string;
  role: string;
  subscription_ends_at: string | null;
  username?: string | null;
  device_label?: string | null;
  device_last_seen_at?: string | null;
}

export interface CreatedUser {
  uuid: string;
  role: string;
  subscription_ends_at: string;
  username?: string | null;
}

const SUBSCRIPTION_PRESETS = [
  { days: 30, label: "30 Days (Standard)" },
  { days: 90, label: "90 Days (Quarterly)" },
  { days: 180, label: "180 Days (Half Year)" },
  { days: 365, label: "365 Days (Annual)" },
  { days: 365000, label: "Lifetime" },
];

const SUPABASE_REST = "https://vranqahyvqlraksqsffp.supabase.co/rest/v1";

function formatExpiry(iso: string | null, role: string): string {
  if (role === "admin") return "No expiry (admin)";
  if (!iso) return "Not set";
  try {
    const d = new Date(iso);
    if (d.getFullYear() > 2100) return "Lifetime";
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function isActive(row: ProfileRow): boolean {
  if (row.role === "admin") return true;
  if (!row.subscription_ends_at) return false;
  return new Date(row.subscription_ends_at) > new Date();
}

interface AdminUsersProps {
  adminKey: string;
  toast: (msg: string, type?: "success" | "info" | "error") => void;
  onUnauthorized: () => void;
}

export default function AdminUsers({ adminKey, toast, onUnauthorized }: AdminUsersProps) {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [subscriptionDays, setSubscriptionDays] = useState(30);
  const [usernameInput, setUsernameInput] = useState("");
  const [copied, setCopied] = useState<{ id: string; ends: string } | null>(null);

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      // Fetch profiles
      const pResp = await fetch(`${SUPABASE_REST}/profiles?select=uuid,role,subscription_ends_at,username&order=uuid.asc`, {
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
        },
      });
      if (pResp.status === 401) {
        onUnauthorized();
        return;
      }
      if (!pResp.ok) throw new Error(`Profiles fetch failed: ${pResp.statusText}`);
      const profilesData = await pResp.json().catch(() => []);

      // Fetch user sessions
      const sResp = await fetch(`${SUPABASE_REST}/user_sessions?select=user_uuid,device_label,last_seen_at`, {
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
        },
      });
      if (sResp.status === 401) {
        onUnauthorized();
        return;
      }
      const sessionsData = sResp.ok ? await sResp.json().catch(() => []) : [];

      const sessionMap = new Map();
      for (const s of sessionsData) {
        sessionMap.set(s.user_uuid, s);
      }

      const merged: ProfileRow[] = profilesData.map((p: any) => {
        const session = sessionMap.get(p.uuid);
        return {
          ...p,
          device_label: session ? session.device_label : null,
          device_last_seen_at: session ? session.last_seen_at : null,
        };
      });

      setProfiles(merged);
    } catch (e: any) {
      toast(e.message || String(e), "error");
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [adminKey, toast, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const generateRandomId = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "u";
    for (let i = 0; i < 12; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  const handleCreateUser = async () => {
    setUserLoading(true);
    try {
      const newId = generateRandomId();
      const date = new Date();
      date.setDate(date.getDate() + subscriptionDays);
      const endsAt = date.toISOString();

      const body: any = {
        uuid: newId,
        role: "user",
        subscription_ends_at: endsAt,
      };
      if (usernameInput.trim()) {
        body.username = usernameInput.trim();
      }

      const resp = await fetch(`${SUPABASE_REST}/profiles`, {
        method: "POST",
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(body),
      });

      if (resp.status === 401) {
        onUnauthorized();
        return;
      }

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        throw new Error(`Create user failed (${resp.status}): ${body}`);
      }

      await navigator.clipboard.writeText(newId);
      setCopied({ id: newId, ends: endsAt });
      setUsernameInput("");
      setTimeout(() => setCopied(null), 8000);
      toast(`User created with ${subscriptionDays === 365000 ? "lifetime" : `${subscriptionDays}-day`} subscription.`, "success");
      await load();
    } catch (e: any) {
      toast(e.message || String(e), "error");
    } finally {
      setUserLoading(false);
    }
  };

  const handleRenew = async (uuid: string, days: number) => {
    setRenewingId(uuid);
    try {
      // Fetch profile first to see subscription ends date
      const pResp = await fetch(`${SUPABASE_REST}/profiles?uuid=eq.${uuid}&select=role,subscription_ends_at`, {
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
        },
      });
      if (pResp.status === 401) {
        onUnauthorized();
        return;
      }
      if (!pResp.ok) throw new Error("Could not fetch user profile details.");
      const rows = await pResp.json().catch(() => []);
      const profile = rows[0];
      if (!profile) throw new Error("User not found.");
      if (profile.role === "admin") throw new Error("Admin accounts do not use subscriptions.");

      const currentEnds = profile.subscription_ends_at;
      const base = (currentEnds && new Date(currentEnds) > new Date()) ? new Date(currentEnds) : new Date();
      base.setDate(base.getDate() + days);
      const endsAt = base.toISOString();

      const resp = await fetch(`${SUPABASE_REST}/profiles?uuid=eq.${uuid}`, {
        method: "PATCH",
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          subscription_ends_at: endsAt,
        }),
      });

      if (resp.status === 401) {
        onUnauthorized();
        return;
      }

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        throw new Error(`Renew subscription failed (${resp.status}): ${body}`);
      }

      toast(`Subscription extended by ${days} days.`, "success");
      await load();
    } catch (e: any) {
      toast(e.message || String(e), "error");
    } finally {
      setRenewingId(null);
    }
  };

  const handleResetMachineId = async (uuid: string) => {
    if (!window.confirm("Are you sure you want to reset this user's machine ID? This will allow them to register a new PC.")) {
      return;
    }
    setResettingId(uuid);
    try {
      const resp = await fetch(`${SUPABASE_REST}/user_sessions?user_uuid=eq.${uuid}`, {
        method: "DELETE",
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
        },
      });

      if (resp.status === 401) {
        onUnauthorized();
        return;
      }

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        throw new Error(`Reset machine ID failed (${resp.status}): ${body}`);
      }

      toast("Machine ID reset successfully.", "success");
      await load();
    } catch (e: any) {
      toast(e.message || String(e), "error");
    } finally {
      setResettingId(null);
    }
  };

  const regularUsers = profiles.filter((p) => p.role !== "admin");
  const activeCount = profiles.filter(isActive).length;
  const expiredCount = regularUsers.filter((p) => !isActive(p)).length;

  const filteredProfiles = userSearch.trim()
    ? profiles.filter((p) => {
        const q = userSearch.toLowerCase();
        const status = p.role === "admin" ? "admin" : isActive(p) ? "active" : "expired";
        return (
          p.uuid.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          status.includes(q) ||
          (p.device_label && p.device_label.toLowerCase().includes(q)) ||
          (p.username && p.username.toLowerCase().includes(q))
        );
      })
    : profiles;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2a2a2a] flex items-center justify-center border border-[#3a3a3a]">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">Users & subscriptions</h1>
            <p className="text-[11px] text-[#6a6a6a]">
              {profiles.length} accounts · {activeCount} active · {expiredCount} expired (non-admin)
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

      {/* Generator Section */}
      <div className="bg-[#161616]/40 border border-[#2a2a2a]/60 rounded-xl p-5 backdrop-blur-sm">
        <h2 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
          <UserPlus size={16} className="text-brand-redLight" />
          Generate new user
        </h2>
        <p className="text-xs text-[#a0a0a0] mb-4 max-w-2xl font-medium leading-relaxed">
          Each new User ID includes a subscription period. When it ends, the user cannot sign in until you renew it here.
        </p>

        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">
              Username (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. john_doe"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="bg-[#1c1c1c] border border-[#2a2a2a]/60 rounded-lg px-3 py-1.5 text-xs text-white outline-none min-w-[160px] focus:border-brand-red/30 transition-all placeholder:text-[#4a4a4a]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">
              Subscription length
            </label>
            <select
              value={subscriptionDays}
              onChange={(e) => setSubscriptionDays(Number(e.target.value))}
              className="bg-[#1c1c1c] border border-[#2a2a2a]/60 rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer min-w-[160px]"
            >
              {SUBSCRIPTION_PRESETS.map((p) => (
                <option key={p.days} value={p.days}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreateUser}
            disabled={userLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-brand-redLight text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {userLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Generate User ID
          </button>
        </div>

        {copied && (
          <div className="flex flex-col gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-400">
            <div className="flex items-center gap-2 font-semibold">
              <Check size={14} />
              <span>
                <code className="font-mono bg-black/30 px-1.5 py-0.5 rounded border border-white/5 text-white">{copied.id}</code> — copied to clipboard
              </span>
            </div>
            <div className="text-[10px] text-[#6a6a6a] flex items-center gap-1">
              <Calendar size={12} />
              Expires: {formatExpiry(copied.ends, "user")}
            </div>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="bg-[#161616]/40 border border-[#2a2a2a]/60 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="px-4 py-3 border-b border-[#2a2a2a]/60 flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            All users
            {userSearch && (
              <span className="ml-2 text-[10px] text-[#6a6a6a] font-semibold lowercase">
                ({filteredProfiles.length} of {profiles.length} matching)
              </span>
            )}
          </span>

          {/* Search bar */}
          <div className="relative w-56">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a6a]" />
            <input
              placeholder="Search users…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-[#2a2a2a]/60 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white outline-none focus:border-brand-red/30 transition-all placeholder:text-[#6a6a6a]"
            />
            {userSearch && (
              <button
                onClick={() => setUserSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a6a6a] hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-[#6a6a6a] p-10 justify-center">
            <Loader2 size={16} className="animate-spin" />
            Loading users…
          </div>
        ) : filteredProfiles.length === 0 ? (
          <p className="p-4 text-xs text-[#6a6a6a] italic text-center">
            {userSearch ? `No users matching "${userSearch}".` : "No users yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1c1c1c]/50 text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider border-b border-[#2a2a2a]/40">
                  {["User ID", "Username", "Role", "Status", "Device", "Expires", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]/30">
                {filteredProfiles.map((row) => {
                  const active = isActive(row);
                  return (
                    <tr key={row.uuid} className="hover:bg-white/5 transition-colors duration-150">
                      <td className="px-4 py-3">
                        <code className="font-mono text-[10px] text-white bg-black/20 px-1.5 py-0.5 rounded border border-white/5">
                          {row.uuid}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        {row.username ? (
                          <code className="font-mono text-[10px] text-white bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                            {row.username}
                          </code>
                        ) : (
                          <span className="text-[#555] italic">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#a0a0a0] font-semibold">{row.role}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded ${
                            row.role === "admin"
                              ? "bg-brand-red/10 border border-brand-red/20 text-brand-redLight"
                              : active
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                              : "bg-red-500/10 border border-red-500/20 text-red-400"
                          }`}
                        >
                          {row.role === "admin" ? "Admin" : active ? "Active" : "Expired"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.device_label ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-white">{row.device_label}</span>
                            {row.device_last_seen_at && (
                              <span className="text-[10px] text-[#6a6a6a] font-medium">
                                {(() => {
                                  try {
                                    return new Date(row.device_last_seen_at).toLocaleString();
                                  } catch {
                                    return row.device_last_seen_at;
                                  }
                                })()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#6a6a6a] italic text-[11px] font-medium">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#a0a0a0] font-semibold">
                        {formatExpiry(row.subscription_ends_at, row.role)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {row.role !== "admin" && (
                            <>
                              {[30, 90, 365000].map((d) => (
                                <button
                                  key={d}
                                  disabled={renewingId === row.uuid || resettingId === row.uuid}
                                  onClick={() => handleRenew(row.uuid, d)}
                                  className="px-2 py-1 bg-[#202020] hover:bg-[#2d2d2d] border border-[#2a2a2a] hover:border-brand-red/30 rounded text-[10px] font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center min-w-[36px]"
                                >
                                  {renewingId === row.uuid ? (
                                    <Loader2 size={10} className="animate-spin" />
                                  ) : d === 365000 ? (
                                    "Lifetime"
                                  ) : (
                                    `+${d}d`
                                  )}
                                </button>
                              ))}
                            </>
                          )}
                          {row.device_label && (
                            <button
                              disabled={renewingId === row.uuid || resettingId === row.uuid}
                              onClick={() => handleResetMachineId(row.uuid)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {resettingId === row.uuid ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <RefreshCw size={10} />
                              )}
                              Reset ID
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
