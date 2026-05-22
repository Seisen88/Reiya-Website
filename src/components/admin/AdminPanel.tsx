import { useState, useEffect } from "react";
import {
  Plus,
  Save,
  Globe,
  Check,
  ShieldCheck,
  Loader2,
  Search,
  Gamepad2,
  Image,
  RefreshCw,
  Cloud,
  Database,
  Trash2,
  AlertTriangle,
  Key,
  BarChart3,
  Wrench,
  Users,
  X,
} from "lucide-react";
import AdminAnalytics from "./AdminAnalytics";
import AdminUsers from "./AdminUsers";

type AdminTab = "management" | "users" | "analytics";

const ADMIN_TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "management", label: "Management", icon: <Wrench size={14} /> },
  { id: "users", label: "Users", icon: <Users size={14} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={14} /> },
];

interface GameForm {
  title: string;
  description: string;
  genre: string;
  download_url: string;
  download_type: "direct" | "torrent";
  thumbnail_url: string;
  release_year: string;
}

const defaultForm: GameForm = {
  title: "",
  description: "",
  genre: "",
  download_url: "",
  download_type: "direct",
  thumbnail_url: "",
  release_year: "",
};

const SUPABASE_REST = "https://vranqahyvqlraksqsffp.supabase.co/rest/v1";

// ── Title cleaning helper matching Rust regex ──────────────────────────────
const GROUP_REGEX = /(?:\s*-?\s*(?:CODEX|SKIDROW|ALiAS|RUNE|TENOKE|Razor1911|DOGE|GOG|FLT|DINOByTES|Unleashed|Empress|FitGirl|DODI|CPY|RELOADED|P2P|I_KnoW|TiNYiSO|PLAZA|PROPHET|GOLDBERG|DARKSIDERS|R\.G\.\s*Mechanics|HI2U|MULTi\d+|Update\s*\d*))\s*$/i;
const EDITION_REGEX = /\s*(deluxe|ultimate|premium|game of the year|goty|complete|definitive|directors cut|anniversary|standard)\s*edition\b/gi;
const PUNCT_REGEX = /[^a-z0-9]/gi;

function cleanGameTitle(titleRaw: string): string {
  let cleaned = titleRaw.replace(GROUP_REGEX, "").trim();
  
  // Strip " Build XXXXXX" suffix
  const buildPos = cleaned.indexOf(" Build ");
  if (buildPos !== -1) {
    cleaned = cleaned.substring(0, buildPos);
  }
  
  // Strip " vX.Y.Z" suffix - only if 'v' is followed by a digit
  let cut = cleaned.length;
  for (let i = 0; i + 2 < cleaned.length; i++) {
    if (
      cleaned[i] === " " &&
      cleaned[i + 1].toLowerCase() === "v" &&
      cleaned[i + 2] >= "0" &&
      cleaned[i + 2] <= "9"
    ) {
      cut = i;
      break;
    }
  }
  return cleaned.substring(0, cut).trim();
}

function deriveDedupKey(title: string): string {
  let dedup = title.toLowerCase();
  
  // Strip parentheses, brackets, and slashes
  const parenPos = dedup.indexOf("(");
  if (parenPos !== -1) dedup = dedup.substring(0, parenPos);
  
  const bracketPos = dedup.indexOf("[");
  if (bracketPos !== -1) dedup = dedup.substring(0, bracketPos);
  
  const slashPos = dedup.indexOf("/");
  if (slashPos !== -1) dedup = dedup.substring(0, slashPos);
  
  // Strip editions
  dedup = dedup.replace(EDITION_REGEX, "");
  
  // Remove non-alphanumeric punctuation
  dedup = dedup.replace(PUNCT_REGEX, "");
  
  return dedup;
}

function deriveFilenameFromTitle(title: string): string {
  const safe = title.replace(/[<>:"\/\\|?*\x00-\x1F]/g, "_").trim();
  const truncated = safe.substring(0, 80).trim();
  return `${truncated}.download`;
}

function parseSizeToBytes(sizeStr: string): number {
  const s = sizeStr.trim().toUpperCase();
  let numStr = "";
  let unit = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if ((c >= "0" && c <= "9") || c === ".") {
      numStr += c;
    } else if (/[A-Z]/.test(c)) {
      unit += c;
    }
  }
  const num = parseFloat(numStr);
  if (isNaN(num)) return 0;
  let multiplier = 1;
  switch (unit) {
    case "KB":
    case "K":
      multiplier = 1024;
      break;
    case "MB":
    case "M":
      multiplier = 1024 * 1024;
      break;
    case "GB":
    case "G":
      multiplier = 1024 * 1024 * 1024;
      break;
    case "TB":
    case "T":
      multiplier = 1024 * 1024 * 1024 * 1024;
      break;
    default:
      multiplier = 1;
  }
  return Math.round(num * multiplier);
}

function normalizeSearchTitle(title: string): string {
  const parts = title.split(/[:\-\(\[\#]/);
  let base = parts[0].trim();
  if (base.length < 3) {
    base = title.trim();
  }
  const words = base.split(/\s+/);
  const cleaned: string[] = [];
  const stopWords = new Set([
    "repack", "fitgirl", "dodi", "onlinefix", "multiplayer",
    "crack", "crackby", "directplay", "update", "dlc",
    "premium", "ultimate", "deluxe", "standard", "gold",
    "complete", "patch", "hotfix", "build", "iso", "rip",
    "setup", "edition"
  ]);
  for (const w of words) {
    const wl = w.toLowerCase();
    if (stopWords.has(wl)) continue;
    if (wl.startsWith("v") && wl.slice(1).split(".").every(part => /^\d+$/.test(part))) {
      continue;
    }
    cleaned.push(w);
  }
  const result = cleaned.join(" ");
  return result.trim().length === 0 ? title : result;
}

function isMagnetOrTorrentUrl(url: string): boolean {
  const u = url.trim();
  return u.startsWith("magnet:") || u.toLowerCase().endsWith(".torrent");
}

function isKazumiOrXetabSource(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes("kazumi.json") || lower.includes("xetab.json");
}

function maskRawgKey(key: string): string {
  if (key.length <= 10) return "••••••••";
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

interface AdminPanelProps {
  adminKey: string;
  toast: (msg: string, type?: "success" | "info" | "error") => void;
  refreshCatalogue: () => Promise<void>;
  onUnauthorized: () => void;
}

export default function AdminPanel({ adminKey, toast, refreshCatalogue, onUnauthorized }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("management");

  // RAWG Keys state
  const [rawgKeys, setRawgKeys] = useState<string[]>([]);
  const [newRawgKey, setNewRawgKey] = useState("");
  const [savingRawgKeys, setSavingRawgKeys] = useState(false);
  const [testingRawg, setTestingRawg] = useState(false);

  // Game publish form state
  const [form, setForm] = useState<GameForm>(defaultForm);
  const [publishing, setPublishing] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [previewMeta, setPreviewMeta] = useState<{ genre: string; thumbnail_url: string } | null>(null);

  // External mirrors state
  const [remoteGames, setRemoteGames] = useState<any[]>([]);
  const [fetchingRemote, setFetchingRemote] = useState(false);
  const [syncingRemote, setSyncingRemote] = useState(false);
  const [remoteSearch, setRemoteSearch] = useState("");
  const [displayLimit, setDisplayLimit] = useState(100);

  const KAZUMI_URL = "https://raw.githubusercontent.com/Seisen88/gamejson/refs/heads/main/kazumi.json";
  const XETAB_URL = "https://raw.githubusercontent.com/Seisen88/gamejson/refs/heads/main/Xetab.json";
  const ONLINEFIX_URL = "https://raw.githubusercontent.com/Seisen88/gamejson/refs/heads/main/onlinefix.json";
  const FITGIRL_URL = "https://raw.githubusercontent.com/Seisen88/gamejson/refs/heads/main/fitgirl.json";

  const loadRawgKeys = async () => {
    if (!adminKey) return;
    try {
      const url = `${SUPABASE_REST}/app_config?key=eq.rawg_api_keys&select=value`;
      const resp = await fetch(url, {
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`
        }
      });
      if (resp.status === 401) {
        onUnauthorized();
        return;
      }
      if (!resp.ok) return;
      const rows = await resp.json().catch(() => []);
      if (rows && rows[0] && Array.isArray(rows[0].value)) {
        setRawgKeys(rows[0].value);
      } else {
        setRawgKeys([]);
      }
    } catch (e) {
      console.error("Failed to load RAWG keys:", e);
    }
  };

  useEffect(() => {
    loadRawgKeys();
    handleFetchRemote(KAZUMI_URL);
  }, [adminKey]);

  const persistRawgKeys = async (keys: string[]) => {
    if (!adminKey) return;
    setSavingRawgKeys(true);
    try {
      const updatedAt = new Date().toISOString();
      const patchUrl = `${SUPABASE_REST}/app_config?key=eq.rawg_api_keys`;
      const patchResp = await fetch(patchUrl, {
        method: "PATCH",
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          value: keys,
          updated_at: updatedAt
        })
      });

      if (patchResp.status === 401) {
        onUnauthorized();
        return;
      }

      let ok = patchResp.ok;
      if (ok) {
        const rows = await patchResp.json().catch(() => []);
        if (!rows || rows.length === 0) ok = false;
      }

      if (!ok) {
        // Try insert as fallback
        const postUrl = `${SUPABASE_REST}/app_config?on_conflict=key`;
        const postResp = await fetch(postUrl, {
          method: "POST",
          headers: {
            apikey: adminKey,
            Authorization: `Bearer ${adminKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=representation"
          },
          body: JSON.stringify([{
            key: "rawg_api_keys",
            value: keys,
            updated_at: updatedAt
          }])
        });
        if (postResp.status === 401) {
          onUnauthorized();
          return;
        }
        if (!postResp.ok) {
          const body = await postResp.text().catch(() => "");
          throw new Error(`Save failed: ${body}`);
        }
      }

      setRawgKeys(keys);
      toast("RAWG API keys saved to Supabase (all users).", "success");
    } catch (e: any) {
      toast(`Failed to save keys: ${e.message || String(e)}`, "error");
    } finally {
      setSavingRawgKeys(false);
    }
  };

  const handleAddRawgKey = async () => {
    const key = newRawgKey.trim();
    if (!key) {
      toast("Paste a RAWG API key first.", "info");
      return;
    }
    if (rawgKeys.includes(key)) {
      toast("That key is already in the list.", "info");
      return;
    }
    await persistRawgKeys([...rawgKeys, key]);
    setNewRawgKey("");
  };

  const handleRemoveRawgKey = async (key: string) => {
    await persistRawgKeys(rawgKeys.filter(k => k !== key));
  };

  const lookupGameDetails = async (title: string, customKey?: string) => {
    const keys = customKey ? [customKey] : rawgKeys;
    const cleanTitle = normalizeSearchTitle(title);

    for (const key of keys) {
      try {
        const url = `https://api.rawg.io/api/games?search=${encodeURIComponent(cleanTitle)}&key=${key}&page_size=1`;
        const resp = await fetch(url);
        if (resp.ok) {
          const data = await resp.json();
          const game = data.results && data.results[0];
          if (game) {
            const genre = game.genres && game.genres[0] ? game.genres[0].name : "General";
            const thumbnailUrl = game.background_image || "";
            let releaseYear: number | null = null;
            if (game.released && game.released.length >= 4) {
              const yr = parseInt(game.released.slice(0, 4));
              if (!isNaN(yr)) releaseYear = yr;
            }
            return { found: true, genre, thumbnail_url: thumbnailUrl, release_year: releaseYear };
          }
        }
      } catch (e) {
        console.error("RAWG query failed with key:", key, e);
      }
    }

    // Steam store search fallback
    try {
      const steamUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(cleanTitle)}&l=english&cc=US`;
      const resp = await fetch(steamUrl);
      if (resp.ok) {
        const data = await resp.json();
        const items = data.items;
        if (items && items[0]) {
          const appId = items[0].id;
          if (appId > 0) {
            const thumbnailUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
            let genre = "";
            let releaseYear: number | null = null;
            try {
              // Note: appdetails might fail due to CORS in browser, but wrap it cleanly
              const detailsResp = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
              if (detailsResp.ok) {
                const ddata = await detailsResp.json();
                const key = appId.toString();
                if (ddata[key] && ddata[key].data) {
                  const gArr = ddata[key].data.genres;
                  genre = gArr && gArr[0] ? gArr[0].description : "";
                  const releaseDateStr = ddata[key].data.release_date ? ddata[key].data.release_date.date : "";
                  const match = releaseDateStr.match(/\b(19|20)\d{2}\b/);
                  if (match) {
                    releaseYear = parseInt(match[0]);
                  }
                }
              }
            } catch (e) {
              console.error("Steam appdetails CORS/fetch failed:", e);
            }
            return { found: true, genre, thumbnail_url: thumbnailUrl, release_year: releaseYear };
          }
        }
      }
    } catch (e) {
      console.error("Steam search query failed:", e);
    }

    return { found: false, genre: "", thumbnail_url: "", release_year: null };
  };

  const handleAutoFill = async () => {
    if (!form.title.trim()) {
      toast("Enter a game title first.", "info");
      return;
    }
    if (rawgKeys.length === 0) {
      toast("No RAWG API keys configured. Add one first.", "info");
      return;
    }
    setLookingUp(true);
    try {
      const res = await lookupGameDetails(form.title.trim());
      if (res.found) {
        setForm(f => ({
          ...f,
          genre: res.genre || f.genre,
          thumbnail_url: res.thumbnail_url || f.thumbnail_url,
          release_year: res.release_year ? res.release_year.toString() : f.release_year,
        }));
        setPreviewMeta({ genre: res.genre, thumbnail_url: res.thumbnail_url });
        toast(`Metadata found for "${form.title}"!`, "success");
      } else {
        toast(`No match found for "${form.title}".`, "info");
      }
    } catch (e: any) {
      toast(`Lookup failed: ${e.message || String(e)}`, "error");
    } finally {
      setLookingUp(false);
    }
  };

  const handleTestRawgKey = async () => {
    if (rawgKeys.length === 0) {
      toast("Add at least one RAWG key to test.", "info");
      return;
    }
    setTestingRawg(true);
    try {
      const res = await lookupGameDetails("Minecraft", rawgKeys[0]);
      if (res.found) {
        toast("RAWG API configuration is verified and working.", "success");
      } else {
        toast("RAWG test finished — no results but API request succeeded.", "info");
      }
    } catch (e: any) {
      toast(`Test failed: ${e.message || String(e)}`, "error");
    } finally {
      setTestingRawg(false);
    }
  };

  const handlePublish = async () => {
    if (!form.title.trim() || !form.download_url.trim()) {
      toast("Title and Download URL are required.", "info");
      return;
    }
    setPublishing(true);
    try {
      const filename = deriveFilenameFromTitle(form.title);
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        genre: form.genre.trim(),
        download_url: form.download_url.trim(),
        download_type: form.download_type,
        filename,
        thumbnail_url: form.thumbnail_url.trim() || null,
        release_year: form.release_year ? parseInt(form.release_year) : null,
      };

      const resp = await fetch(`${SUPABASE_REST}/games`, {
        method: "POST",
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(body)
      });

      if (resp.status === 401) {
        onUnauthorized();
        return;
      }

      if (!resp.ok) {
        const bodyText = await resp.text().catch(() => "");
        throw new Error(`Publish failed (${resp.status}): ${bodyText}`);
      }

      toast(`"${form.title}" published to catalogue!`, "success");
      setForm(defaultForm);
      setPreviewMeta(null);
      await refreshCatalogue();
    } catch (e: any) {
      toast(`Publish failed: ${e.message || String(e)}`, "error");
    } finally {
      setPublishing(false);
    }
  };

  const handleFetchRemote = async (sourceUrl: string) => {
    setFetchingRemote(true);
    try {
      const resp = await fetch(sourceUrl);
      if (!resp.ok) throw new Error(`Fetch returned ${resp.status}`);
      const data = await resp.json();
      setRemoteGames(data.downloads || []);
      toast(`Fetched ${data.downloads?.length || 0} remote games!`, "success");
    } catch (e: any) {
      toast(`Fetch failed: ${e.message || String(e)}`, "error");
      setRemoteGames([]);
    } finally {
      setFetchingRemote(false);
    }
  };

  // Background RAWG patching loop
  const enrichTitlesWithRawg = async (titles: string[], tableName: string) => {
    if (titles.length === 0 || rawgKeys.length === 0) return;
    let keyIdx = 0;
    for (const title of titles) {
      await new Promise(r => setTimeout(r, 200)); // Rate limit buffer
      let attempts = 0;
      let patched = false;
      const cleanTitle = normalizeSearchTitle(title);
      
      while (attempts < rawgKeys.length && !patched) {
        const rawgKey = rawgKeys[keyIdx % rawgKeys.length];
        try {
          const resp = await fetch(`https://api.rawg.io/api/games?search=${encodeURIComponent(cleanTitle)}&key=${rawgKey}&page_size=1`);
          if (resp.ok) {
            const data = await resp.json();
            const game = data.results && data.results[0];
            if (game) {
              const genre = game.genres && game.genres[0] ? game.genres[0].name : "General";
              const thumbnailUrl = game.background_image || "";
              let releaseYear: number | null = null;
              if (game.released && game.released.length >= 4) {
                const yr = parseInt(game.released.slice(0, 4));
                if (!isNaN(yr)) releaseYear = yr;
              }
              
              const patchBody: any = {};
              if (thumbnailUrl) patchBody.thumbnail_url = thumbnailUrl;
              if (genre && genre !== "Remote") patchBody.genre = genre;
              if (releaseYear) patchBody.release_year = releaseYear;
              
              if (Object.keys(patchBody).length > 0) {
                const patchUrl = `${SUPABASE_REST}/${tableName}?title=eq.${encodeURIComponent(title)}`;
                const patchResp = await fetch(patchUrl, {
                  method: "PATCH",
                  headers: {
                    apikey: adminKey,
                    Authorization: `Bearer ${adminKey}`,
                    "Content-Type": "application/json",
                    Prefer: "return=minimal"
                  },
                  body: JSON.stringify(patchBody)
                });
                if (patchResp.status === 401) {
                  onUnauthorized();
                  return;
                }
              }
              patched = true;
            } else {
              keyIdx++;
              attempts++;
            }
          } else {
            keyIdx++;
            attempts++;
          }
        } catch (e) {
          keyIdx++;
          attempts++;
        }
      }
    }
  };

  const handleSyncRemote = async (sourceUrl: string, tableName: string) => {
    setSyncingRemote(true);
    try {
      // 1. Fetch existing games
      const existingUrl = `${SUPABASE_REST}/${tableName}?select=id,title,download_urls`;
      const dbResp = await fetch(existingUrl, {
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`
        }
      });
      if (!dbResp.ok) {
        const bodyText = await dbResp.text().catch(() => "");
        throw new Error(`DB fetch error (${dbResp.status}): ${bodyText}`);
      }
      const existingGames = await dbResp.json();
      
      const titleMap = new Map<string, { id: number; urls: string[] }>();
      for (const eg of existingGames) {
        titleMap.set(eg.title.trim().toLowerCase(), { id: eg.id, urls: eg.download_urls || [] });
      }

      // 2. Fetch remote source JSON
      const remoteResp = await fetch(sourceUrl);
      if (!remoteResp.ok) throw new Error(`Remote source returned ${remoteResp.status}`);
      const remoteData = await remoteResp.json();
      const downloads = remoteData.downloads || [];

      let addedCount = 0;
      let payloadChunk: any[] = [];
      const addedTitles: string[] = [];

      const torrentOnly = isKazumiOrXetabSource(sourceUrl);
      const sourceLabel = sourceUrl.includes("kazumi.json") 
        ? "Kazumi Mirror" 
        : sourceUrl.includes("Xetab.json") 
        ? "Xetab Mirror" 
        : sourceUrl.includes("onlinefix.json") 
        ? "OnlineFix Mirror" 
        : "Mirror";

      for (const game of downloads) {
        const titleRaw = (game.title || "Unknown Game").trim();
        const titleClean = cleanGameTitle(titleRaw);

        const uris = game.uris || [];
        const allUrls: string[] = uris.filter((s: string) => !torrentOnly || isMagnetOrTorrentUrl(s));
        if (allUrls.length === 0) continue;

        const downloadUrl = allUrls[0];
        const downloadType = isMagnetOrTorrentUrl(downloadUrl) ? "torrent" : "direct";
        const fileSize = game.fileSize || "Unknown";
        const sizeBytes = parseSizeToBytes(fileSize);
        const filename = deriveFilenameFromTitle(titleClean);

        const formattedUrls = allUrls.map(u => JSON.stringify({
          url: u,
          title: sourceLabel,
          size: fileSize
        }));

        const titleLower = titleClean.toLowerCase();
        const existing = titleMap.get(titleLower);

        if (existing) {
          // Merge mirror urls
          let mergedAny = false;
          const mergedUrls = [...existing.urls];
          for (const newFUrl of formattedUrls) {
            try {
              const newObj = JSON.parse(newFUrl);
              const exists = mergedUrls.some(exStr => {
                try {
                  const exObj = JSON.parse(exStr);
                  return exObj.url === newObj.url;
                } catch {
                  return exStr === newObj.url;
                }
              });
              if (!exists) {
                mergedUrls.push(newFUrl);
                mergedAny = true;
              }
            } catch {}
          }
          if (mergedAny && existing.id > 0) {
            const patchUrl = `${SUPABASE_REST}/${tableName}?id=eq.${existing.id}`;
            await fetch(patchUrl, {
              method: "PATCH",
              headers: {
                apikey: adminKey,
                Authorization: `Bearer ${adminKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal"
              },
              body: JSON.stringify({ download_urls: mergedUrls })
            });
          }
        } else {
          // New game insert
          titleMap.set(titleLower, { id: 0, urls: formattedUrls });
          payloadChunk.push({
            title: titleClean,
            description: `File size: ${fileSize}`,
            genre: null,
            download_url: downloadUrl,
            download_type: downloadType,
            size_bytes: sizeBytes,
            thumbnail_url: null,
            filename,
            download_urls: formattedUrls
          });
          addedTitles.push(titleClean);
        }

        if (payloadChunk.length >= 500) {
          const insertUrl = `${SUPABASE_REST}/${tableName}`;
          const pubResp = await fetch(insertUrl, {
            method: "POST",
            headers: {
              apikey: adminKey,
              Authorization: `Bearer ${adminKey}`,
              "Content-Type": "application/json",
              Prefer: "resolution=merge-duplicates,return=minimal"
            },
            body: JSON.stringify(payloadChunk)
          });
          if (!pubResp.ok) {
            const bodyText = await pubResp.text().catch(() => "");
            throw new Error(`Sync chunk insert failed (${pubResp.status}): ${bodyText}`);
          }
          addedCount += payloadChunk.length;
          payloadChunk = [];
        }
      }

      if (payloadChunk.length > 0) {
        const insertUrl = `${SUPABASE_REST}/${tableName}`;
        const pubResp = await fetch(insertUrl, {
          method: "POST",
          headers: {
            apikey: adminKey,
            Authorization: `Bearer ${adminKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal"
          },
          body: JSON.stringify(payloadChunk)
        });
        if (!pubResp.ok) {
          const bodyText = await pubResp.text().catch(() => "");
          throw new Error(`Sync final chunk failed (${pubResp.status}): ${bodyText}`);
        }
        addedCount += payloadChunk.length;
      }

      toast(`Successfully synced! Added ${addedCount} games to ${tableName}.`, "success");
      await refreshCatalogue();
      enrichTitlesWithRawg(addedTitles, tableName); // Fire and forget enrichment
      await handleFetchRemote(sourceUrl);
    } catch (e: any) {
      toast(`Sync failed: ${e.message || String(e)}`, "error");
    } finally {
      setSyncingRemote(false);
    }
  };

  const handleSyncInstallers = async () => {
    setSyncingRemote(true);
    try {
      // Fetch FitGirl and DODI
      const [fgResp, dodiResp] = await Promise.all([
        fetch(FITGIRL_URL),
        fetch("https://raw.githubusercontent.com/Seisen88/gamejson/refs/heads/main/dodi.json")
      ]);

      const fgJson = fgResp.ok ? await fgResp.json() : { downloads: [] };
      const dodiJson = dodiResp.ok ? await dodiResp.json() : { downloads: [] };

      const allGamesMap = new Map<string, any>();

      const processList = (downloads: any[], source: "FitGirl" | "DODI") => {
        for (const game of downloads) {
          const titleRaw = (game.title || "Unknown Game").trim();
          const titleClean = cleanGameTitle(titleRaw);

          const uris = game.uris || [];
          if (uris.length === 0) continue;

          const downloadUrl = uris.find((s: string) => s.startsWith("magnet:") || s.endsWith(".torrent")) || uris[0];
          const downloadType = isMagnetOrTorrentUrl(downloadUrl) ? "torrent" : "direct";
          const fileSize = game.fileSize || "Unknown";

          const richUris = uris.map((uri: string) => JSON.stringify({
            title: titleRaw,
            size: fileSize,
            source,
            url: uri
          }));

          const dedupKey = deriveDedupKey(titleClean);
          const existing = allGamesMap.get(dedupKey);

          if (existing) {
            const arr = existing.download_urls || [];
            for (const rUri of richUris) {
              if (!arr.includes(rUri)) {
                arr.push(rUri);
              }
            }
          } else {
            const sizeBytes = parseSizeToBytes(fileSize);
            const filename = deriveFilenameFromTitle(titleClean);
            allGamesMap.set(dedupKey, {
              title: titleClean,
              description: `File size: ${fileSize}`,
              genre: null,
              download_url: downloadUrl,
              download_type: downloadType,
              size_bytes: sizeBytes,
              thumbnail_url: null,
              filename,
              download_urls: richUris
            });
          }
        }
      };

      processList(fgJson.downloads || [], "FitGirl");
      processList(dodiJson.downloads || [], "DODI");

      let addedCount = 0;
      let payloadChunk: any[] = [];
      const addedTitles: string[] = [];

      for (const [, payload] of allGamesMap) {
        if (payload.download_urls && payload.download_urls.length > 10) {
          payload.download_urls = payload.download_urls.slice(0, 10);
        }
        payloadChunk.push(payload);
        addedTitles.push(payload.title);

        if (payloadChunk.length >= 500) {
          const insertUrl = `${SUPABASE_REST}/installer_games`;
          const pubResp = await fetch(insertUrl, {
            method: "POST",
            headers: {
              apikey: adminKey,
              Authorization: `Bearer ${adminKey}`,
              "Content-Type": "application/json",
              Prefer: "resolution=merge-duplicates,return=minimal"
            },
            body: JSON.stringify(payloadChunk)
          });
          if (!pubResp.ok) {
            const text = await pubResp.text().catch(() => "");
            throw new Error(`Sync chunk failed (${pubResp.status}): ${text}`);
          }
          addedCount += payloadChunk.length;
          payloadChunk = [];
        }
      }

      if (payloadChunk.length > 0) {
        const insertUrl = `${SUPABASE_REST}/installer_games`;
        const pubResp = await fetch(insertUrl, {
          method: "POST",
          headers: {
            apikey: adminKey,
            Authorization: `Bearer ${adminKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal"
          },
          body: JSON.stringify(payloadChunk)
        });
        if (!pubResp.ok) {
          const text = await pubResp.text().catch(() => "");
          throw new Error(`Sync final chunk failed (${pubResp.status}): ${text}`);
        }
        addedCount += payloadChunk.length;
      }

      toast(`Successfully synced Repacks! Added ${addedCount} games to installer_games.`, "success");
      await refreshCatalogue();
      enrichTitlesWithRawg(addedTitles, "installer_games");
    } catch (e: any) {
      toast(`Repack sync failed: ${e.message || String(e)}`, "error");
    } finally {
      setSyncingRemote(false);
    }
  };

  const handleSyncStandard = async () => {
    setSyncingRemote(true);
    try {
      // Fetch Kazumi and Xetab
      const [kzResp, xtResp] = await Promise.all([
        fetch(KAZUMI_URL),
        fetch(XETAB_URL)
      ]);

      const kzJson = kzResp.ok ? await kzResp.json() : { downloads: [] };
      const xtJson = xtResp.ok ? await xtResp.json() : { downloads: [] };

      const allGamesMap = new Map<string, any>();

      const processStandardList = (downloads: any[], sourceLabel: string) => {
        for (const game of downloads) {
          const titleRaw = (game.title || "Unknown Game").trim();
          const titleClean = cleanGameTitle(titleRaw);

          const uris = game.uris || [];
          const validUris = uris.filter((s: string) => isMagnetOrTorrentUrl(s));
          if (validUris.length === 0) continue;

          const downloadUrl = validUris[0];
          const downloadType = "torrent";
          const fileSize = game.fileSize || "Unknown";

          const richUris = validUris.map((u: string) => JSON.stringify({
            url: u,
            title: sourceLabel,
            size: fileSize
          }));

          const dedupKey = deriveDedupKey(titleClean);
          const existing = allGamesMap.get(dedupKey);

          if (existing) {
            const arr = existing.download_urls || [];
            for (const rUri of richUris) {
              if (!arr.includes(rUri)) arr.push(rUri);
            }
          } else {
            const sizeBytes = parseSizeToBytes(fileSize);
            const filename = deriveFilenameFromTitle(titleClean);
            allGamesMap.set(dedupKey, {
              title: titleClean,
              description: `File size: ${fileSize}`,
              genre: null,
              download_url: downloadUrl,
              download_type: downloadType,
              size_bytes: sizeBytes,
              thumbnail_url: null,
              filename,
              download_urls: richUris
            });
          }
        }
      };

      processStandardList(kzJson.downloads || [], "Kazumi Mirror");
      processStandardList(xtJson.downloads || [], "Xetab Mirror");

      // Fetch existing DB games to merge
      const dbResp = await fetch(`${SUPABASE_REST}/games?select=id,title,download_urls`, {
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`
        }
      });
      if (!dbResp.ok) throw new Error(`DB games list failed (${dbResp.status})`);
      const existingGames = await dbResp.json();

      const dbTitleMap = new Map<string, { id: number; urls: string[] }>();
      for (const eg of existingGames) {
        dbTitleMap.set(deriveDedupKey(eg.title), { id: eg.id, urls: eg.download_urls || [] });
      }

      let addedCount = 0;
      let payloadChunk: any[] = [];
      const addedTitles: string[] = [];

      for (const [dKey, payload] of allGamesMap) {
        if (payload.download_urls && payload.download_urls.length > 10) {
          payload.download_urls = payload.download_urls.slice(0, 10);
        }

        const existing = dbTitleMap.get(dKey);
        if (existing) {
          let mergedAny = false;
          const mergedUrls = [...existing.urls];
          for (const newFUrl of payload.download_urls) {
            try {
              const newObj = JSON.parse(newFUrl);
              const exists = mergedUrls.some(exStr => {
                try {
                  const exObj = JSON.parse(exStr);
                  return exObj.url === newObj.url;
                } catch {
                  return exStr === newObj.url;
                }
              });
              if (!exists) {
                mergedUrls.push(newFUrl);
                mergedAny = true;
              }
            } catch {}
          }
          if (mergedAny && existing.id > 0) {
            await fetch(`${SUPABASE_REST}/games?id=eq.${existing.id}`, {
              method: "PATCH",
              headers: {
                apikey: adminKey,
                Authorization: `Bearer ${adminKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal"
              },
              body: JSON.stringify({ download_urls: mergedUrls })
            });
          }
        } else {
          payloadChunk.push(payload);
          addedTitles.push(payload.title);
        }

        if (payloadChunk.length >= 500) {
          const insertResp = await fetch(`${SUPABASE_REST}/games`, {
            method: "POST",
            headers: {
              apikey: adminKey,
              Authorization: `Bearer ${adminKey}`,
              "Content-Type": "application/json",
              Prefer: "resolution=merge-duplicates,return=minimal"
            },
            body: JSON.stringify(payloadChunk)
          });
          if (!insertResp.ok) {
            const txt = await insertResp.text().catch(() => "");
            throw new Error(`Sync chunk insert failed: ${txt}`);
          }
          addedCount += payloadChunk.length;
          payloadChunk = [];
        }
      }

      if (payloadChunk.length > 0) {
        const insertResp = await fetch(`${SUPABASE_REST}/games`, {
          method: "POST",
          headers: {
            apikey: adminKey,
            Authorization: `Bearer ${adminKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal"
          },
          body: JSON.stringify(payloadChunk)
        });
        if (!insertResp.ok) {
          const txt = await insertResp.text().catch(() => "");
          throw new Error(`Sync final insert failed: ${txt}`);
        }
        addedCount += payloadChunk.length;
      }

      toast(`Successfully synced Standard Catalogue! Added ${addedCount} new games.`, "success");
      await refreshCatalogue();
      enrichTitlesWithRawg(addedTitles, "games");
    } catch (e: any) {
      toast(`Standard sync failed: ${e.message || String(e)}`, "error");
    } finally {
      setSyncingRemote(false);
    }
  };

  const handleWipeCatalogue = async (tableName: string, label: string) => {
    if (!window.confirm(`ARE YOU ABSOLUTELY SURE? This will permanently delete EVERY game from the ${label} catalogue table.`)) {
      return;
    }
    try {
      const url = `${SUPABASE_REST}/${tableName}?id=not.is.null`;
      const resp = await fetch(url, {
        method: "DELETE",
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
          Prefer: "count=exact"
        }
      });
      if (resp.status === 401) {
        onUnauthorized();
        return;
      }
      if (!resp.ok) {
        const err = await resp.text().catch(() => "");
        throw new Error(`Wipe failed (${resp.status}): ${err}`);
      }

      const rangeHeader = resp.headers.get("content-range") || "0-0/0";
      const count = parseInt(rangeHeader.split("/")[1]) || 0;

      toast(`Wiped ${count} games from the ${label} catalogue.`, "success");
      await refreshCatalogue();
    } catch (e: any) {
      toast(`Wipe failed: ${e.message || String(e)}`, "error");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 text-[#f0f0f0]">
      {/* ── Sidebar ── */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        {/* Navigation Card */}
        <div className="bg-[#161616]/40 border border-[#2a2a2a]/60 rounded-2xl p-4 backdrop-blur-sm flex flex-col gap-2">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[#6a6a6a] font-bold">
            Navigation
          </div>
          <div className="flex flex-col gap-1">
            {ADMIN_TABS.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-left ${
                    isActive 
                      ? "bg-gradient-to-r from-brand-red to-brand-orange text-white shadow-lg shadow-brand-red/10" 
                      : "text-[#a0a0a0] hover:bg-[#202020]/60 hover:text-white"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-[#a0a0a0]"}>
                    {t.icon}
                  </span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-[#161616]/40 border border-[#2a2a2a]/60 rounded-2xl p-4 backdrop-blur-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red/40 to-brand-orange/40 flex items-center justify-center border border-[#2a2a2a] shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-bold text-white truncate">Administrator</div>
            <div className="text-[10px] text-[#6a6a6a] uppercase font-bold tracking-wider mt-0.5">Super User</div>
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Body ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <div className="bg-[#161616]/40 border border-[#2a2a2a]/60 rounded-2xl p-6 backdrop-blur-sm">
          {activeTab === "analytics" ? (
            <AdminAnalytics adminKey={adminKey} onUnauthorized={onUnauthorized} />
          ) : activeTab === "users" ? (
            <AdminUsers adminKey={adminKey} toast={toast} onUnauthorized={onUnauthorized} />
          ) : (
            <div className="flex flex-col gap-6 max-w-4xl text-left">
                {/* Header */}
                <div>
                  <h1 className="text-lg font-bold text-white tracking-wide">Management</h1>
                  <p className="text-[11px] text-[#6a6a6a] mt-0.5">
                    API credentials, direct manual publishing, and mirroring external mirrors
                  </p>
                </div>

                {/* RAWG Keys Card */}
                <div className="bg-[#161616]/40 border border-[#2a2a2a]/60 rounded-xl p-5 backdrop-blur-sm">
                  <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Key size={15} className="text-brand-redLight" />
                    RAWG API Keys
                  </h2>
                  <p className="text-xs text-[#a0a0a0] mb-4 leading-relaxed max-w-2xl">
                    Add keys from{" "}
                    <a href="https://rawg.io/apidocs" target="_blank" rel="noreferrer" className="text-brand-orange hover:underline font-semibold">
                      rawg.io
                    </a>
                    . Keys are pooled in Supabase. When a key's monthly limit is reached, it rotates automatically.
                  </p>

                  {rawgKeys.length > 0 ? (
                    <div className="flex flex-col gap-2 mb-4">
                      {rawgKeys.map((key, i) => (
                        <div key={key} className="flex items-center justify-between gap-3 p-2 bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-extrabold uppercase bg-brand-orange/10 border border-brand-orange/20 text-brand-orangeLight px-2 py-0.5 rounded">
                              {i === 0 ? "Primary" : `Backup ${i}`}
                            </span>
                            <code className="text-xs text-white font-mono">{maskRawgKey(key)}</code>
                          </div>
                          <button
                            onClick={() => handleRemoveRawgKey(key)}
                            disabled={savingRawgKeys}
                            className="p-1 text-[#6a6a6a] hover:text-white hover:bg-white/5 rounded transition-all"
                            title="Delete key"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6a6a6a] italic mb-4">No keys saved in Supabase. Reiya uses the build fallback if present.</p>
                  )}

                  <div className="flex flex-wrap gap-3 items-end mb-2">
                    <div className="flex-1 min-w-[200px] flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">New API Key</label>
                      <input
                        type="password"
                        placeholder="Paste rawg.io API key"
                        value={newRawgKey}
                        onChange={(e) => setNewRawgKey(e.target.value)}
                        className="bg-[#1c1c1c] border border-[#2a2a2a]/60 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-brand-red/30 transition-all font-mono"
                      />
                    </div>
                    <button
                      onClick={handleAddRawgKey}
                      disabled={savingRawgKeys || !newRawgKey.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#202020] hover:bg-[#2d2d2d] border border-[#2a2a2a] hover:border-brand-red/30 rounded-lg text-xs font-bold text-white uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      {savingRawgKeys ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      Add key
                    </button>
                    <button
                      onClick={handleTestRawgKey}
                      disabled={testingRawg || rawgKeys.length === 0}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#202020] hover:bg-[#2d2d2d] border border-[#2a2a2a] hover:border-brand-red/30 rounded-lg text-xs font-bold text-white uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      {testingRawg ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Test API
                    </button>
                  </div>
                  <p className="text-[10px] text-[#6a6a6a] font-medium mt-1">
                    {rawgKeys.length} key(s) active inside global pool.
                  </p>
                </div>

                {/* Publish Game Card */}
                <div className="bg-[#161616]/40 border border-[#2a2a2a]/60 rounded-xl p-5 backdrop-blur-sm">
                  <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Gamepad2 size={15} className="text-brand-redLight" />
                    Publish New Game
                  </h2>

                  <div className="flex gap-3 mb-4 items-end">
                    <div className="flex-1 flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Game Title</label>
                      <input
                        placeholder="e.g. Ghost of Tsushima"
                        value={form.title}
                        onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                        className="bg-[#1c1c1c] border border-[#2a2a2a]/60 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-brand-red/30 transition-all font-semibold"
                      />
                    </div>
                    <button
                      onClick={handleAutoFill}
                      disabled={lookingUp || !form.title.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#202020] hover:bg-[#2d2d2d] border border-[#2a2a2a] hover:border-brand-red/30 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                    >
                      {lookingUp ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                      Auto-Fill
                    </button>
                  </div>

                  {previewMeta && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg mb-4 text-xs text-emerald-400">
                      <img src={previewMeta.thumbnail_url} className="w-16 h-9 object-cover rounded border border-[#2a2a2a]" alt="" />
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <Check size={13} />
                          RAWG metadata populated!
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded font-semibold mt-1 inline-block">{previewMeta.genre}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Genre</label>
                      <input
                        placeholder="e.g. Action RPG"
                        value={form.genre}
                        onChange={(e) => setForm(f => ({ ...f, genre: e.target.value }))}
                        className="bg-[#1c1c1c] border border-[#2a2a2a]/60 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-brand-red/30 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Release Year</label>
                      <input
                        type="number"
                        placeholder="e.g. 2024"
                        value={form.release_year}
                        onChange={(e) => setForm(f => ({ ...f, release_year: e.target.value }))}
                        className="bg-[#1c1c1c] border border-[#2a2a2a]/60 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-brand-red/30 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Protocol</label>
                      <select
                        value={form.download_type}
                        onChange={(e) => setForm(f => ({ ...f, download_type: e.target.value as any }))}
                        className="bg-[#1c1c1c] border border-[#2a2a2a]/60 rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="direct">Direct Link (HTTP)</option>
                        <option value="torrent">Torrent / Magnet</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-4 text-left">
                    <label className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Download Link</label>
                    <div className="relative">
                      <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a6a]" />
                      <input
                        placeholder="https://... or magnet:?xt=..."
                        value={form.download_url}
                        onChange={(e) => setForm(f => ({ ...f, download_url: e.target.value }))}
                        className="w-full bg-[#1c1c1c] border border-[#2a2a2a]/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-brand-red/30 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-4 text-left">
                    <label className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Thumbnail URL (RAWG)</label>
                    <div className="relative">
                      <Image size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a6a]" />
                      <input
                        placeholder="https://media.rawg.io/..."
                        value={form.thumbnail_url}
                        onChange={(e) => setForm(f => ({ ...f, thumbnail_url: e.target.value }))}
                        className="w-full bg-[#1c1c1c] border border-[#2a2a2a]/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-brand-red/30 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-5 text-left">
                    <label className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Description</label>
                    <textarea
                      placeholder="Enter game summary description..."
                      value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full min-h-[80px] max-h-[200px] bg-[#1c1c1c] border border-[#2a2a2a]/60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-red/30 transition-all leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2a2a2a]">
                    <button
                      onClick={() => { setForm(defaultForm); setPreviewMeta(null); }}
                      disabled={publishing}
                      className="flex items-center gap-1 px-3.5 py-1.5 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={13} />
                      Reset
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={publishing || !form.title.trim() || !form.download_url.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-brand-redLight rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50 uppercase tracking-wider"
                    >
                      {publishing ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      Publish Game
                    </button>
                  </div>
                </div>

                {/* Mirror Sources Aggregator Card */}
                <div className="bg-[#161616]/40 border border-[#2a2a2a]/60 rounded-xl p-5 backdrop-blur-sm">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4 pb-4 border-b border-[#2a2a2a]">
                    <div className="text-left">
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Cloud size={15} className="text-brand-redLight" />
                        External Repositories
                      </h2>
                      <p className="text-xs text-[#6a6a6a] mt-0.5">Parse external game JSON indices and upsert to database</p>
                    </div>

                    <div className="flex flex-col gap-2 text-right shrink-0">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFetchRemote(KAZUMI_URL)}
                          disabled={fetchingRemote}
                          className="px-2.5 py-1 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] rounded text-[10px] font-bold text-[#a0a0a0] flex items-center gap-1"
                        >
                          {fetchingRemote ? <Loader2 size={10} className="animate-spin" /> : <Database size={10} />}
                          Fetch Kazumi
                        </button>
                        <button
                          onClick={() => handleFetchRemote(XETAB_URL)}
                          disabled={fetchingRemote}
                          className="px-2.5 py-1 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] rounded text-[10px] font-bold text-[#a0a0a0] flex items-center gap-1"
                        >
                          {fetchingRemote ? <Loader2 size={10} className="animate-spin" /> : <Database size={10} />}
                          Fetch Xetab
                        </button>
                        <button
                          onClick={handleSyncStandard}
                          disabled={syncingRemote}
                          className="px-2.5 py-1 bg-[#202020] hover:bg-brand-red/20 hover:border-brand-red/40 border border-[#2a2a2a] rounded text-[10px] font-bold text-white flex items-center gap-1"
                        >
                          {syncingRemote ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                          Sync Standard
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFetchRemote(ONLINEFIX_URL)}
                          disabled={fetchingRemote}
                          className="px-2.5 py-1 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] rounded text-[10px] font-bold text-[#a0a0a0] flex items-center gap-1"
                        >
                          {fetchingRemote ? <Loader2 size={10} className="animate-spin" /> : <Database size={10} />}
                          Fetch Online
                        </button>
                        <button
                          onClick={() => handleSyncRemote(ONLINEFIX_URL, "online_games")}
                          disabled={syncingRemote}
                          className="px-2.5 py-1 bg-[#202020] hover:bg-brand-red/20 hover:border-brand-red/40 border border-[#2a2a2a] rounded text-[10px] font-bold text-white flex items-center gap-1"
                        >
                          {syncingRemote ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                          Sync Online
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFetchRemote(FITGIRL_URL)}
                          disabled={fetchingRemote}
                          className="px-2.5 py-1 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] rounded text-[10px] font-bold text-[#a0a0a0] flex items-center gap-1"
                        >
                          {fetchingRemote ? <Loader2 size={10} className="animate-spin" /> : <Database size={10} />}
                          Fetch Repacks
                        </button>
                        <button
                          onClick={handleSyncInstallers}
                          disabled={syncingRemote}
                          className="px-2.5 py-1 bg-[#202020] hover:bg-brand-red/20 hover:border-brand-red/40 border border-[#2a2a2a] rounded text-[10px] font-bold text-white flex items-center gap-1"
                        >
                          {syncingRemote ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                          Sync Repacks
                        </button>
                      </div>
                    </div>
                  </div>

                  {remoteGames.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {/* Search remote games */}
                      <div className="relative">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a6a]" />
                        <input
                          placeholder="Filter fetched list..."
                          value={remoteSearch}
                          onChange={(e) => setRemoteSearch(e.target.value)}
                          className="w-full bg-[#1c1c1c] border border-[#2a2a2a]/60 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white outline-none focus:border-brand-red/30 transition-all"
                        />
                        {remoteSearch && (
                          <button onClick={() => setRemoteSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a6a6a] hover:text-white">
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Scroller list */}
                      <div className="max-h-60 overflow-y-auto border border-[#2a2a2a] rounded-lg bg-black/25 divide-y divide-[#2a2a2a]/30">
                        {remoteGames
                          .filter(g => g.title?.toLowerCase().includes(remoteSearch.toLowerCase()))
                          .slice(0, displayLimit)
                          .map((game, idx) => (
                            <div key={idx} className="p-3 flex justify-between items-center text-xs text-left">
                              <span className="font-semibold text-white truncate max-w-md">{game.title}</span>
                              <span className="text-[10px] text-[#6a6a6a] font-mono shrink-0">{game.fileSize || "Size N/A"}</span>
                            </div>
                          ))}
                        {remoteGames.filter(g => g.title?.toLowerCase().includes(remoteSearch.toLowerCase())).length > displayLimit && (
                          <div className="p-2 text-center">
                            <button
                              onClick={() => setDisplayLimit(d => d + 100)}
                              className="px-3 py-1 bg-[#161616] hover:bg-[#202020] border border-[#2a2a2a] rounded text-[10px] font-bold text-white transition-all"
                            >
                              Load More Results
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Danger Zone Card */}
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5 text-left">
                  <h2 className="text-sm font-bold text-red-400 mb-1 flex items-center gap-2">
                    <AlertTriangle size={15} />
                    Danger Zone
                  </h2>
                  <p className="text-xs text-[#806060] mb-4 leading-relaxed">
                    Permanently delete all contents of catalogue tables. Action is irreversible.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleWipeCatalogue("games", "Standard")}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      <Trash2 size={13} />
                      Wipe Standard
                    </button>
                    <button
                      onClick={() => handleWipeCatalogue("online_games", "Online Only")}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      <Trash2 size={13} />
                      Wipe Online only
                    </button>
                    <button
                      onClick={() => handleWipeCatalogue("installer_games", "Installer Repacks")}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      <Trash2 size={13} />
                      Wipe Installers
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
}
