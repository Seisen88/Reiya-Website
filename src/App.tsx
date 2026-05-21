import { useState, useEffect } from "react";
import { 
  Download, 
  Gamepad2, 
  Shield, 
  Activity, 
  Sparkles, 
  Check, 
  Zap, 
  Globe, 
  MousePointerClick, 
  Home, 
  LayoutGrid, 
  BookOpen, 
  Settings, 
  Heart, 
  Search, 
  Plus, 
  Bell, 
  User, 
  ChevronDown, 
  Shuffle, 
  Flame, 
  Calendar, 
  X,
  Play,
  Trash2,
  FolderOpen,
  Edit2,
  Pin,
  Pause,
  RefreshCw,
  Tv2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Copy,
  ExternalLink
} from "lucide-react";

interface ReleaseInfo {
  version: string;
  downloadUrl: string;
  publishedAt: string;
}

interface CatalogueFile {
  id: string;
  title: string;
  filename: string;
  description: string;
  genre: string;
  size_bytes: number;
  release_year: number;
  downloads_count: number;
  likes_count: number;
  thumbnail_url: string;
  backdrop_url: string;
  source: "standard" | "online" | "installer";
}

interface LibraryGame {
  id: string;
  title: string;
  filename: string;
  genre: string;
  size_bytes: number;
  thumbnail_url: string;
  backdrop_url: string;
  play_time_secs: number;
  last_played_at: string | null;
  downloaded_at: string;
}

interface DownloadItem {
  id: string;
  title: string;
  filename: string;
  progress: number; // percentage 0 - 100
  speed_mbs: number;
  size_bytes: number;
  status: "downloading" | "paused" | "completed";
}

const MOCK_GAMES: CatalogueFile[] = [
  {
    id: "gta5",
    title: "Grand Theft Auto V [FitGirl Repack]",
    filename: "Grand Theft Auto V - Premium Edition - v1.0.3095 [FitGirl Repack].zip",
    description: "Grand Theft Auto V for PC features a range of major visual and technical upgrades to make Los Santos and Blaine County more immersive than ever. Sync catalogs, download, and install silently.",
    genre: "Action, Open World",
    size_bytes: 118111600640,
    release_year: 2015,
    downloads_count: 1420,
    likes_count: 512,
    thumbnail_url: "",
    backdrop_url: "",
    source: "standard"
  },
  {
    id: "cyberpunk",
    title: "Cyberpunk 2077 [FitGirl Repack]",
    filename: "Cyberpunk 2077 - Ultimate Edition - v2.12 [FitGirl Repack].rar",
    description: "An open-world, action-adventure RPG set in Night City, a megalopolis obsessed with power, glamour, and body modification. Experience the ultimate edition with all updates and expansion packs.",
    genre: "RPG, Action, Cyberpunk",
    size_bytes: 91700160000,
    release_year: 2023,
    downloads_count: 980,
    likes_count: 345,
    thumbnail_url: "",
    backdrop_url: "",
    source: "standard"
  },
  {
    id: "eldenring",
    title: "Elden Ring [FitGirl Repack]",
    filename: "Elden Ring - Shadow of the Erdtree - v1.12.3 [FitGirl Repack].exe",
    description: "Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between. Includes the massive Shadow of the Erdtree expansion.",
    genre: "RPG, Souls-like",
    size_bytes: 68934500000,
    release_year: 2024,
    downloads_count: 1120,
    likes_count: 489,
    thumbnail_url: "",
    backdrop_url: "",
    source: "standard"
  },
  {
    id: "rdr2",
    title: "Red Dead Redemption 2 [FitGirl Repack]",
    filename: "Red Dead Redemption 2 - Build 1491.50 [FitGirl Repack].exe",
    description: "Winner of over 175 Game of the Year Awards and recipient of over 250 perfect scores, Red Dead Redemption 2 is an epic tale of outlaw Arthur Morgan and the infamous Van der Linde gang on the run.",
    genre: "Action, Adventure, Western",
    size_bytes: 127775000000,
    release_year: 2018,
    downloads_count: 1530,
    likes_count: 678,
    thumbnail_url: "",
    backdrop_url: "",
    source: "standard"
  },
  {
    id: "cs2",
    title: "Counter-Strike 2 [Non-Steam]",
    filename: "Counter-Strike 2 - v1.39.8.7 [Non-Steam Edition].zip",
    description: "A free-to-play tactical first-person shooter developed by Valve. This repack is optimized for LAN play and features a standalone launcher bypass.",
    genre: "FPS, Multiplayer",
    size_bytes: 41338000000,
    release_year: 2023,
    downloads_count: 620,
    likes_count: 210,
    thumbnail_url: "",
    backdrop_url: "",
    source: "online"
  },
  {
    id: "gtafivem",
    title: "Grand Theft Auto Online [FiveM Ready]",
    filename: "GTA_Online_FiveM_Preconfigured.rar",
    description: "Preconfigured Grand Theft Auto V assets optimized for FiveM multiplayer client. Fully parsed and ready for direct server syncing.",
    genre: "Action, Multiplayer",
    size_bytes: 120259000000,
    release_year: 2024,
    downloads_count: 890,
    likes_count: 320,
    thumbnail_url: "",
    backdrop_url: "",
    source: "online"
  },
  {
    id: "minecraft",
    title: "Minecraft [Custom Launcher]",
    filename: "Minecraft_1.20.4_Java_Fabric_Launcher.msi",
    description: "A custom Fabric-enabled launcher containing Minecraft Java Edition v1.20.4. Supports localized client-side modpacks and automatic dependency updates.",
    genre: "Sandbox, Multiplayer",
    size_bytes: 1288000000,
    release_year: 2024,
    downloads_count: 430,
    likes_count: 156,
    thumbnail_url: "",
    backdrop_url: "",
    source: "online"
  },
  {
    id: "re7",
    title: "Resident Evil 7: Biohazard [FitGirl Repack]",
    filename: "Resident Evil 7 - Biohazard - Gold Edition [FitGirl Repack].zip",
    description: "Fear and isolation seep through the walls of an abandoned southern farmhouse. '7' marks a new beginning for survival horror with the 'Isolated View' first-person perspective.",
    genre: "Horror, Survival",
    size_bytes: 39513600000,
    release_year: 2017,
    downloads_count: 750,
    likes_count: 290,
    thumbnail_url: "",
    backdrop_url: "",
    source: "installer"
  },
  {
    id: "coh3",
    title: "Company of Heroes 3 [FitGirl Repack]",
    filename: "Company of Heroes 3 - Ultimate Bundle - v2.4.0.46121 [FitGirl Repack].exe",
    description: "Company of Heroes 3 is the ultimate action-tactical game, combining heart-pounding combat with deep strategic choices in the breathtaking Mediterranean theater.",
    genre: "Strategy, RTS, WWII",
    size_bytes: 26306600000,
    release_year: 2023,
    downloads_count: 480,
    likes_count: 178,
    thumbnail_url: "",
    backdrop_url: "",
    source: "installer"
  },
  {
    id: "forzahorizon5",
    title: "Forza Horizon 5 [FitGirl Repack]",
    filename: "Forza Horizon 5 - Premium Edition - v1.634.371 [FitGirl Repack].zip",
    description: "Your Ultimate Horizon Adventure awaits! Explore the vibrant and ever-evolving open world landscapes of Mexico with limitless, fun driving action in hundreds of the world’s greatest cars.",
    genre: "Racing, Simulation",
    size_bytes: 144955000000,
    release_year: 2021,
    downloads_count: 1040,
    likes_count: 412,
    thumbnail_url: "",
    backdrop_url: "",
    source: "installer"
  }
];

function formatSize(bytes: number): string {
  if (!bytes) return "Unknown";
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

function formatPlaytime(seconds: number): string {
  if (!seconds || seconds <= 0) return "Never played";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) {
    return `${mins}m played`;
  }
  const hrs = (mins / 60).toFixed(1);
  return `${hrs} hrs played`;
}

export default function App() {
  const [release, setRelease] = useState<ReleaseInfo>({
    version: "v0.1.10",
    downloadUrl: "https://github.com/Seisen88/Reiya-Website/releases/latest",
    publishedAt: ""
  });

  // ── Mockup states ──
  const [mockActiveTab, setMockActiveTab] = useState<"home" | "catalogue" | "library" | "downloads" | "settings">("home");
  const [mockHomeTab, setMockHomeTab] = useState<"hot" | "latest" | "engaging">("hot");
  const [mockSelectedGame, setMockSelectedGame] = useState<CatalogueFile | null>(null);
  
  // Library initial seed (Elden Ring & Resident Evil 7)
  const [mockLibrary, setMockLibrary] = useState<LibraryGame[]>([
    {
      id: "eldenring",
      title: "Elden Ring [FitGirl Repack]",
      filename: "Elden Ring - Shadow of the Erdtree - v1.12.3 [FitGirl Repack].exe",
      genre: "RPG, Souls-like",
      size_bytes: 68934500000,
      thumbnail_url: "",
      backdrop_url: "",
      play_time_secs: 7420, // ~2.1 hours
      last_played_at: "2026-05-20T14:24:00Z",
      downloaded_at: "2026-05-18T10:05:00Z"
    },
    {
      id: "re7",
      title: "Resident Evil 7: Biohazard [FitGirl Repack]",
      filename: "Resident Evil 7 - Biohazard - Gold Edition [FitGirl Repack].zip",
      genre: "Horror, Survival",
      size_bytes: 39513600000,
      thumbnail_url: "",
      backdrop_url: "",
      play_time_secs: 0,
      last_played_at: null,
      downloaded_at: "2026-05-21T09:40:00Z"
    }
  ]);

  const [mockFavorites, setMockFavorites] = useState<string[]>(["eldenring"]);
  const [mockPinned, setMockPinned] = useState<string[]>([]);
  const [mockDownloads, setMockDownloads] = useState<DownloadItem[]>([]);
  const [mockDownloadSpeed, setMockDownloadSpeed] = useState<number>(0);
  const [mockSpeedHistory, setMockSpeedHistory] = useState<number[]>([
    10, 15, 25, 45, 60, 55, 52, 48, 50, 47, 54, 58, 62, 59, 61, 60, 58, 64, 66, 62
  ]);
  const [mockSearchQuery, setMockSearchQuery] = useState("");
  const [mockLayout, setMockLayout] = useState<"square" | "grid" | "list" | "bigscreen">("list");
  const [mockCatalogSource, setMockCatalogSource] = useState<"standard" | "online" | "installer">("standard");
  const [mockRunningGameId, setMockRunningGameId] = useState<string | null>(null);
  
  // Filters state (Right Panel mockup)
  const [mockFilterGenres, setMockFilterGenres] = useState<string[]>([]);
  const [mockFilterYearRange, setMockFilterYearRange] = useState<[number, number]>([1995, 2026]);
  const [mockFilterSize, setMockFilterSize] = useState<string | null>(null);

  // Layout open states
  const [sidebarCollectionsOpen, setSidebarCollectionsOpen] = useState(true);
  const [sidebarGamesOpen, setSidebarGamesOpen] = useState(true);
  
  // Toast notifications inside mockup
  const [mockToast, setMockToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  const [launchingGame, setLaunchingGame] = useState<LibraryGame | null>(null);

  // Settings inputs mockup
  const [settingsExtractionPath, setSettingsExtractionPath] = useState("C:\\Users\\Seisen\\AppData\\Local\\ReiyaGameLibrary\\downloads");
  const [settingsMirrors, setSettingsMirrors] = useState("https://api.reiyacatalogs.xyz/kazumi\nhttps://sync.xetabgames.net/mirror");
  const [settingsBoot, setSettingsBoot] = useState(true);
  const [settingsTray, setSettingsTray] = useState(true);
  const [settingsSilent, setSettingsSilent] = useState(true);

  // Settings detailed sub-states matching actual client
  const [settingsSubTab, setSettingsSubTab] = useState<"general" | "themes" | "downloads" | "notifications" | "about" | "account">("general");
  const [settingsLanguage, setSettingsLanguage] = useState("en");
  const [settingsStartMinimized, setSettingsStartMinimized] = useState(false);
  const [settingsOpenToLibrary, setSettingsOpenToLibrary] = useState(false);
  
  const [settingsTheme, setSettingsTheme] = useState("default");
  
  const [settingsConcurrentLimit, setSettingsConcurrentLimit] = useState("3");
  const [settingsPauseOnLaunch, setSettingsPauseOnLaunch] = useState(false);
  const [settingsAutoOpenDir, setSettingsAutoOpenDir] = useState(false);
  const [settingsAutoRunInstallers, setSettingsAutoRunInstallers] = useState(false);
  const [settingsAutoExtract, setSettingsAutoExtract] = useState(false);
  const [settingsStopSeeding, setSettingsStopSeeding] = useState(true);
  
  const [settingsNotifDlComplete, setSettingsNotifDlComplete] = useState(true);
  const [settingsNotifNewGame, setSettingsNotifNewGame] = useState(true);
  const [settingsNotifUpdate, setSettingsNotifUpdate] = useState(true);
  const [settingsNotifDlError, setSettingsNotifDlError] = useState(true);
  
  const [settingsUserName, setSettingsUserName] = useState("uonwrud8");
  const [settingsProfileImage, setSettingsProfileImage] = useState("");
  const [settingsUserUuid] = useState("5c3453b0-2b1b-4b10-8f92-563b7e77b941");
  const [settingsUserRole] = useState("user");

  // Dynamic games state fetched from Supabase
  const [gamesList, setGamesList] = useState<CatalogueFile[]>(MOCK_GAMES);
  const [isLoadingGames, setIsLoadingGames] = useState(true);

  // Add Game Modal states
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [addGameTitle, setAddGameTitle] = useState("");
  const [addGameFilename, setAddGameFilename] = useState("");
  const [addGameDescription, setAddGameDescription] = useState("");
  const [addGameGenre, setAddGameGenre] = useState("");
  const [addGameSizeGB, setAddGameSizeGB] = useState("5.0");
  const [addGameYear, setAddGameYear] = useState(new Date().getFullYear().toString());
  const [addGameThumbnail, setAddGameThumbnail] = useState("");
  const [addGameSource, setAddGameSource] = useState<"standard" | "online" | "installer">("standard");
  const [isAddingGame, setIsAddingGame] = useState(false);

  // Purchase modal states
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedPurchaseTier, setSelectedPurchaseTier] = useState<"1-month" | "1-year" | "lifetime" | null>(null);
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  // Carousel
  const [carouselIndex, setCarouselIndex] = useState(0);
  const featuredGames = gamesList.length > 0 ? gamesList.slice(0, 3) : MOCK_GAMES.slice(0, 3);
  
  // Show right sidebar filter on catalogue
  const showRightPanel = mockActiveTab === "catalogue" && !mockSelectedGame;

  // Filter lists based on state
  const librarySearchFiltered = mockLibrary.filter(g => 
    g.title.toLowerCase().includes(mockSearchQuery.toLowerCase())
  );

  // Toast Helper
  const triggerMockToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setMockToast({ message, type });
    setTimeout(() => setMockToast(null), 3500);
  };

  // Simulated ticks
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Simulating active downloads
      setMockDownloads(prev => {
        let speed = 0;
        const next = prev.map((d): DownloadItem => {
          if (d.status === "downloading") {
            const step = Math.floor(Math.random() * 4) + 3; // 3% to 6%
            const newProgress = Math.min(d.progress + step, 100);
            const currentSpeed = Math.floor(Math.random() * 25) + 40; // 40 - 65 MB/s
            speed = currentSpeed;
            
            if (newProgress >= 100) {
              // Add to library
              const catalogMatch = gamesList.find(cg => cg.id === d.id);
              if (catalogMatch && !mockLibrary.some(l => l.id === d.id)) {
                setTimeout(() => {
                  setMockLibrary(lPrev => [
                    ...lPrev,
                    {
                      id: catalogMatch.id,
                      title: catalogMatch.title,
                      filename: catalogMatch.filename,
                      genre: catalogMatch.genre,
                      size_bytes: catalogMatch.size_bytes,
                      thumbnail_url: catalogMatch.thumbnail_url,
                      backdrop_url: catalogMatch.backdrop_url,
                      play_time_secs: 0,
                      last_played_at: null,
                      downloaded_at: new Date().toISOString()
                    }
                  ]);
                  triggerMockToast(`Installed: ${catalogMatch.title} is ready!`, "success");
                }, 100);
              }
              return { ...d, progress: 100, status: "completed" as const, speed_mbs: 0 };
            }
            return { ...d, progress: newProgress, speed_mbs: currentSpeed };
          }
          return d;
        });
        setMockDownloadSpeed(speed);
        if (speed > 0) {
          setMockSpeedHistory(h => [...h.slice(1), speed]);
        } else {
          setMockSpeedHistory(h => [...h.slice(1), 0]);
        }
        return next;
      });

      // 2. Playtime tracker increment
      if (mockRunningGameId) {
        setMockLibrary(prev => 
          prev.map(g => {
            if (g.id === mockRunningGameId) {
              return { ...g, play_time_secs: g.play_time_secs + 5 }; // simulation adds 5 seconds per tick
            }
            return g;
          })
        );
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [mockRunningGameId, mockLibrary]);

  // Fetch GitHub release metadata
  useEffect(() => {
    async function fetchLatestRelease() {
      try {
        const response = await fetch(
          "https://api.github.com/repos/Seisen88/Reiya-Website/releases/latest"
        );
        if (!response.ok) throw new Error("Failed to fetch release");
        const data = await response.json();
        const asset = data.assets.find(
          (a: any) => a.name.endsWith(".msi") || a.name.endsWith(".exe")
        );
        setRelease({
          version: data.tag_name,
          downloadUrl: asset ? asset.browser_download_url : data.html_url,
          publishedAt: new Date(data.published_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric"
          })
        });
      } catch (err) {
        console.error("Error fetching release info from GitHub:", err);
      }
    }
    fetchLatestRelease();
  }, []);

  // Carousel timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (featuredGames.length > 0) {
        setCarouselIndex(prev => (prev + 1) % featuredGames.length);
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredGames.length]);

  // Fetch games from Supabase REST endpoints
  useEffect(() => {
    let active = true;
    async function fetchGames() {
      try {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
        const headers = {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        };
        
        const [gamesRes, onlineRes, installerRes] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/games?select=*`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/online_games?select=*`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/installer_games?select=*`, { headers })
        ]);

        if (!gamesRes.ok || !onlineRes.ok || !installerRes.ok) {
          throw new Error("Failed to fetch one or more tables from Supabase");
        }

        const rawGames = await gamesRes.json();
        const rawOnline = await onlineRes.json();
        const rawInstaller = await installerRes.json();

        const mapGameItem = (item: any, source: "standard" | "online" | "installer"): CatalogueFile => {
          let desc = item.description || "";
          if (!desc && item.rawg_description) {
            desc = item.rawg_description.replace(/<[^>]*>/g, "");
          }
          if (!desc) {
            desc = "No description available.";
          }
          
          return {
            id: item.id ? item.id.toString() : Math.random().toString(),
            title: item.title || "Untitled Game",
            filename: item.filename || "",
            description: desc,
            genre: item.genre || "General",
            size_bytes: Number(item.size_bytes) || 0,
            release_year: Number(item.release_year) || new Date().getFullYear(),
            downloads_count: Number(item.downloads_count) || 0,
            likes_count: Number(item.likes_count) || 0,
            thumbnail_url: item.thumbnail_url || "",
            backdrop_url: (item.rawg_screenshots && item.rawg_screenshots[0]) || item.thumbnail_url || "",
            source: source
          };
        };

        const mappedGames = [
          ...rawGames.map((g: any) => mapGameItem(g, "standard")),
          ...rawOnline.map((g: any) => mapGameItem(g, "online")),
          ...rawInstaller.map((g: any) => mapGameItem(g, "installer"))
        ];

        if (active) {
          const seen = new Set<string>();
          const uniqueGames: CatalogueFile[] = [];
          for (const g of mappedGames) {
            const key = g.id || g.title || g.filename || "";
            if (key && !seen.has(key)) {
              seen.add(key);
              uniqueGames.push(g);
            }
          }
          
          setGamesList(uniqueGames);
          setIsLoadingGames(false);
        }
      } catch (err) {
        console.error("Error fetching games from Supabase:", err);
        if (active) {
          setIsLoadingGames(false);
        }
      }
    }
    fetchGames();
    return () => {
      active = false;
    };
  }, []);

  // Start download trigger
  const handleDownloadGame = (game: CatalogueFile) => {
    if (mockLibrary.some(l => l.id === game.id)) {
      triggerMockToast(`"${game.title}" is already in your library!`, "info");
      return;
    }
    const isDownloading = mockDownloads.some(d => d.id === game.id && d.status === "downloading");
    if (isDownloading) {
      triggerMockToast(`"${game.title}" is already downloading!`, "info");
      return;
    }

    setMockDownloads(prev => {
      // Remove any completed entry first to let them re-simulate
      const filtered = prev.filter(d => d.id !== game.id);
      return [
        ...filtered,
        {
          id: game.id,
          title: game.title,
          filename: game.filename,
          progress: 0,
          speed_mbs: 45,
          size_bytes: game.size_bytes,
          status: "downloading"
        }
      ];
    });

    triggerMockToast(`Download queued: ${game.title}`, "success");
    setMockActiveTab("downloads");
  };

  const handlePlayGame = (game: LibraryGame) => {
    if (mockRunningGameId) {
      triggerMockToast("Another game is currently running!", "error");
      return;
    }
    setLaunchingGame(game);
    setTimeout(() => {
      setLaunchingGame(null);
      setMockRunningGameId(game.id);
      triggerMockToast(`Launched ${game.title}! Playtime tracker is active.`, "success");
    }, 2000);
  };

  const handleStopGame = () => {
    const running = mockLibrary.find(l => l.id === mockRunningGameId);
    if (running) {
      triggerMockToast(`Stopped ${running.title}. Saved playtime.`, "info");
    }
    setMockRunningGameId(null);
  };

  const handleOpenPurchase = (e: React.MouseEvent, tier: "1-month" | "1-year" | "lifetime") => {
    e.preventDefault();
    setSelectedPurchaseTier(tier);
    setIsPurchaseModalOpen(true);
  };

  const handleAddGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addGameTitle.trim()) {
      triggerMockToast("Game title is required", "error");
      return;
    }
    
    setIsAddingGame(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      };

      const tableMap = {
        standard: "games",
        online: "online_games",
        installer: "installer_games"
      };

      const tableName = tableMap[addGameSource];
      const sizeBytes = parseFloat(addGameSizeGB) * 1024 * 1024 * 1024;
      
      const payload = {
        title: addGameTitle,
        filename: addGameFilename || `${addGameTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.zip`,
        description: addGameDescription || "No description available.",
        genre: addGameGenre || "General",
        size_bytes: Math.round(sizeBytes),
        release_year: parseInt(addGameYear) || new Date().getFullYear(),
        thumbnail_url: addGameThumbnail || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
        downloads_count: 0,
        likes_count: 0
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Supabase insert failed: ${response.statusText}`);
      }

      const returnedData = await response.json();
      const insertedItem = returnedData[0];

      // Map the newly inserted item
      const newGame: CatalogueFile = {
        id: (insertedItem.id || Math.random()).toString(),
        title: insertedItem.title,
        filename: insertedItem.filename,
        description: insertedItem.description || "No description available.",
        genre: insertedItem.genre || "General",
        size_bytes: insertedItem.size_bytes || 0,
        release_year: insertedItem.release_year || new Date().getFullYear(),
        downloads_count: insertedItem.downloads_count || 0,
        likes_count: insertedItem.likes_count || 0,
        thumbnail_url: insertedItem.thumbnail_url || "",
        backdrop_url: insertedItem.thumbnail_url || "",
        source: addGameSource
      };

      // Update gamesList state directly
      setGamesList(prev => [newGame, ...prev]);
      triggerMockToast(`Successfully added "${addGameTitle}" to Supabase!`, "success");
      
      // Reset form
      setAddGameTitle("");
      setAddGameFilename("");
      setAddGameDescription("");
      setAddGameGenre("");
      setAddGameSizeGB("5.0");
      setAddGameYear(new Date().getFullYear().toString());
      setAddGameThumbnail("");
      setIsAddGameOpen(false);
    } catch (err) {
      console.error(err);
      triggerMockToast("Error inserting game to Supabase", "error");
    } finally {
      setIsAddingGame(false);
    }
  };

  // Catalogue logic filtering
  const getFilteredCatalogueGames = (): CatalogueFile[] => {
    return gamesList.filter(game => {
      // Source filter
      if (game.source !== mockCatalogSource) return false;
      // Search filter
      if (mockSearchQuery && !game.title.toLowerCase().includes(mockSearchQuery.toLowerCase())) return false;
      // Genre filter
      if (mockFilterGenres.length > 0) {
        const gameGenres = game.genre.split(",").map(s => s.trim().toLowerCase());
        const matches = mockFilterGenres.some(f => gameGenres.includes(f.toLowerCase()));
        if (!matches) return false;
      }
      // Year range filter
      if (game.release_year < mockFilterYearRange[0] || game.release_year > mockFilterYearRange[1]) return false;
      // Size filter
      if (mockFilterSize) {
        const sizeGB = game.size_bytes / (1024 * 1024 * 1024);
        if (mockFilterSize === "small" && sizeGB >= 5) return false;
        if (mockFilterSize === "medium" && (sizeGB < 5 || sizeGB > 15)) return false;
        if (mockFilterSize === "large" && (sizeGB < 15 || sizeGB > 50)) return false;
        if (mockFilterSize === "huge" && sizeGB <= 50) return false;
      }
      return true;
    });
  };

  // Home Page sorting
  const getHomeGridGames = (): CatalogueFile[] => {
    const base = [...gamesList];
    if (mockHomeTab === "hot") {
      return base.sort((a, b) => b.downloads_count - a.downloads_count).slice(0, 5);
    } else if (mockHomeTab === "latest") {
      return base.sort((a, b) => b.release_year - a.release_year).slice(0, 5);
    } else {
      return base.filter(g => g.genre.includes("RPG") || g.genre.includes("Adventure"))
                 .sort((a, b) => b.likes_count - a.likes_count).slice(0, 5);
    }
  };

  const handleSurpriseMe = () => {
    const randomGame = gamesList[Math.floor(Math.random() * gamesList.length)];
    setMockSelectedGame(randomGame);
    setMockActiveTab("catalogue");
    triggerMockToast(`Curated recommendation: ${randomGame.title}`, "info");
  };

  // Sidebar dynamic games filter
  const sidebarSearchFiltered = mockLibrary.filter(g => 
    g.title.toLowerCase().includes(mockSearchQuery.toLowerCase())
  ).sort((a, b) => {
    const aPinned = mockPinned.includes(a.id);
    const bPinned = mockPinned.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-brand-dark text-white selection:bg-brand-redLight selection:text-white font-sans antialiased overflow-x-hidden">
      {/* ── Background Gradients ── */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-red/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] right-1/4 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-brand-dark/75 border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/app-icon.png" alt="Reiya Logo" className="w-14 h-14 object-contain" />
            <span className="font-outfit text-xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-brand-orangeLight bg-clip-text text-transparent">
              Reiya Library
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-textMuted">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#mockup" className="hover:text-white transition-colors">Interface</a>
            <a href="#pricing" className="hover:text-white transition-colors">Subscriptions</a>
            <a href="#install" className="hover:text-white transition-colors">Setup</a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={release.downloadUrl}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-redLight hover:to-brand-orangeLight text-white text-sm font-semibold tracking-wide shadow-lg shadow-brand-red/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              Download
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-darkLighter border border-brand-border mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
            <span className="text-xs font-semibold text-brand-orangeLight tracking-wider uppercase">
              Latest Version Available
            </span>
          </div>

          <h1 className="font-outfit text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
            Your Games, Uncluttered. <br />
            <span className="bg-gradient-to-r from-brand-redLight via-brand-orangeLight to-[#ff7b00] bg-clip-text text-transparent">
              Silently Powerful.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-brand-textMuted leading-relaxed mb-10">
            Reiya Library is a custom, high-performance desktop game client designed to act as your central gaming hub. Browse catalogs, manage high-speed downloads, track playtime, and launch games seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href={release.downloadUrl}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-redLight hover:to-brand-orangeLight text-white font-bold tracking-wide shadow-xl shadow-brand-red/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-brand-red/40 flex items-center justify-center gap-3"
            >
              <Download className="w-5 h-5" />
              Download for Windows
            </a>
            
            {/* GitHub button removed */}
          </div>

          <div className="text-xs text-brand-textMuted flex items-center justify-center gap-4">
            <span>Client Version: <strong className="text-white">{release.version}</strong></span>
            {release.publishedAt && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-border" />
                <span>Released on: <strong className="text-white">{release.publishedAt}</strong></span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Client Interface Mockup ── */}
      <section id="mockup" className="pb-24 md:pb-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Dashboard Active Header (Game Playing overlay) */}
          {mockRunningGameId && (
            <div className="max-w-md mx-auto mb-4 bg-gradient-to-r from-brand-red/90 to-brand-orange/95 border border-brand-red shadow-lg rounded-xl px-4 py-3 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  🎮 Running: {mockLibrary.find(l => l.id === mockRunningGameId)?.title}
                </span>
              </div>
              <button 
                onClick={handleStopGame}
                className="bg-black/35 hover:bg-black/55 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md transition-colors"
              >
                Stop Game
              </button>
            </div>
          )}

          <div className="relative rounded-2xl border border-brand-border bg-[#0f0f0f] shadow-2xl p-0 backdrop-blur-xl overflow-hidden select-none">
            {/* ── Mockup Header / Window Controls ── */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a2a] bg-[#161616]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="text-xs text-[#a0a0a0] font-medium tracking-wide">
                Reiya Library Desktop Client
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-3 h-0.5 bg-white" />
                <div className="w-3 h-3 border border-white rounded-sm" />
                <X className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* ── Desktop Grid Shell ── */}
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] min-h-[580px] text-[#f0f0f0]">
              
              {/* ── Sidebar ── */}
              <div className="bg-[#161616] border-b md:border-b-0 md:border-r border-[#2a2a2a] flex flex-col no-scrollbar overflow-y-auto">
                {/* Logo Section */}
                <div className="p-4 border-b border-[#2a2a2a] flex items-center gap-2.5">
                  <img src="/app-icon.png" alt="Reiya Library" className="w-10 h-10 object-contain flex-shrink-0" />
                  <div>
                    <div className="text-[13px] font-bold leading-none">Reiya Library</div>
                    <div className="text-[10px] text-[#6a6a6a] mt-1.5 leading-none">Game catalogue</div>
                  </div>
                </div>

                {/* Primary Nav Items */}
                <div className="p-2 flex flex-col gap-0.5">
                  {[
                    { id: "home", label: "Home", icon: <Home className="w-3.5 h-3.5" /> },
                    { id: "catalogue", label: "Catalogue", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                    { id: "library", label: "Library", icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { id: "downloads", label: "Downloads", icon: <Download className="w-3.5 h-3.5" /> },
                    { id: "settings", label: "Settings", icon: <Settings className="w-3.5 h-3.5" /> }
                  ].map((item) => {
                    const isActive = mockActiveTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setMockActiveTab(item.id as any);
                          setMockSelectedGame(null);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-bold transition-all text-left ${
                          isActive 
                            ? "bg-[#2a2a2a] text-[#f0f0f0] border-l-2 border-[#e74c3c]" 
                            : "text-[#a0a0a0] hover:bg-[#252525] hover:text-[#f0f0f0]"
                        }`}
                      >
                        <span className={isActive ? "text-[#e74c3c]" : "text-[#a0a0a0]"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                        
                        {item.id === "downloads" && mockDownloads.filter(d => d.status === "downloading").length > 0 && (
                          <span className="ml-auto bg-[#c0392b] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                            {mockDownloads.filter(d => d.status === "downloading").length}
                          </span>
                        )}
                        {item.id === "library" && mockLibrary.length > 0 && (
                          <span className="ml-auto bg-white/5 text-[#6a6a6a] text-[9px] font-semibold px-1.5 py-0.2 rounded border border-white/5">
                            {mockLibrary.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-[#2a2a2a] my-1" />

                {/* Collections Section */}
                <div className="flex flex-col">
                  <div 
                    onClick={() => setSidebarCollectionsOpen(!sidebarCollectionsOpen)}
                    className="px-3 py-1.5 flex justify-between items-center text-[9px] uppercase tracking-wider text-[#6a6a6a] font-bold cursor-pointer hover:text-white"
                  >
                    <span>Collections</span>
                    <div className="flex items-center gap-1">
                      <Plus className="w-2.5 h-2.5" />
                      <ChevronDown className={`w-2.5 h-2.5 transition-transform ${sidebarCollectionsOpen ? "" : "-rotate-90"}`} />
                    </div>
                  </div>
                  {sidebarCollectionsOpen && (
                    <button
                      onClick={() => {
                        setMockActiveTab("library");
                        setMockSelectedGame(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-[#a0a0a0] hover:bg-[#252525] hover:text-[#f0f0f0] text-left"
                    >
                      <Heart className="w-3.5 h-3.5 text-[#e74c3c]" />
                      <span>Favorites</span>
                      {mockFavorites.length > 0 && (
                        <span className="ml-auto bg-white/5 text-[#6a6a6a] text-[9px] font-semibold px-1.5 py-0.2 rounded border border-white/5">
                          {mockFavorites.length}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="border-t border-[#2a2a2a] my-1" />

                {/* Games Section (Filter list) */}
                <div className="flex flex-col flex-1 min-h-[140px]">
                  <div 
                    onClick={() => setSidebarGamesOpen(!sidebarGamesOpen)}
                    className="px-3 py-1.5 flex justify-between items-center text-[9px] uppercase tracking-wider text-[#6a6a6a] font-bold cursor-pointer hover:text-white"
                  >
                    <span>Games</span>
                    <div className="flex items-center gap-1">
                      <Plus className="w-2.5 h-2.5" />
                      <ChevronDown className={`w-2.5 h-2.5 transition-transform ${sidebarGamesOpen ? "" : "-rotate-90"}`} />
                    </div>
                  </div>
                  
                  {sidebarGamesOpen && (
                    <div className="flex flex-col flex-1">
                      <div className="px-3 py-1">
                        <div className="relative">
                          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6a6a6a]" />
                          <input
                            type="text"
                            placeholder="Filter library..."
                            value={mockSearchQuery}
                            onChange={(e) => setMockSearchQuery(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded px-2 py-0.8 pl-7 text-[10px] text-[#f0f0f0] outline-none placeholder-[#6a6a6a]"
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto max-h-[160px] p-1 flex flex-col gap-0.5 no-scrollbar">
                        {sidebarSearchFiltered.map(game => {
                          const isSelected = mockActiveTab === "library" && mockSelectedGame?.id === game.id;
                          const isPinned = mockPinned.includes(game.id);
                          return (
                            <button
                              key={game.id}
                              onClick={() => {
                                setMockActiveTab("library");
                                const catGame = gamesList.find(g => g.id === game.id);
                                if (catGame) setMockSelectedGame(catGame);
                              }}
                              className={`w-full flex items-center gap-2 px-2 py-1 rounded text-[11px] font-medium text-left truncate transition-colors ${
                                isSelected ? "bg-[#2a2a2a] text-white" : "text-[#a0a0a0] hover:bg-[#1e1e1e] hover:text-white"
                              }`}
                            >
                              <div className="w-4 h-4 rounded bg-gradient-to-br from-brand-red/20 to-brand-orange/20 border border-white/5 flex items-center justify-center text-[7px] text-[#a0a0a0] flex-shrink-0 relative overflow-hidden">
                                {game.thumbnail_url ? (
                                  <img src={game.thumbnail_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <Gamepad2 className="w-2.5 h-2.5 opacity-60 text-brand-orangeLight" />
                                )}
                                {isPinned && (
                                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                                    <Pin className="w-2.5 h-2.5 text-brand-orange" />
                                  </div>
                                )}
                              </div>
                              <span className="truncate flex-1">{game.title}</span>
                              {mockRunningGameId === game.id && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f] animate-pulse flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                        {sidebarSearchFiltered.length === 0 && (
                          <div className="text-[10px] text-[#6a6a6a] px-3 py-2">No games found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Widget */}
                <div className="mt-auto border-t border-[#2a2a2a] p-3.5 flex items-center gap-2 bg-[#12141c]/50">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-red/40 to-brand-orange/40 flex items-center justify-center overflow-hidden border border-[#2a2a2a] flex-shrink-0">
                    {settingsProfileImage ? (
                      <img src={settingsProfileImage} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate leading-tight">uonwrud8...</div>
                    <div className="text-[9px] text-[#6a6a6a] uppercase font-bold tracking-wider leading-none mt-1">Guest</div>
                  </div>
                  <button 
                    onClick={() => triggerMockToast("Notifications: You have 0 pending notifications.", "info")}
                    className="text-[#a0a0a0] hover:text-[#f0f0f0] p-1 rounded hover:bg-[#252525] relative"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-[#e74c3c]" />
                  </button>
                </div>
              </div>

              {/* ── Main Dashboard Body ── */}
              <div className="bg-[#0f0f0f] flex flex-col min-w-0 relative">
                
                {/* ── Subpage Header ── */}
                <div className="px-5 py-3.5 border-b border-[#2a2a2a] flex items-center justify-between bg-[#0f0f0f]/90 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[14px] font-bold text-[#f0f0f0] capitalize flex items-center gap-2">
                      {mockSelectedGame ? (
                        <button 
                          onClick={() => setMockSelectedGame(null)}
                          className="hover:text-white text-[#a0a0a0] text-xs font-semibold mr-1 flex items-center gap-1"
                        >
                          ← Back
                        </button>
                      ) : null}
                      {mockSelectedGame ? mockSelectedGame.title : mockActiveTab}
                    </h2>
                    {!mockSelectedGame && (mockActiveTab === "catalogue" || mockActiveTab === "library") && (
                      <button
                        onClick={() => setIsAddGameOpen(true)}
                        className="px-2.5 py-1 rounded bg-[#2a2a2a] hover:bg-[#333] border border-[#2a2a2a] hover:border-brand-red/35 text-[10px] font-bold text-white flex items-center gap-1.5 transition-all duration-200"
                      >
                        <Plus className="w-3.5 h-3.5 text-brand-redLight" />
                        <span>Add Game</span>
                      </button>
                    )}
                  </div>

                  {/* Pulsing indicator */}
                  <div className="flex items-center gap-2.5">
                    {mockActiveTab === "catalogue" && !mockSelectedGame && (
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => triggerMockToast("Catalogue refreshed successfully!", "success")}
                          className="p-1 rounded hover:bg-[#1e1e1e] text-[#6a6a6a] hover:text-[#a0a0a0]"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                        <div className="flex rounded border border-[#2a2a2a] bg-[#161616] p-0.5">
                          {["square", "grid", "list"].map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setMockLayout(mode as any)}
                              className={`p-1 rounded text-[10px] uppercase font-bold px-2 ${mockLayout === mode ? "bg-[#2a2a2a] text-white" : "text-[#6a6a6a]"}`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {mockActiveTab === "library" && !mockSelectedGame && (
                      <div className="flex rounded border border-[#2a2a2a] bg-[#161616] p-0.5">
                        {["square", "grid", "list", "bigscreen"].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setMockLayout(mode as any)}
                            className={`p-1 rounded text-[10px] uppercase font-bold px-2 ${mockLayout === mode ? "bg-[#2a2a2a] text-white" : "text-[#6a6a6a]"}`}
                          >
                            {mode === "bigscreen" ? "Big Screen" : mode}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="w-2 h-2 rounded-full bg-[#e74c3c] border border-[#c0392b] shadow-glow" />
                  </div>
                </div>

                {/* ── Tab Views Scrollbox ── */}
                <div className="flex-1 overflow-y-auto max-h-[460px] md:max-h-[500px] no-scrollbar">
                  
                  {/* Toast Alerts inside mockup */}
                  {mockToast && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-[#161616] border border-[#2a2a2a] text-xs font-semibold px-4 py-2 rounded-lg shadow-xl flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${mockToast.type === 'success' ? 'bg-[#27c93f]' : mockToast.type === 'error' ? 'bg-[#ff5f56]' : 'bg-[#ffbd2e]'}`} />
                      <span>{mockToast.message}</span>
                    </div>
                  )}

                  {/* Launching Loading Modal */}
                  {launchingGame && (
                    <div className="absolute inset-0 bg-[#0f0f0f]/90 z-50 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-10 h-10 text-brand-red animate-spin" />
                      <div className="text-sm font-bold text-white uppercase tracking-wider">
                        Launching {launchingGame.title}...
                      </div>
                      <div className="text-[11px] text-[#6a6a6a]">
                        Checking dependencies and initializing runtime environment
                      </div>
                    </div>
                  )}

                  {/* VIEW: HOME */}
                  {mockActiveTab === "home" && !mockSelectedGame && (
                    <div className="p-5 flex flex-col gap-6">
                      
                      {/* Premium Hero Carousel */}
                      <div className="relative rounded-xl border border-brand-red/35 bg-gradient-to-r from-brand-red/10 to-brand-orange/5 p-5 overflow-hidden flex flex-col justify-end min-h-[190px]">
                        {/* Background Slide / Gradient */}
                        {featuredGames[carouselIndex].backdrop_url ? (
                          <div className="absolute inset-0 -z-10 bg-cover bg-center transition-all duration-700 opacity-20"
                               style={{ backgroundImage: `url(${featuredGames[carouselIndex].backdrop_url})` }} />
                        ) : (
                          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-red/10 via-brand-orange/5 to-black transition-all duration-700 opacity-30" />
                        )}
                        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/75 to-transparent" />

                        <div className="inline-flex px-2 py-0.5 rounded bg-brand-red/20 border border-brand-red/30 text-brand-redLight text-[9px] font-bold uppercase tracking-widest self-start mb-2.5">
                          Featured Build
                        </div>
                        <h3 className="text-lg font-black text-white leading-tight mb-2">
                          {featuredGames[carouselIndex].title}
                        </h3>
                        <p className="text-[11px] text-[#a0a0a0] max-w-xl leading-relaxed mb-4">
                          {featuredGames[carouselIndex].description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setMockSelectedGame(featuredGames[carouselIndex])}
                              className="px-4 py-2 rounded bg-[#c0392b] hover:bg-[#e74c3c] text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <Gamepad2 className="w-3.5 h-3.5" />
                              View Details
                            </button>
                            <span className="text-[10px] text-[#6a6a6a] font-semibold">
                              {featuredGames[carouselIndex].genre} • {formatSize(featuredGames[carouselIndex].size_bytes)}
                            </span>
                          </div>
                          
                          {/* Dot Navigation */}
                          <div className="flex items-center gap-1.5">
                            {featuredGames.map((_, i) => (
                              <button 
                                key={i}
                                onClick={() => setCarouselIndex(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${carouselIndex === i ? "bg-[#e74c3c] w-3" : "bg-[#6a6a6a]"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Home Page Sorting Bar */}
                      <div className="flex items-center gap-3 border-b border-[#2a2a2a] pb-2">
                        {[
                          { id: "hot", label: "Hot now", icon: <Flame className="w-3 h-3" /> },
                          { id: "latest", label: "Latest releases", icon: <Calendar className="w-3 h-3" /> },
                          { id: "engaging", label: "Engaging stories", icon: <Sparkles className="w-3 h-3" /> }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setMockHomeTab(tab.id as any)}
                            className={`flex items-center gap-1 text-[11px] font-bold pb-2 border-b-2 -mb-2.5 transition-all ${
                              mockHomeTab === tab.id 
                                ? "border-[#e74c3c] text-[#f0f0f0]" 
                                : "border-transparent text-[#6a6a6a] hover:text-[#a0a0a0]"
                            }`}
                          >
                            <span className={mockHomeTab === tab.id ? "text-[#e74c3c]" : ""}>{tab.icon}</span>
                            <span>{tab.label}</span>
                          </button>
                        ))}
                        <button 
                          onClick={handleSurpriseMe}
                          className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e1e1e] hover:bg-[#252525] border border-[#2a2a2a] text-[#a0a0a0] hover:text-white text-[10px] font-bold transition-colors"
                        >
                          <Shuffle className="w-3 h-3" />
                          <span>Surprise Me</span>
                        </button>
                      </div>

                      {/* Rankings grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {getHomeGridGames().map((game, idx) => {
                          const rank = idx + 1;
                          return (
                            <div 
                              key={game.id} 
                              onClick={() => {
                                setMockSelectedGame(game);
                                setMockActiveTab("catalogue");
                              }}
                              className="rounded-xl border border-[#2a2a2a] bg-[#161616]/40 overflow-hidden flex flex-col hover:border-brand-red/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                            >
                              <div className="aspect-[4/3] bg-[#181b28] relative overflow-hidden flex items-center justify-center border-b border-[#2a2a2a]">
                                {game.thumbnail_url ? (
                                  <img src={game.thumbnail_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <Gamepad2 className="w-8 h-8 text-brand-orange opacity-40 animate-pulse" />
                                )}
                                
                                {/* Rank badge */}
                                <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white border border-white/10 ${
                                  rank === 1 ? "bg-gradient-to-br from-[#f1c40f] to-[#f39c12]" :
                                  rank === 2 ? "bg-gradient-to-br from-[#bdc3c7] to-[#95a5a6]" :
                                  rank === 3 ? "bg-gradient-to-br from-[#e67e22] to-[#d35400]" :
                                  "bg-gradient-to-br from-brand-red to-brand-red/80"
                                }`}>
                                  {rank}
                                </div>

                                <div className="absolute top-1.5 left-1.5 bg-black/60 text-[8px] text-[#a0a0a0] px-1.5 py-0.5 rounded border border-white/5">
                                  {game.release_year}
                                </div>
                              </div>
                              <div className="p-2 flex flex-col gap-1.5 justify-between flex-1">
                                <div className="text-[11px] font-bold text-white truncate leading-tight">{game.title}</div>
                                <div className="flex items-center justify-between text-[9px] text-[#6a6a6a]">
                                  <span className="text-brand-orange font-bold uppercase text-[7.5px] px-1 rounded bg-brand-orange/5 border border-brand-orange/10">
                                    {game.genre.split(",")[0]}
                                  </span>
                                  <span>{formatSize(game.size_bytes)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Collection Insights */}
                      <div className="border-t border-[#2a2a2a] pt-4">
                        <h4 className="text-[10px] uppercase font-bold text-brand-orangeLight flex items-center gap-1.5 mb-3 tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" />
                          Collection Insights
                        </h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { 
                              title: "Total Size", 
                              value: mockLibrary.length > 0 
                                ? formatSize(mockLibrary.reduce((acc, curr) => acc + curr.size_bytes, 0))
                                : "0.0 GB", 
                              sub: `Across ${mockLibrary.length} games`, 
                              subColor: "text-brand-orange" 
                            },
                            { 
                              title: "Time Played", 
                              value: mockLibrary.length > 0
                                ? formatPlaytime(mockLibrary.reduce((acc, curr) => acc + curr.play_time_secs, 0))
                                : "0 hrs", 
                              sub: "In-game duration", 
                              subColor: "text-brand-redLight" 
                            },
                            { 
                              title: "Favorites", 
                              value: mockFavorites.length.toString(), 
                              sub: "Curated collection", 
                              subColor: "text-[#a0a0a0]" 
                            },
                            { 
                              title: "Download Queue", 
                              value: mockDownloads.filter(d => d.status === "downloading").length.toString(), 
                              sub: mockDownloads.some(d => d.status === "downloading") ? "Actively downloading" : "Idle / Seeding", 
                              subColor: mockDownloads.some(d => d.status === "downloading") ? "text-[#27c93f]" : "text-[#6a6a6a]" 
                            }
                          ].map((stat, i) => (
                            <div key={i} className="border border-[#2a2a2a] bg-[#161616]/40 rounded-xl p-3 flex flex-col gap-1">
                              <div className="text-[8.5px] font-bold text-[#6a6a6a] uppercase tracking-wider">{stat.title}</div>
                              <div className="text-[13px] font-black text-white tracking-tight">{stat.value}</div>
                              <div className={`text-[9px] font-semibold ${stat.subColor}`}>{stat.sub}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* VIEW: CATALOGUE */}
                  {mockActiveTab === "catalogue" && (
                    <div className="flex flex-col md:flex-row gap-4 h-full p-4">
                      
                      {/* Main Catalogue view */}
                      <div className="flex-1 flex flex-col gap-4">
                        {mockSelectedGame ? (
                          /* Game Detail Subpage inside catalogue */
                          <div className="flex flex-col gap-5 text-left">
                            
                            {/* Backdrop Header */}
                            <div className="relative h-[160px] rounded-xl overflow-hidden border border-[#2a2a2a] bg-gradient-to-r from-brand-red/15 to-brand-orange/5 flex items-center p-6">
                              {mockSelectedGame.backdrop_url && (
                                <img src={mockSelectedGame.backdrop_url} className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" alt="" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-black/40 to-transparent" />
                              
                              <button 
                                onClick={() => setMockSelectedGame(null)}
                                className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black text-white text-xs font-bold transition-colors border border-white/5"
                              >
                                ← Back to Catalogue
                              </button>

                              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                                <div>
                                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#e74c3c] bg-[#c0392b]/20 border border-[#c0392b]/30 px-2 py-0.5 rounded-md mb-2 inline-block">
                                    {mockSelectedGame.genre.split(",")[0]}
                                  </span>
                                  <h2 className="text-xl font-black text-white leading-tight">{mockSelectedGame.title}</h2>
                                </div>
                                <div className="text-xs text-[#a0a0a0] font-semibold bg-black/50 px-2.5 py-1 rounded border border-white/5">
                                  Released: {mockSelectedGame.release_year}
                                </div>
                              </div>
                            </div>

                            {/* Details and Actions Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5 mt-1">
                              
                              {/* Left detail description */}
                              <div className="flex flex-col gap-4">
                                <div>
                                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#6a6a6a] mb-1.5">Overview Description</h3>
                                  <p className="text-xs leading-relaxed text-[#a0a0a0] bg-[#161616]/30 p-3 rounded-lg border border-[#2a2a2a]">
                                    {mockSelectedGame.description}
                                  </p>
                                </div>

                                <div className="flex items-center gap-6 text-xs text-[#a0a0a0]">
                                  <div className="flex items-center gap-1.5">
                                    <Download className="w-3.5 h-3.5 text-[#6a6a6a]" />
                                    <span>Downloads: <strong className="text-white font-bold">{mockSelectedGame.downloads_count}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Heart className="w-3.5 h-3.5 text-brand-red" />
                                    <span>Likes: <strong className="text-white font-bold">{mockSelectedGame.likes_count}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-brand-orange" />
                                    <span>File size: <strong className="text-white font-bold">{formatSize(mockSelectedGame.size_bytes)}</strong></span>
                                  </div>
                                </div>
                              </div>

                              {/* Right details box (mirrors & download button) */}
                              <div className="flex flex-col gap-3.5 p-4 rounded-xl border border-[#2a2a2a] bg-[#161616]/40 text-xs">
                                <h4 className="font-bold text-white uppercase tracking-wider text-[10px] text-[#6a6a6a]">Client Actions</h4>
                                
                                {(() => {
                                  const downloaded = mockLibrary.find(l => l.id === mockSelectedGame.id);
                                  const dl = mockDownloads.find(d => d.id === mockSelectedGame.id);
                                  
                                  if (downloaded) {
                                    return (
                                      <button 
                                        onClick={() => handlePlayGame(downloaded)}
                                        className="w-full py-2.5 rounded-lg bg-[#27c93f] hover:bg-[#2ecc71] text-black font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                                      >
                                        <Play className="w-4 h-4 fill-black" />
                                        Play Game
                                      </button>
                                    );
                                  }
                                  if (dl) {
                                    if (dl.status === "downloading") {
                                      return (
                                        <button 
                                          onClick={() => {
                                            setMockDownloads(prev => prev.map(d => d.id === dl.id ? { ...d, status: "paused" as const } : d));
                                            triggerMockToast(`Paused download: ${dl.title}`, "info");
                                          }}
                                          className="w-full py-2.5 rounded-lg bg-brand-orange hover:bg-brand-orangeLight text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors animate-pulse"
                                        >
                                          <Pause className="w-4 h-4" />
                                          Downloading ({dl.progress}%)
                                        </button>
                                      );
                                    } else {
                                      return (
                                        <button 
                                          onClick={() => {
                                            setMockDownloads(prev => prev.map(d => d.id === dl.id ? { ...d, status: "downloading" as const } : d));
                                            triggerMockToast(`Resumed download: ${dl.title}`, "success");
                                            setMockActiveTab("downloads");
                                          }}
                                          className="w-full py-2.5 rounded-lg bg-[#2a2a2a] border border-[#333] hover:bg-[#333] text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                                        >
                                          <Download className="w-4 h-4" />
                                          Resume ({dl.progress}%)
                                        </button>
                                      );
                                    }
                                  }

                                  return (
                                    <button 
                                      onClick={() => handleDownloadGame(mockSelectedGame)}
                                      className="w-full py-2.5 rounded-lg bg-brand-red hover:bg-brand-redLight text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-red/10"
                                    >
                                      <Download className="w-4 h-4" />
                                      Download Game
                                    </button>
                                  );
                                })()}

                                <div className="border-t border-[#2a2a2a] my-1" />

                                <div className="flex flex-col gap-2">
                                  <div className="flex justify-between">
                                    <span className="text-[#6a6a6a]">Source Mirror:</span>
                                    <span className="font-bold text-white capitalize">{mockSelectedGame.source} catalog</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#6a6a6a]">File Name:</span>
                                    <span className="font-mono text-[9px] text-[#a0a0a0] truncate max-w-[120px]" title={mockSelectedGame.filename}>
                                      {mockSelectedGame.filename}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#6a6a6a]">Status:</span>
                                    <span className="text-[#a0a0a0]">Pre-Installed Prompt</span>
                                  </div>
                                </div>
                              </div>

                            </div>

                          </div>
                        ) : (
                          /* Catalogue Search & Grid view */
                          <div className="flex flex-col gap-3.5">
                            
                            {/* Source toggles and search inputs */}
                            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                              <div className="flex rounded-lg border border-[#2a2a2a] bg-[#161616] p-0.5 w-full sm:w-auto">
                                {[
                                  { id: "standard", label: "Standard" },
                                  { id: "online", label: "Online only" },
                                  { id: "installer", label: "Installer" }
                                ].map((source) => (
                                  <button
                                    key={source.id}
                                    onClick={() => setMockCatalogSource(source.id as any)}
                                    className={`flex-1 sm:flex-initial text-[10px] font-bold px-3.5 py-1.5 rounded-md uppercase tracking-wider transition-colors ${
                                      mockCatalogSource === source.id 
                                        ? "bg-[#2a2a2a] text-white" 
                                        : "text-[#6a6a6a] hover:text-[#a0a0a0]"
                                    }`}
                                  >
                                    {source.label}
                                  </button>
                                ))}
                              </div>

                              <div className="relative w-full sm:w-48">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6a6a6a]" />
                                <input
                                  type="text"
                                  placeholder="Search catalogue..."
                                  value={mockSearchQuery}
                                  onChange={(e) => setMockSearchQuery(e.target.value)}
                                  className="w-full bg-[#161616] border border-[#2a2a2a] rounded-md px-3 py-1.5 pl-8 text-xs text-[#f0f0f0] placeholder-[#6a6a6a] outline-none"
                                />
                              </div>
                            </div>

                            {/* Main grid list of catalogue */}
                            {isLoadingGames ? (
                              <div className="border border-[#2a2a2a] bg-[#12141c]/30 rounded-xl flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
                                <Loader2 className="w-8 h-8 text-brand-red animate-spin mb-2.5" />
                                <div className="text-xs font-bold text-[#f0f0f0] mb-1">Loading game catalogs...</div>
                                <p className="text-[11px] text-[#6a6a6a] max-w-[200px] leading-relaxed">
                                  Fetching latest records from Supabase database mirrors...
                                </p>
                              </div>
                            ) : getFilteredCatalogueGames().length === 0 ? (
                              <div className="border border-[#2a2a2a] bg-[#12141c]/30 rounded-xl flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
                                <AlertCircle className="w-10 h-10 text-[#6a6a6a] mb-2.5 animate-pulse" />
                                <div className="text-xs font-bold text-[#f0f0f0] mb-1">No matches found</div>
                                <p className="text-[11px] text-[#6a6a6a] max-w-[200px] leading-relaxed">
                                  Try adjusting your searches or active sidebar filter options.
                                </p>
                              </div>
                            ) : (
                              <div className={`grid gap-3.5 ${
                                mockLayout === "square" ? "grid-cols-2 sm:grid-cols-4" : 
                                mockLayout === "grid" ? "grid-cols-1 sm:grid-cols-2" : 
                                "grid-cols-1"
                              }`}>
                                {getFilteredCatalogueGames().map(game => {
                                  const alreadyInLib = mockLibrary.some(l => l.id === game.id);
                                  
                                  if (mockLayout === "list") {
                                    return (
                                      <div 
                                        key={game.id}
                                        onClick={() => setMockSelectedGame(game)}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-[#2a2a2a] bg-[#161616]/30 hover:border-brand-red/30 cursor-pointer transition-all"
                                      >
                                        <div className="w-10 h-10 rounded bg-[#181b28] border border-white/5 flex items-center justify-center flex-shrink-0 text-brand-orange">
                                          {game.thumbnail_url ? (
                                            <img src={game.thumbnail_url} className="w-full h-full object-cover" alt="" />
                                          ) : (
                                            <Gamepad2 className="w-5 h-5 opacity-60" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs font-bold text-white truncate">{game.title}</div>
                                          <div className="text-[9px] text-[#6a6a6a] mt-0.5">{game.genre}</div>
                                        </div>
                                        <div className="text-[10px] text-[#a0a0a0] font-mono">{formatSize(game.size_bytes)}</div>
                                        {alreadyInLib && (
                                          <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded font-bold uppercase">Library</span>
                                        )}
                                      </div>
                                    );
                                  }

                                  return (
                                    <div 
                                      key={game.id}
                                      onClick={() => setMockSelectedGame(game)}
                                      className="rounded-xl border border-[#2a2a2a] bg-[#161616]/30 hover:border-brand-red/30 cursor-pointer overflow-hidden flex flex-col hover:scale-[1.01] transition-all duration-300 group"
                                    >
                                      <div className={`relative overflow-hidden bg-[#1e1e1e] flex items-center justify-center ${mockLayout === "square" ? "aspect-square" : "aspect-video"}`}>
                                        {game.thumbnail_url ? (
                                          <img src={game.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
                                        ) : (
                                          <Gamepad2 className="w-10 h-10 text-brand-orange opacity-40 group-hover:scale-110 transition-transform duration-300" />
                                        )}
                                        <div className="absolute top-1.5 left-1.5 bg-black/60 text-[8px] font-bold text-[#a0a0a0] px-1.5 py-0.5 rounded border border-white/5">
                                          {game.release_year}
                                        </div>
                                        {alreadyInLib && (
                                          <div className="absolute top-1.5 right-1.5 bg-[#27c93f] text-black font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded shadow">
                                            Installed
                                          </div>
                                        )}
                                      </div>
                                      <div className="p-2.5 flex flex-col justify-between flex-1 gap-1">
                                        <div className="text-xs font-bold text-white truncate">{game.title}</div>
                                        <div className="flex items-center justify-between text-[9px] text-[#6a6a6a]">
                                          <span className="text-brand-orange font-bold uppercase text-[7.5px] px-1 rounded bg-[#e67e22]/5 border border-[#e67e22]/10">
                                            {game.genre.split(",")[0]}
                                          </span>
                                          <span>{formatSize(game.size_bytes)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                          </div>
                        )}
                      </div>

                      {/* Right Panel Filters (RightPanel.tsx mockup) */}
                      {showRightPanel && (
                        <div className="w-full md:w-36 border-t md:border-t-0 md:border-l border-[#2a2a2a] pt-4 md:pt-0 md:pl-3.5 flex flex-col gap-4 select-none text-left flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[#6a6a6a] tracking-wider">Filters</span>
                            {(mockFilterGenres.length > 0 || mockFilterSize || mockFilterYearRange[0] !== 1995 || mockFilterYearRange[1] !== 2026) && (
                              <button 
                                onClick={() => {
                                  setMockFilterGenres([]);
                                  setMockFilterSize(null);
                                  setMockFilterYearRange([1995, 2026]);
                                  triggerMockToast("Filters cleared", "info");
                                }}
                                className="text-[9px] font-bold text-[#e74c3c] hover:underline"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          {/* Release Year */}
                          <div className="flex flex-col gap-1.5">
                            <div className="text-[9px] font-bold text-[#a0a0a0] uppercase">Release Year</div>
                            
                            {/* Year checklist simulation */}
                            <div className="flex flex-col gap-1">
                              {[
                                { label: "2025 - 2026", range: [2025, 2026] },
                                { label: "2023 - 2024", range: [2023, 2024] },
                                { label: "All Years", range: [1995, 2026] }
                              ].map((item, i) => {
                                const active = mockFilterYearRange[0] === item.range[0] && mockFilterYearRange[1] === item.range[1];
                                return (
                                  <button
                                    key={i}
                                    onClick={() => setMockFilterYearRange(item.range as any)}
                                    className={`text-[9px] text-left px-2 py-1 rounded transition-colors ${
                                      active ? "bg-[#2a2a2a] text-white font-bold" : "text-[#6a6a6a] hover:bg-[#1e1e1e]"
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Genres */}
                          <div className="flex flex-col gap-1.5">
                            <div className="text-[9px] font-bold text-[#a0a0a0] uppercase">Genres</div>
                            <div className="flex flex-col gap-1">
                              {["Action", "Adventure", "RPG", "Strategy", "Indie"].map((genre) => {
                                const checked = mockFilterGenres.includes(genre);
                                return (
                                  <label key={genre} className="flex items-center gap-1.5 text-[10px] text-[#6a6a6a] font-semibold cursor-pointer hover:text-white">
                                    <input 
                                      type="checkbox" 
                                      checked={checked}
                                      onChange={() => {
                                        setMockFilterGenres(prev => 
                                          checked ? prev.filter(g => g !== genre) : [...prev, genre]
                                        );
                                      }}
                                      className="rounded bg-[#1e1e1e] border-[#2a2a2a] text-brand-red focus:ring-0 w-2.5 h-2.5" 
                                    />
                                    <span>{genre}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Size */}
                          <div className="flex flex-col gap-1.5">
                            <div className="text-[9px] font-bold text-[#a0a0a0] uppercase">File Size</div>
                            <div className="flex flex-col gap-1">
                              {[
                                { name: "small", label: "< 5 GB" },
                                { name: "medium", label: "5 - 15 GB" },
                                { name: "large", label: "15 - 50 GB" },
                                { name: "huge", label: "> 50 GB" }
                              ].map((size) => {
                                const checked = mockFilterSize === size.name;
                                return (
                                  <label key={size.name} className="flex items-center gap-1.5 text-[10px] text-[#6a6a6a] font-semibold cursor-pointer hover:text-white">
                                    <input 
                                      type="checkbox" 
                                      checked={checked}
                                      onChange={() => {
                                        setMockFilterSize(checked ? null : size.name);
                                      }}
                                      className="rounded bg-[#1e1e1e] border-[#2a2a2a] text-brand-red focus:ring-0 w-2.5 h-2.5" 
                                    />
                                    <span>{size.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VIEW: LIBRARY */}
                  {mockActiveTab === "library" && (
                    <div className="p-4 flex flex-col gap-4 text-left">
                      {/* Controls header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#6a6a6a] uppercase font-bold">Sort by</span>
                          <select 
                            onChange={(e) => triggerMockToast(`Sorted library by ${e.target.value}`, "info")}
                            className="bg-[#161616] border border-[#2a2a2a] rounded px-2 py-1 text-[10px] font-semibold text-white outline-none cursor-pointer"
                          >
                            <option value="title">Title (A - Z)</option>
                            <option value="playtime">Playtime</option>
                            <option value="size">Size</option>
                          </select>
                        </div>
                        <div className="text-[10px] text-[#6a6a6a] font-semibold">
                          Total games in library: {mockLibrary.length}
                        </div>
                      </div>

                      {mockLibrary.length === 0 ? (
                        <div className="border border-[#2a2a2a] bg-[#12141c]/30 rounded-xl flex flex-col items-center justify-center p-8 text-center min-h-[260px]">
                          <BookOpen className="w-10 h-10 text-[#6a6a6a] mb-2.5 animate-pulse" />
                          <div className="text-xs font-bold text-[#f0f0f0] mb-1">Your library is empty</div>
                          <p className="text-[11px] text-[#6a6a6a] max-w-[240px] leading-relaxed mb-4">
                            Downloaded game setups from synced catalogs will appear here, ready to run.
                          </p>
                          <button 
                            onClick={() => setMockActiveTab("catalogue")}
                            className="px-4 py-2 rounded bg-[#c0392b] hover:bg-[#e74c3c] text-white text-[11px] font-bold transition-all shadow-lg shadow-brand-red/10"
                          >
                            Explore Catalogue
                          </button>
                        </div>
                      ) : mockLayout === "bigscreen" ? (
                        /* Premium PS4 Console Style Layout */
                        <div className="flex flex-col gap-4 bg-[#111] p-5 rounded-xl border border-[#2a2a2a] overflow-hidden select-none">
                          <div className="flex items-center gap-2 mb-2">
                            <Tv2 className="w-4 h-4 text-brand-orange animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0]">
                              Big Screen Console View
                            </span>
                          </div>

                          <div className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar">
                            {mockLibrary.map((game) => {
                              const isFav = mockFavorites.includes(game.id);
                              return (
                                <div 
                                  key={game.id}
                                  className="w-[180px] flex-shrink-0 flex flex-col rounded-xl border border-[#2a2a2a] bg-[#161616]/70 p-3 hover:border-brand-red/60 hover:scale-[1.03] transition-all cursor-pointer group"
                                >
                                  <div className="aspect-[4/5] rounded-lg overflow-hidden bg-black/40 relative flex items-center justify-center">
                                    {game.thumbnail_url ? (
                                      <img src={game.thumbnail_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <Gamepad2 className="w-10 h-10 text-brand-orange opacity-40" />
                                    )}
                                    {isFav && (
                                      <div className="absolute top-1.5 right-1.5 p-1 rounded bg-black/60 border border-white/5 text-brand-red">
                                        <Heart className="w-3 h-3 fill-current" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-3 flex flex-col gap-1">
                                    <div className="text-xs font-black truncate group-hover:text-brand-orange transition-colors">{game.title}</div>
                                    <div className="text-[10px] text-[#6a6a6a] font-semibold">{formatPlaytime(game.play_time_secs)}</div>
                                    
                                    <button 
                                      onClick={() => handlePlayGame(game)}
                                      className="mt-2 w-full py-1.5 bg-brand-red hover:bg-brand-redLight text-white font-bold text-[10px] uppercase rounded-md flex items-center justify-center gap-1 transition-colors"
                                    >
                                      <Play className="w-3 h-3 fill-white" />
                                      Play
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* Standard Layout Cards */
                        <div className={`grid gap-3.5 ${
                          mockLayout === "square" ? "grid-cols-2 sm:grid-cols-4" : 
                          mockLayout === "grid" ? "grid-cols-1 sm:grid-cols-2" : 
                          "grid-cols-1"
                        }`}>
                          {librarySearchFiltered.map(game => {
                            const isFav = mockFavorites.includes(game.id);
                            const isPinned = mockPinned.includes(game.id);
                            
                            if (mockLayout === "list") {
                              return (
                                <div 
                                  key={game.id}
                                  className="flex items-center justify-between p-3 rounded-lg border border-[#2a2a2a] bg-[#161616]/30 hover:border-brand-red/35 group transition-colors"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded bg-[#181b28] border border-white/5 flex items-center justify-center flex-shrink-0 text-brand-orange">
                                      {game.thumbnail_url ? (
                                        <img src={game.thumbnail_url} className="w-full h-full object-cover" alt="" />
                                      ) : (
                                        <Gamepad2 className="w-4 h-4 opacity-60" />
                                      )}
                                    </div>
                                    <div className="truncate">
                                      <div className="text-xs font-bold text-white truncate">{game.title}</div>
                                      <div className="text-[9px] text-[#6a6a6a] mt-0.5">{formatPlaytime(game.play_time_secs)}</div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2.5">
                                    <span className="text-[9px] font-mono text-[#6a6a6a]">{formatSize(game.size_bytes)}</span>
                                    <button 
                                      onClick={() => handlePlayGame(game)}
                                      className="px-3.5 py-1 bg-brand-red hover:bg-brand-redLight text-white text-[10px] font-bold rounded uppercase tracking-wider transition-colors"
                                    >
                                      Play
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setMockFavorites(prev => isFav ? prev.filter(id => id !== game.id) : [...prev, game.id]);
                                        triggerMockToast(isFav ? "Removed from favorites" : "Added to favorites", "info");
                                      }}
                                      className={`p-1 rounded hover:bg-[#252525] ${isFav ? 'text-brand-red' : 'text-[#6a6a6a]'}`}
                                    >
                                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div 
                                key={game.id}
                                className="rounded-xl border border-[#2a2a2a] bg-[#161616]/30 overflow-hidden flex flex-col group relative"
                              >
                                <div className={`relative overflow-hidden bg-[#1e1e1e] flex items-center justify-center ${mockLayout === "square" ? "aspect-square" : "aspect-video"}`}>
                                  {game.thumbnail_url ? (
                                    <img src={game.thumbnail_url} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" alt="" />
                                  ) : (
                                    <Gamepad2 className="w-8 h-8 text-brand-orange opacity-40" />
                                  )}
                                  
                                  {/* Custom Action overlays visible on hover */}
                                  <div className="absolute inset-0 bg-[#0f0f0f]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                                    
                                    <button 
                                      onClick={() => handlePlayGame(game)}
                                      className="px-4 py-1.5 bg-[#27c93f] hover:bg-[#2ecc71] text-black font-extrabold text-[10px] uppercase rounded-md flex items-center gap-1.5 transition-colors w-[110px] justify-center"
                                    >
                                      <Play className="w-3 h-3 fill-black" />
                                      Play Game
                                    </button>

                                    <div className="flex gap-1.5 mt-1 justify-center">
                                      <button 
                                        onClick={() => triggerMockToast(`Explorer path: ${settingsExtractionPath}\\${game.id}`, "info")}
                                        className="p-1.5 rounded bg-[#2a2a2a] hover:bg-[#333] text-white text-[9px] flex items-center justify-center"
                                        title="Open Folder"
                                      >
                                        <FolderOpen className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => triggerMockToast(`Metadata Editor: Opened edit module for ${game.title}`, "info")}
                                        className="p-1.5 rounded bg-[#2a2a2a] hover:bg-[#333] text-white text-[9px] flex items-center justify-center"
                                        title="Edit Metadata"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setMockLibrary(prev => prev.filter(l => l.id !== game.id));
                                          triggerMockToast(`Uninstalled: ${game.title} removed.`, "info");
                                        }}
                                        className="p-1.5 rounded bg-[#c0392b]/30 hover:bg-[#c0392b] text-[#ff5f56] hover:text-white text-[9px] flex items-center justify-center border border-[#ff5f56]/15"
                                        title="Remove Game"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Badges on poster */}
                                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                                    <div className="bg-black/60 text-[8px] font-bold text-white px-1.5 py-0.5 rounded border border-white/5">
                                      {formatPlaytime(game.play_time_secs)}
                                    </div>
                                  </div>

                                  <div className="absolute top-2 right-2 flex gap-1">
                                    <button 
                                      onClick={() => {
                                        setMockPinned(prev => isPinned ? prev.filter(id => id !== game.id) : [...prev, game.id]);
                                      }}
                                      className={`p-1 rounded bg-black/60 border border-white/5 ${isPinned ? 'text-brand-orange' : 'text-[#6a6a6a]'}`}
                                    >
                                      <Pin className="w-2.5 h-2.5" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setMockFavorites(prev => isFav ? prev.filter(id => id !== game.id) : [...prev, game.id]);
                                        triggerMockToast(isFav ? "Removed from favorites" : "Added to favorites", "info");
                                      }}
                                      className={`p-1 rounded bg-black/60 border border-white/5 ${isFav ? 'text-brand-red' : 'text-[#6a6a6a]'}`}
                                    >
                                      <Heart className={`w-2.5 h-2.5 ${isFav ? 'fill-current' : ''}`} />
                                    </button>
                                  </div>
                                </div>
                                <div className="p-2 flex flex-col justify-between flex-1 gap-1">
                                  <div className="text-xs font-bold text-white truncate">{game.title}</div>
                                  <div className="flex items-center justify-between text-[9px] text-[#6a6a6a]">
                                    <span className="text-[#a0a0a0] font-semibold">{game.genre.split(",")[0]}</span>
                                    <span>{formatSize(game.size_bytes)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* VIEW: DOWNLOADS */}
                  {mockActiveTab === "downloads" && (
                    <div className="p-4 flex flex-col gap-4 text-left">
                      
                      {/* Active queue title */}
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f] animate-pulse" />
                        <span className="text-[10px] text-[#a0a0a0] font-bold uppercase tracking-wider">
                          Downloader Engines Queue
                        </span>
                      </div>

                      {/* Speed graph layout */}
                      <div className="border border-[#2a2a2a] bg-[#161616]/40 p-4 rounded-xl flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[#6a6a6a] uppercase font-bold text-[9px] block">Current Speed</span>
                            <span className="text-base font-black text-white tracking-tight">{mockDownloadSpeed} MB/s</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[#6a6a6a] uppercase font-bold text-[9px] block">Active Streams</span>
                            <span className="text-xs font-semibold text-[#a0a0a0]">HTTP Direct Engine</span>
                          </div>
                        </div>

                        {/* Speed history SVG graph */}
                        <div className="h-16 w-full bg-black/45 border border-[#2a2a2a] rounded-lg overflow-hidden flex items-end">
                          <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#e74c3c" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#e74c3c" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path 
                              d={`M 0 60 ${mockSpeedHistory.map((val, i) => `L ${(i / (mockSpeedHistory.length - 1)) * 200} ${60 - (val / 80) * 50}`).join(" ")} L 200 60 Z`}
                              fill="url(#speedGrad)"
                            />
                            <polyline 
                              fill="none" 
                              stroke="#e74c3c" 
                              strokeWidth="1.5" 
                              points={mockSpeedHistory.map((val, i) => `${(i / (mockSpeedHistory.length - 1)) * 200},${60 - (val / 80) * 50}`).join(" ")}
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Download List table */}
                      <div className="border border-[#2a2a2a] bg-[#161616]/20 rounded-xl overflow-hidden">
                        <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr] px-3.5 py-2 border-b border-[#2a2a2a] bg-[#161616]/75 text-[9px] font-bold text-[#6a6a6a] uppercase tracking-wider">
                          <div>Name</div>
                          <div>Total Size</div>
                          <div>Download Progress</div>
                          <div className="text-right">Actions</div>
                        </div>

                        <div className="flex flex-col">
                          {mockDownloads.map((item) => (
                            <div key={item.id} className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr] px-3.5 py-3 border-b border-[#2a2a2a] items-center text-xs text-[#a0a0a0]">
                              <div className="font-bold text-white truncate pr-2">{item.title}</div>
                              <div>{formatSize(item.size_bytes)}</div>
                              <div className="flex flex-col gap-1 pr-3">
                                <div className="flex items-center justify-between text-[9px] font-semibold">
                                  <span>{item.status === 'completed' ? 'Completed' : `${item.progress}%`}</span>
                                  {item.status === 'downloading' && (
                                    <span>{item.speed_mbs} MB/s</span>
                                  )}
                                </div>
                                <div className="w-full bg-[#2a2a2a] h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      item.status === 'completed' ? 'bg-[#27c93f]' : 
                                      item.status === 'paused' ? 'bg-brand-orange' : 
                                      'bg-brand-red'
                                    }`}
                                    style={{ width: `${item.progress}%` }} 
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-1.5">
                                {item.status === 'downloading' && (
                                  <button 
                                    onClick={() => {
                                      setMockDownloads(prev => prev.map(d => d.id === item.id ? { ...d, status: 'paused' as const } : d));
                                      triggerMockToast("Download paused", "info");
                                    }}
                                    className="p-1 rounded bg-[#2a2a2a] hover:bg-[#333] text-white"
                                    title="Pause"
                                  >
                                    <Pause className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {item.status === 'paused' && (
                                  <button 
                                    onClick={() => {
                                      setMockDownloads(prev => prev.map(d => d.id === item.id ? { ...d, status: 'downloading' as const } : d));
                                      triggerMockToast("Download resumed", "success");
                                    }}
                                    className="p-1 rounded bg-[#2a2a2a] hover:bg-[#333] text-white"
                                    title="Resume"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => {
                                    setMockDownloads(prev => prev.filter(d => d.id !== item.id));
                                    triggerMockToast("Download cancelled", "info");
                                  }}
                                  className="p-1 rounded bg-[#c0392b]/30 hover:bg-[#c0392b] text-[#ff5f56] hover:text-white"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {mockDownloads.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-[#6a6a6a]">
                              <Download className="w-7 h-7 text-[#2a2a2a] mb-2" />
                              <span>Active queue is empty</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* VIEW: SETTINGS */}
                  {mockActiveTab === "settings" && (
                    <div className="flex flex-col md:flex-row gap-4 p-4 text-left min-h-[460px]">
                      {/* Left Sub-Tab bar */}
                      <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-[#2a2a2a] pr-0 md:pr-4 md:w-36 shrink-0">
                        {[
                          { id: "general", label: "General" },
                          { id: "themes", label: "Themes" },
                          { id: "downloads", label: "Downloads" },
                          { id: "notifications", label: "Notifications" },
                          { id: "about", label: "About" },
                          { id: "account", label: "Account" }
                        ].map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => setSettingsSubTab(sub.id as any)}
                            className={`px-3 py-2 text-left text-xs font-bold rounded-md whitespace-nowrap transition-all ${
                              settingsSubTab === sub.id
                                ? "bg-brand-red/10 text-brand-redLight border-l-2 border-brand-red"
                                : "text-[#a0a0a0] hover:bg-[#202020] hover:text-white"
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>

                      {/* Right Settings Content */}
                      <div className="flex-1 overflow-y-auto pr-1 no-scrollbar flex flex-col gap-4">
                        {settingsSubTab === "general" && (
                          <div className="flex flex-col gap-4">
                            <div className="border border-[#2a2a2a] bg-[#161616]/40 p-4 rounded-xl flex flex-col gap-3 text-xs">
                              <div className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Language Settings</div>
                              <div>
                                <label className="text-[10px] font-semibold text-[#a0a0a0] block mb-1.5">App Display Language</label>
                                <select
                                  value={settingsLanguage}
                                  onChange={(e) => setSettingsLanguage(e.target.value)}
                                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white outline-none"
                                >
                                  <option value="en">English (US)</option>
                                  <option value="fil">Filipino</option>
                                  <option value="es">Español</option>
                                  <option value="fr">Français</option>
                                </select>
                              </div>
                            </div>
                            <div className="border border-[#2a2a2a] bg-[#161616]/40 p-4 rounded-xl flex flex-col gap-3 text-xs">
                              <div className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Startup & Windows Behavior</div>
                              <div className="flex flex-col gap-2.5">
                                {[
                                  { label: "Launch client minimized to tray on system boot", state: settingsBoot, set: setSettingsBoot },
                                  { label: "Close client window to system tray instead of exiting", state: settingsTray, set: setSettingsTray },
                                  { label: "Start client minimized on startup", state: settingsStartMinimized, set: setSettingsStartMinimized },
                                  { label: "Open application directly to Library view", state: settingsOpenToLibrary, set: setSettingsOpenToLibrary }
                                ].map((opt, i) => (
                                  <label key={i} className="flex items-center gap-2.5 text-[#a0a0a0] font-semibold cursor-pointer hover:text-white">
                                    <input 
                                      type="checkbox" 
                                      checked={opt.state}
                                      onChange={(e) => opt.set(e.target.checked)}
                                      className="rounded bg-[#1e1e1e] border-[#2a2a2a] text-brand-red focus:ring-0 w-3.5 h-3.5" 
                                    />
                                    <span>{opt.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsSubTab === "themes" && (
                          <div className="flex flex-col gap-4">
                            <div className="border border-[#2a2a2a] bg-[#161616]/40 p-4 rounded-xl flex flex-col gap-3 text-xs">
                              <div className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">App Customization</div>
                              <div>
                                <label className="text-[10px] font-semibold text-[#a0a0a0] block mb-1.5">Color Theme</label>
                                <select
                                  value={settingsTheme}
                                  onChange={(e) => {
                                    setSettingsTheme(e.target.value);
                                    triggerMockToast(`Applied theme: ${e.target.value}`, "info");
                                  }}
                                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white outline-none"
                                >
                                  <option value="default">Default Dark (Amethyst / Red)</option>
                                  <option value="light">Midnight Slate</option>
                                  <option value="dracula">Dracula Vampiric</option>
                                  <option value="nord">Nordic Frost</option>
                                  <option value="cyberpunk">Cyberpunk Neon</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsSubTab === "downloads" && (
                          <div className="flex flex-col gap-4">
                            <div className="border border-[#2a2a2a] bg-[#161616]/40 p-4 rounded-xl flex flex-col gap-3 text-xs">
                              <div className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Storage Directories</div>
                              <div>
                                <label className="text-[10px] font-semibold text-[#a0a0a0] block mb-1.5">Game Extraction Path</label>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    value={settingsExtractionPath}
                                    onChange={(e) => setSettingsExtractionPath(e.target.value)}
                                    className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white outline-none font-mono" 
                                  />
                                  <button 
                                    onClick={() => triggerMockToast("Storage directory browsed", "info")}
                                    className="px-3 rounded bg-[#2a2a2a] hover:bg-[#333] text-white border border-[#333] font-semibold text-[10px] uppercase transition-colors"
                                  >
                                    Browse
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="border border-[#2a2a2a] bg-[#161616]/40 p-4 rounded-xl flex flex-col gap-3 text-xs">
                              <div className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Download Queue Controls</div>
                              <div className="flex flex-col gap-3">
                                <div>
                                  <label className="text-[10px] font-semibold text-[#a0a0a0] block mb-1.5">Max Concurrent Downloads</label>
                                  <select
                                    value={settingsConcurrentLimit}
                                    onChange={(e) => setSettingsConcurrentLimit(e.target.value)}
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white outline-none"
                                  >
                                    <option value="1">1 Active Download</option>
                                    <option value="2">2 Active Downloads</option>
                                    <option value="3">3 Active Downloads</option>
                                    <option value="5">5 Active Downloads</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-2.5 mt-1">
                                  {[
                                    { label: "Pause ongoing downloads when launching a game", state: settingsPauseOnLaunch, set: setSettingsPauseOnLaunch },
                                    { label: "Auto-open game directory when extraction completes", state: settingsAutoOpenDir, set: setSettingsAutoOpenDir },
                                    { label: "Automatically run installers after download", state: settingsAutoRunInstallers, set: setSettingsAutoRunInstallers },
                                    { label: "Automatically extract downloaded game archives", state: settingsAutoExtract, set: setSettingsAutoExtract },
                                    { label: "Stop seeding/mirror sync on download completed", state: settingsStopSeeding, set: setSettingsStopSeeding },
                                    { label: "Enable silent installation mode (zero console flashes)", state: settingsSilent, set: setSettingsSilent }
                                  ].map((opt, i) => (
                                    <label key={i} className="flex items-center gap-2.5 text-[#a0a0a0] font-semibold cursor-pointer hover:text-white">
                                      <input 
                                        type="checkbox" 
                                        checked={opt.state}
                                        onChange={(e) => opt.set(e.target.checked)}
                                        className="rounded bg-[#1e1e1e] border-[#2a2a2a] text-brand-red focus:ring-0 w-3.5 h-3.5" 
                                      />
                                      <span>{opt.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsSubTab === "notifications" && (
                          <div className="flex flex-col gap-4">
                            <div className="border border-[#2a2a2a] bg-[#161616]/40 p-4 rounded-xl flex flex-col gap-3 text-xs">
                              <div className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Client Alerts</div>
                              <div className="flex flex-col gap-2.5">
                                {[
                                  { label: "Notify when game download completes", state: settingsNotifDlComplete, set: setSettingsNotifDlComplete },
                                  { label: "Notify when new games are added to catalog", state: settingsNotifNewGame, set: setSettingsNotifNewGame },
                                  { label: "Notify when client updates are available", state: settingsNotifUpdate, set: setSettingsNotifUpdate },
                                  { label: "Notify when downloader runs into disk errors", state: settingsNotifDlError, set: setSettingsNotifDlError }
                                ].map((opt, i) => (
                                  <label key={i} className="flex items-center gap-2.5 text-[#a0a0a0] font-semibold cursor-pointer hover:text-white">
                                    <input 
                                      type="checkbox" 
                                      checked={opt.state}
                                      onChange={(e) => opt.set(e.target.checked)}
                                      className="rounded bg-[#1e1e1e] border-[#2a2a2a] text-brand-red focus:ring-0 w-3.5 h-3.5" 
                                    />
                                    <span>{opt.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsSubTab === "about" && (
                          <div className="flex flex-col gap-4">
                            <div className="border border-[#2a2a2a] bg-[#161616]/40 p-4 rounded-xl flex flex-col gap-3 text-xs">
                              <div className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Client Version & Core</div>
                              <div className="flex flex-col gap-1.5 text-xs text-[#a0a0a0]">
                                <div>Desktop Client: <strong className="text-white">Reiya Library {release.version}</strong></div>
                                <div>Core Engine: <strong className="text-white">Rust v1.82.0 (x86_64-pc-windows-msvc)</strong></div>
                                <div>Vite UI Engine: <strong className="text-white">React v19.0.0</strong></div>
                                <div>Status: <strong className="text-emerald-400">Synced & Active</strong></div>
                              </div>
                            </div>
                            <div className="border border-[#2a2a2a] bg-[#161616]/40 p-4 rounded-xl flex flex-col gap-3 text-xs">
                              <div className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Sync Repositories</div>
                              <div>
                                <label className="text-[10px] font-semibold text-[#a0a0a0] block mb-1.5">Mirrors List (one per line)</label>
                                <textarea 
                                  rows={2} 
                                  value={settingsMirrors}
                                  onChange={(e) => setSettingsMirrors(e.target.value)}
                                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white outline-none font-mono resize-none" 
                                />
                                <button 
                                  onClick={() => triggerMockToast("Database catalogs synced successfully!", "success")}
                                  className="mt-2 px-3 py-1.5 bg-brand-red hover:bg-brand-redLight text-white font-bold rounded-md uppercase tracking-wider text-[10px] transition-colors"
                                >
                                  Save & Sync Mirrors
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsSubTab === "account" && (
                          <div className="flex flex-col gap-4">
                            <div className="border border-[#2a2a2a] bg-[#161616]/40 p-4 rounded-xl flex flex-col gap-4 text-xs">
                              <div className="text-[10px] font-bold text-[#6a6a6a] uppercase tracking-wider">Active Account Profile</div>
                              
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-brand-red/10 border border-brand-red/20 flex items-center justify-center overflow-hidden border border-[#2a2a2a] flex-shrink-0 text-brand-redLight font-bold text-lg">
                                  {settingsProfileImage ? (
                                    <img src={settingsProfileImage} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    settingsUserName.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="flex-1 flex flex-col gap-0.5">
                                  <label className="text-[10px] font-semibold text-[#6a6a6a]">Username</label>
                                  <input 
                                    type="text" 
                                    value={settingsUserName}
                                    onChange={(e) => setSettingsUserName(e.target.value)}
                                    className="bg-[#1e1e1e] border border-[#2a2a2a] rounded px-2.5 py-1 text-xs text-white outline-none font-bold mb-1.5"
                                  />
                                  <label className="text-[10px] font-semibold text-[#6a6a6a]">Profile Image URL</label>
                                  <input 
                                    type="text" 
                                    placeholder="https://example.com/avatar.jpg"
                                    value={settingsProfileImage}
                                    onChange={(e) => setSettingsProfileImage(e.target.value)}
                                    className="bg-[#1e1e1e] border border-[#2a2a2a] rounded px-2.5 py-1 text-xs text-white outline-none font-mono"
                                  />
                                </div>
                              </div>

                              <div className="border-t border-[#2a2a2a] pt-3 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[#6a6a6a]">User UUID</span>
                                  <span className="font-mono text-[10px] text-[#a0a0a0] bg-black/30 px-2 py-0.5 rounded border border-white/5">{settingsUserUuid}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[#6a6a6a]">Account Role</span>
                                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-orangeLight bg-brand-orange/10 border border-brand-orange/20 px-2 py-0.5 rounded">{settingsUserRole}</span>
                                </div>
                              </div>

                              <button 
                                type="button"
                                onClick={() => triggerMockToast("Account changes saved", "success")}
                                className="w-full py-2 bg-[#202020] hover:bg-[#2d2d2d] border border-[#2a2a2a] hover:border-brand-red/30 text-white font-bold rounded-md uppercase tracking-wider text-[10px] transition-colors"
                              >
                                Save Profile Changes
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* ── Mockup Footer ── */}
                <div className="h-8 border-t border-[#2a2a2a] bg-[#161616] px-4 flex items-center justify-between text-[10px] text-[#6a6a6a] font-semibold">
                  <div className="flex items-center gap-1.5">
                    {mockDownloads.some(d => d.status === "downloading") ? (
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f] animate-pulse" />
                        <span className="text-white">
                          Downloading: {mockDownloads.find(d => d.status === "downloading")?.title} ({mockDownloads.find(d => d.status === "downloading")?.progress}%)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>No active downloads in progress</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span>Reiya {release.version}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-20 md:py-28 border-t border-brand-border bg-brand-darkLighter/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold text-white mb-4">
              Designed For the Modern PC Gamer
            </h2>
            <p className="text-brand-textMuted">
              Built on optimization and silence, Reiya Library gets out of your way and does the heavy lifting in the background.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-brand-border bg-brand-darkLighter/50 hover:bg-brand-darkCard hover:border-brand-red/20 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-redLight mb-5 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-lg font-bold text-white mb-2">Smart Catalogue Sync</h3>
              <p className="text-sm text-brand-textMuted leading-relaxed">
                Instantly sync game catalogs from multiple remote providers in parallel. In-memory deduplication groups identical mirror downloads under a single, clean game card.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-brand-border bg-brand-darkLighter/50 hover:bg-brand-darkCard hover:border-brand-red/20 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orangeLight mb-5 group-hover:scale-110 transition-transform">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-lg font-bold text-white mb-2">Dual Downloader Engine</h3>
              <p className="text-sm text-brand-textMuted leading-relaxed">
                Native support for high-speed direct HTTP/HTTPS links and BitTorrent protocols with speed limits, pause/resume, and auto-resume prompts on app relaunch.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-brand-border bg-brand-darkLighter/50 hover:bg-brand-darkCard hover:border-brand-red/20 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-lg font-bold text-white mb-2">Auto Metadata Scraper</h3>
              <p className="text-sm text-brand-textMuted leading-relaxed">
                No manual data entry required. Our automated background scrapper fetches high-resolution cover art, descriptions, release years, and genres automatically.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-brand-border bg-brand-darkLighter/50 hover:bg-brand-darkCard hover:border-brand-red/20 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-lg font-bold text-white mb-2">Playtime & Stats Tracker</h3>
              <p className="text-sm text-brand-textMuted leading-relaxed">
                Features a lightweight, background process monitor that checks running processes every 15 seconds to log your gameplay hours and last played dates.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-brand-border bg-brand-darkLighter/50 hover:bg-brand-darkCard hover:border-brand-red/20 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-5 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-lg font-bold text-white mb-2">Zero-Flash Background Runs</h3>
              <p className="text-sm text-brand-textMuted leading-relaxed">
                Everything runs 100% silently in the background. Archive extractions, registry auto-starts, and client updates run invisibly without launching terminal windows.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-brand-border bg-brand-darkLighter/50 hover:bg-brand-darkCard hover:border-brand-red/20 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-5 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-lg font-bold text-white mb-2">Lightweight & Fast</h3>
              <p className="text-sm text-brand-textMuted leading-relaxed">
                Built with a native Rust core, avoiding the heavy memory consumption of standard Electron apps to ensure your PC resources stay focused on the game.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Subscriptions / Store Section ── */}
      <section id="pricing" className="py-20 md:py-28 border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold text-white mb-4">
              Choose Your Subscription
            </h2>
            <p className="text-brand-textMuted">
              Subscriptions are required to access the Reiya Library client and browse our game collections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* 1 Month */}
            <div className="rounded-2xl border border-brand-border bg-brand-darkLighter/40 p-8 flex flex-col hover:border-brand-border/80 transition-all duration-300">
              <div className="text-sm font-bold text-brand-textMuted mb-2 uppercase tracking-wider flex items-center gap-1.5">
                1-Month Pass
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">₱99</span>
                <span className="text-brand-textMuted text-sm font-semibold">PHP</span>
              </div>
              <p className="text-sm text-brand-textMuted mb-6">
                Access the library for 30 days. Perfect to test out the game library and get download access.
              </p>
              <ul className="space-y-3.5 mb-8 text-sm mt-auto">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-brand-orangeLight" />
                  <span>30 Days Client Access</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-brand-orangeLight" />
                  <span>Unlimited Catalogue Syncing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-brand-orangeLight" />
                  <span>Full Downloader Access</span>
                </li>
              </ul>
              <button
                onClick={(e) => handleOpenPurchase(e, "1-month")}
                className="w-full py-3 rounded-xl bg-brand-darkCard border border-brand-border hover:border-brand-textMuted/40 text-center text-sm font-semibold transition-all text-white"
              >
                Get Started
              </button>
            </div>

            {/* 1 Year */}
            <div className="rounded-2xl border-2 border-brand-red bg-brand-darkLighter p-8 flex flex-col relative shadow-xl shadow-brand-red/5 hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-brand-red text-white text-[10px] font-bold uppercase tracking-wider">
                Popular
              </div>
              <div className="text-sm font-bold text-brand-redLight mb-2 uppercase tracking-wider flex items-center gap-1.5">
                1-Year Pass
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">₱299</span>
                <span className="text-brand-textMuted text-sm font-semibold">PHP</span>
              </div>
              <p className="text-sm text-brand-textMuted mb-6">
                Access the library for 365 days. Great value pass. Browse and play games all year round with zero renewals.
              </p>
              <ul className="space-y-3.5 mb-8 text-sm mt-auto">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-brand-redLight" />
                  <span>365 Days Client Access</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-brand-redLight" />
                  <span>Unlimited Catalogue Syncing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-brand-redLight" />
                  <span>Full Downloader Access</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-brand-redLight" />
                  <span>Priority Updates</span>
                </li>
              </ul>
              <button
                onClick={(e) => handleOpenPurchase(e, "1-year")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-redLight hover:to-brand-orangeLight text-center text-sm font-bold shadow-lg shadow-brand-red/10 transition-all text-white"
              >
                Subscribe Now
              </button>
            </div>

            {/* Lifetime */}
            <div className="rounded-2xl border border-brand-border bg-brand-darkLighter/40 p-8 flex flex-col hover:border-brand-border/80 transition-all duration-300">
              <div className="text-sm font-bold text-brand-orangeLight mb-2 uppercase tracking-wider flex items-center gap-1.5">
                Lifetime Access (Best Value!)
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">₱449</span>
                <span className="text-brand-textMuted text-sm font-semibold">PHP</span>
              </div>
              <p className="text-sm text-brand-textMuted mb-6">
                Get permanent, unlimited access to the library with a single one-time payment.
              </p>
              <ul className="space-y-3.5 mb-8 text-sm mt-auto">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-brand-orangeLight" />
                  <span>Permanent Unlimited Access</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-brand-orangeLight" />
                  <span>Unlimited Catalogue Syncing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-brand-orangeLight" />
                  <span>Full Downloader Access</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-brand-orangeLight" />
                  <span>Lifetime Client Updates</span>
                </li>
              </ul>
              <button
                onClick={(e) => handleOpenPurchase(e, "lifetime")}
                className="w-full py-3 rounded-xl bg-brand-darkCard border border-brand-border hover:border-brand-textMuted/40 text-center text-sm font-semibold transition-all text-white"
              >
                Go Lifetime
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Installation Guide Section ── */}
      <section id="install" className="py-20 md:py-28 border-t border-brand-border bg-brand-darkLighter/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold text-white mb-4">
              Quick Setup Guide
            </h2>
            <p className="text-brand-textMuted">
              Install the client and begin playing your game collection in just a few clicks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl border border-brand-border bg-brand-darkLighter/40">
              <div className="absolute top-4 right-6 text-4xl font-extrabold text-white/5">01</div>
              <div className="w-10 h-10 rounded-lg bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-redLight mb-4">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-outfit font-bold text-white mb-2">Download Client</h3>
              <p className="text-sm text-brand-textMuted leading-relaxed">
                Click the download button to retrieve the latest version installer package ({release.version}) from our secure mirrors.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl border border-brand-border bg-brand-darkLighter/40">
              <div className="absolute top-4 right-6 text-4xl font-extrabold text-white/5">02</div>
              <div className="w-10 h-10 rounded-lg bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orangeLight mb-4">
                <MousePointerClick className="w-5 h-5" />
              </div>
              <h3 className="font-outfit font-bold text-white mb-2">Install Invisibly</h3>
              <p className="text-sm text-brand-textMuted leading-relaxed">
                Run the downloaded installer file. The installer completes the setup silently without any terminal flashes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl border border-brand-border bg-brand-darkLighter/40">
              <div className="absolute top-4 right-6 text-4xl font-extrabold text-white/5">03</div>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-4">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h3 className="font-outfit font-bold text-white mb-2">Sync and Play</h3>
              <p className="text-sm text-brand-textMuted leading-relaxed">
                Log into your account, sync the remote catalogue packages, download your game, and launch it directly from the app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 bg-gradient-to-br from-brand-red/20 to-brand-orange/10 border-t border-brand-border">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-outfit text-3xl md:text-5xl font-extrabold text-white mb-6">
            Ready to Build Your Game Hub?
          </h2>
          <p className="text-brand-textMuted text-lg mb-8 max-w-xl mx-auto">
            Grab the latest setup package and start syncing your catalogs right away.
          </p>
          <a
            href={release.downloadUrl}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-redLight hover:to-brand-orangeLight text-white font-bold tracking-wide shadow-xl shadow-brand-red/20 transition-all duration-300 hover:-translate-y-1"
          >
            <Download className="w-5 h-5" />
            Download Reiya Library
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-brand-border bg-brand-dark">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/app-icon.png" alt="Reiya Logo" className="w-7 h-7 object-contain" />
            <span className="font-outfit font-bold text-sm tracking-tight">Reiya Library</span>
          </div>

          <div className="text-xs text-brand-textMuted text-center md:text-left">
            © {new Date().getFullYear()} Reiya Library. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── Add Game Modal Overlay ── */}
      {isAddGameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-brand-border bg-[#161616] p-6 shadow-2xl relative text-left">
            <button 
              onClick={() => setIsAddGameOpen(false)}
              className="absolute top-4 right-4 text-brand-textMuted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-outfit text-xl font-bold text-white mb-1">Add Game to Database</h3>
            <p className="text-xs text-brand-textMuted mb-4">
              Insert a new game record directly into the selected Supabase table.
            </p>

            <form onSubmit={handleAddGameSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-brand-textMuted uppercase">Game Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elden Ring"
                    value={addGameTitle}
                    onChange={(e) => setAddGameTitle(e.target.value)}
                    className="bg-[#0f0f0f] border border-brand-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-brand-textMuted uppercase">Database Table *</label>
                  <select
                    value={addGameSource}
                    onChange={(e) => setAddGameSource(e.target.value as any)}
                    className="bg-[#0f0f0f] border border-brand-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                  >
                    <option value="standard">Standard (games)</option>
                    <option value="online">Online (online_games)</option>
                    <option value="installer">Installer (installer_games)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-brand-textMuted uppercase">Genre(s)</label>
                  <input
                    type="text"
                    placeholder="e.g. Action, RPG"
                    value={addGameGenre}
                    onChange={(e) => setAddGameGenre(e.target.value)}
                    className="bg-[#0f0f0f] border border-brand-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-brand-textMuted uppercase">File Size (GB)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 68.9"
                    value={addGameSizeGB}
                    onChange={(e) => setAddGameSizeGB(e.target.value)}
                    className="bg-[#0f0f0f] border border-brand-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#a0a0a0] uppercase">Filename</label>
                  <input
                    type="text"
                    placeholder="e.g. game-archive.zip"
                    value={addGameFilename}
                    onChange={(e) => setAddGameFilename(e.target.value)}
                    className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#a0a0a0] uppercase">Release Year</label>
                  <input
                    type="number"
                    placeholder="e.g. 2024"
                    value={addGameYear}
                    onChange={(e) => setAddGameYear(e.target.value)}
                    className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-brand-textMuted uppercase">Thumbnail URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  value={addGameThumbnail}
                  onChange={(e) => setAddGameThumbnail(e.target.value)}
                  className="bg-[#0f0f0f] border border-brand-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-red"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-brand-textMuted uppercase">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide details about the repack, version, or crack status..."
                  value={addGameDescription}
                  onChange={(e) => setAddGameDescription(e.target.value)}
                  className="bg-[#0f0f0f] border border-brand-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-red resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isAddingGame}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-redLight hover:to-brand-orangeLight text-white text-sm font-bold tracking-wide shadow-lg shadow-brand-red/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {isAddingGame ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Inserting into Supabase...</span>
                  </>
                ) : (
                  <span>Add Game to Catalog</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Purchase Instructions Modal Overlay ── */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-brand-border bg-[#161616]/95 backdrop-blur-md p-6 shadow-2xl relative text-left overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-red/10 rounded-full blur-2xl pointer-events-none" />
            
            <button 
              onClick={() => setIsPurchaseModalOpen(false)}
              className="absolute top-4 right-4 text-brand-textMuted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6">
              <span className="text-[10px] font-bold text-brand-redLight uppercase tracking-widest">Checkout</span>
              <h3 className="font-outfit text-2xl font-extrabold text-white mt-1">
                {selectedPurchaseTier === "1-month" && "1-Month Pass"}
                {selectedPurchaseTier === "1-year" && "1-Year Pass"}
                {selectedPurchaseTier === "lifetime" && "Lifetime Access"}
                <span className="text-brand-orangeLight">
                  {" — "}
                  {selectedPurchaseTier === "1-month" && "₱99 PHP"}
                  {selectedPurchaseTier === "1-year" && "₱299 PHP"}
                  {selectedPurchaseTier === "lifetime" && "₱449 PHP"}
                </span>
              </h3>
              <p className="text-xs text-brand-textMuted mt-1">
                Please follow the manual payment steps below to purchase your license key.
              </p>
            </div>

            {/* GCash details card */}
            <div className="rounded-xl border border-brand-border bg-brand-darkLighter/50 p-4 mb-6 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-brand-orangeLight uppercase tracking-widest">GCash Number</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-lg font-bold text-white select-all">0930 430 0733</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("09304300733");
                        triggerMockToast("GCash Number copied to clipboard!", "success");
                      }}
                      className="p-1.5 rounded-lg bg-[#222] hover:bg-[#333] border border-brand-border hover:border-brand-textMuted/40 text-brand-textMuted hover:text-white transition-all active:scale-95"
                      title="Copy Number"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-brand-textMuted mt-1">
                    Account Name: <strong className="text-white">ZA****X J** P.</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQrZoomed(true)}
                  className="w-24 h-24 bg-white/5 border border-brand-border hover:border-brand-red/40 rounded-lg p-1.5 flex items-center justify-center shrink-0 cursor-zoom-in transition-all duration-300 hover:scale-105 group/qr relative overflow-hidden"
                  title="Click to Zoom QR Code"
                >
                  <img src="/gcash_qr.png?v=3" alt="GCash QR Code" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">Zoom</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Instruction List */}
            <div className="text-xs text-brand-textMuted leading-relaxed mb-6 space-y-3 bg-brand-darkLighter/20 p-4 rounded-xl border border-brand-border/20">
              <div className="font-bold text-white mb-2 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-brand-redLight" />
                <span>Steps to activate:</span>
              </div>
              
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-redLight flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <span>
                  Send{" "}
                  <strong>
                    {selectedPurchaseTier === "1-month" && "₱99 PHP"}
                    {selectedPurchaseTier === "1-year" && "₱299 PHP"}
                    {selectedPurchaseTier === "lifetime" && "₱449 PHP"}
                  </strong>{" "}
                  to the GCash account above (via Express Send or QR scan).
                </span>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-redLight flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <span>Take a screenshot of the successful GCash transaction receipt.</span>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-redLight flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                <span>Click Discord or Facebook below to send the receipt screenshot to the owner.</span>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-redLight flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
                <span>You will receive your unique User ID (License Key) generated in Supabase. Paste this key in the desktop client under **Settings &gt; Account** to activate.</span>
              </div>
            </div>

            {/* Contact buttons */}
            <div className="grid grid-cols-2 gap-4">
              <a
                href="https://discord.gg/shrQaWJjPh"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold tracking-wide shadow-lg shadow-blue-600/10 transition-all active:scale-[0.98]"
              >
                <MessageSquare className="w-4.5 h-4.5" />
                <span>Buy on Discord</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
              <a
                href="https://www.facebook.com/reiyalib"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1877F2] hover:bg-[#1565C0] text-white text-xs font-bold tracking-wide shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98]"
              >
                <MessageSquare className="w-4.5 h-4.5" />
                <span>Buy on Facebook</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Zoomed QR Code Overlay ── */}
      {isQrZoomed && (
        <div 
          onClick={() => setIsQrZoomed(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-lg md:max-w-xl w-full max-h-[85vh] flex items-center justify-center animate-scaleIn">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsQrZoomed(false);
              }}
              className="absolute top-4 right-4 text-white hover:text-brand-redLight transition-all bg-black/60 hover:bg-black/80 backdrop-blur p-2.5 rounded-full shadow-lg border border-white/10 active:scale-95 z-10"
              title="Close Zoom"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src="/gcash_qr.png?v=3" 
              alt="GCash QR Code Zoomed" 
              className="w-full h-auto max-h-[85vh] object-contain select-none rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
