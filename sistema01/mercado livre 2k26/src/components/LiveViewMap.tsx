import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import {
  X, Users, Eye, ShoppingCart, CreditCard, CheckCircle,
  Monitor, Smartphone, Radio, Wifi, WifiOff, MapPin, 
  Activity, Globe, Server, MousePointer2, Box, BarChart
} from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface LiveVisitor {
  id: string;
  session_id: string;
  city: string | null;
  state: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  current_page: string;
  action: string;
  device: string;
  browser: string;
  product_name: string | null;
  last_seen: string;
  ip_address?: string;
}

// Deterministic hash -> [-0.5, 0.5) based on the session id so overlapping
// visitors in the same city get pulled apart slightly on the map.
function hashToUnit(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000 - 0.5;
}

// Rough degrees-per-km at the equator; for small offsets this is close enough.
const JITTER_DEG = 0.15;

const actionConfig: Record<string, { icon: React.ElementType; label: string; color: string; dotColor: string; bg: string; shadow: string }> = {
  viewing:   { icon: Eye,         label: "Explorando",          color: "text-blue-400",   dotColor: "#3B82F6", bg: "bg-blue-500/10", shadow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]" },
  cart:      { icon: ShoppingCart, label: "No Carrinho",         color: "text-yellow-400", dotColor: "#FBBF24", bg: "bg-yellow-500/10", shadow: "shadow-[0_0_15px_rgba(251,191,36,0.3)]" },
  checkout:  { icon: CreditCard,  label: "Finalizando",         color: "text-orange-400", dotColor: "#FB923C", bg: "bg-orange-500/10", shadow: "shadow-[0_0_20px_rgba(251,146,60,0.4)]" },
  purchased: { icon: CheckCircle, label: "Confirmado!",         color: "text-green-400",  dotColor: "#4ADE80", bg: "bg-green-500/10", shadow: "shadow-[0_0_25px_rgba(74,222,128,0.5)]" },
};

const AndroidIcon = ({ className }: { className?: string }) => (
  <svg fill="currentColor" viewBox="0 0 512 512" className={className}>
    <g id="b75708d097f2188dff6617b0f00f7c43"> <path d="M120.606,169h270.788v220.663c0,13.109-10.628,23.737-23.721,23.737h-27.123v67.203 c0,17.066-13.612,30.897-30.415,30.897c-16.846,0-30.438-13.831-30.438-30.897v-67.203h-47.371v67.203 c0,17.066-13.639,30.897-30.441,30.897c-16.799,0-30.437-13.831-30.437-30.897v-67.203h-27.099 c-13.096,0-23.744-10.628-23.744-23.737V169z M67.541,167.199c-16.974,0-30.723,13.963-30.723,31.2v121.937 c0,17.217,13.749,31.204,30.723,31.204c16.977,0,30.723-13.987,30.723-31.204V198.399 C98.264,181.162,84.518,167.199,67.541,167.199z M391.395,146.764H120.606c3.342-38.578,28.367-71.776,64.392-90.998 l-25.746-37.804c-3.472-5.098-2.162-12.054,2.946-15.525c5.102-3.471,12.044-2.151,15.533,2.943l28.061,41.232 c15.558-5.38,32.446-8.469,50.208-8.469c17.783,0,34.672,3.089,50.229,8.476L334.29,5.395c3.446-5.108,10.41-6.428,15.512-2.957 c5.108,3.471,6.418,10.427,2.946,15.525l-25.725,37.804C363.047,74.977,388.055,108.175,391.395,146.764z M213.865,94.345 c0-8.273-6.699-14.983-14.969-14.983c-8.291,0-14.99,6.71-14.99,14.983c0,8.269,6.721,14.976,14.99,14.976 S213.865,102.614,213.865,94.345z M329.992,94.345c0-8.273-6.722-14.983-14.99-14.983c-8.291,0-14.97,6.71-14.97,14.983 c0,8.269,6.679,14.976,14.97,14.976C323.271,109.321,329.992,102.614,329.992,94.345z M444.48,167.156 c-16.956,0-30.744,13.984-30.744,31.222v121.98c0,17.238,13.788,31.226,30.744,31.226c16.978,0,30.701-13.987,30.701-31.226 v-121.98C475.182,181.14,461.458,167.156,444.48,167.156z" /> </g>
  </svg>
);

const WindowsIcon = ({ className }: { className?: string }) => (
  <svg fill="currentColor" viewBox="-271 287.5 256 226.5" className={className}>
    <g> <path d="M-165.8,398.2c-8.8-4.5-21.1-9.2-34.6-9.2c-1.5,0-3.1,0.1-4.6,0.2c-13.5,1.1-25.8,4.6-34.5,7.6c-2.5,0.9-5.2,1.9-7.9,3 l-23.6,82.1c17.9-7.2,32.4-10.1,44.5-10.1c20,0,33.9,7.7,47.1,16.5c4.9-16.5,21.4-72.9,24.5-83.7 C-158.4,402.4-162,400.2-165.8,398.2z"></path> <path d="M-140.7,415l-23.6,82c0,0,27.6,17,48.4,17c13.1,0,28.8-3.2,48.5-11.3l22.8-79.6c-17.3,6.2-32.2,8.5-44.7,8.5 C-116.9,431.7-133.5,420.8-140.7,415z"></path> <path d="M-195.9,369.2c19.2,0.2,32.8,7.9,45.5,16.3c4.8-16.4,19.2-65.8,24.1-82.5v-0.1c0,0-17-10.2-28.8-13.2 c-5.6-1.3-12-2.2-19.1-2.2c-0.1,0-0.2,0-0.3,0c-12,0.2-26.4,3.1-44.1,10.4l-23.3,82c18.2-7.4,32.9-10.7,45.3-10.7 C-196.4,369.2-196.2,369.2-195.9,369.2z"></path> <path d="M-60.8,330.5c-26,0-43.1-11-50.6-16.9l-23.9,82.8c0.1,0.1,0.2,0.1,0.2,0.2c13.2,8.8,30.3,15.9,50.9,15.9 c13.6,0,28.8-3.1,45.4-10.9v-0.1c0,0,0.1,0,0.2-0.1l23.6-81.3C-32.4,327.7-47.7,330.5-60.8,330.5z"></path> </g>
  </svg>
);

const IPhoneIcon = ({ className }: { className?: string }) => (
  <svg viewBox="-1.5 0 20 20" fill="currentColor" className={className}>
    <path d="M57.5708873,7282.19296 C58.2999598,7281.34797 58.7914012,7280.17098 58.6569121,7279 C57.6062792,7279.04 56.3352055,7279.67099 55.5818643,7280.51498 C54.905374,7281.26397 54.3148354,7282.46095 54.4735932,7283.60894 C55.6455696,7283.69593 56.8418148,7283.03894 57.5708873,7282.19296 M60.1989864,7289.62485 C60.2283111,7292.65181 62.9696641,7293.65879 63,7293.67179 C62.9777537,7293.74279 62.562152,7295.10677 61.5560117,7296.51675 C60.6853718,7297.73474 59.7823735,7298.94772 58.3596204,7298.97372 C56.9621472,7298.99872 56.5121648,7298.17973 54.9134635,7298.17973 C53.3157735,7298.17973 52.8162425,7298.94772 51.4935978,7298.99872 C50.1203933,7299.04772 49.0738052,7297.68074 48.197098,7296.46676 C46.4032359,7293.98379 45.0330649,7289.44985 46.8734421,7286.3899 C47.7875635,7284.87092 49.4206455,7283.90793 51.1942837,7283.88393 C52.5422083,7283.85893 53.8153044,7284.75292 54.6394294,7284.75292 C55.4635543,7284.75292 57.0106846,7283.67793 58.6366882,7283.83593 C59.3172232,7283.86293 61.2283842,7284.09893 62.4549652,7285.8199 C62.355868,7285.8789 60.1747177,7287.09489 60.1989864,7289.62485" transform="translate(-46.0, -7279.0)"></path>
  </svg>
);

const MacOSIcon = ({ className }: { className?: string }) => (
  <svg fill="currentColor" viewBox="0 0 32 32" className={className}>
    <path d="M31,0H1A1,1,0,0,0,0,1V31a1,1,0,0,0,1,1H31a1,1,0,0,0,1-1V1A1,1,0,0,0,31,0ZM2,2H14.36C11.89,7.34,11,15.52,11,15.9a1,1,0,0,0,.25.77A1,1,0,0,0,12,17h4.89a29.9,29.9,0,0,0,.25,7c-.37,0-.75.05-1.14.05A14.07,14.07,0,0,1,5.78,19.38a1,1,0,0,0-1.4-.16,1,1,0,0,0-.16,1.41A15.87,15.87,0,0,0,16,26c.53,0,1.05,0,1.55-.08A18.35,18.35,0,0,0,19.07,30H2ZM30,30H21.39a15.57,15.57,0,0,1-1.86-4.42,15.91,15.91,0,0,0,8.25-4.95,1,1,0,1,0-1.56-1.25,14.13,14.13,0,0,1-7.09,4.24A27.91,27.91,0,0,1,19,16.15,1,1,0,0,0,18,15H13.13c.34-2.59,1.36-9.12,3.46-13H30Z"></path> <path d="M8,13a1,1,0,0,0,1-1V9A1,1,0,0,0,7,9v3A1,1,0,0,0,8,13Z"></path> <path d="M24,13a1,1,0,0,0,1-1V9a1,1,0,0,0-2,0v3A1,1,0,0,0,24,13Z"></path>
  </svg>
);

const LinuxIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 17 17" fill="currentColor" className={className}>
    <path d="M13.849 15.25c-0.509 0.26-1.188 0.832-1.438 1.072-0.188 0.179-0.964 0.269-1.402 0.045-0.509-0.26-0.241-0.671-1.027-0.696-0.393-0.010-0.777-0.010-1.161-0.010-0.339 0.010-0.678 0.027-1.027 0.035-1.178 0.027-1.294 0.787-2.054 0.76-0.518-0.018-1.169-0.429-2.295-0.66-0.786-0.162-1.544-0.205-1.706-0.554-0.16-0.349 0.197-0.741 0.223-1.080 0.027-0.456-0.339-1.072-0.071-1.305 0.232-0.205 0.723-0.054 1.044-0.231 0.339-0.196 0.482-0.349 0.482-0.768 0.125 0.427-0.009 0.775-0.286 0.945-0.17 0.107-0.482 0.161-0.742 0.135-0.205-0.019-0.33 0.008-0.384 0.089-0.080 0.098-0.054 0.277 0.045 0.509 0.098 0.232 0.214 0.384 0.196 0.669-0.009 0.286-0.33 0.626-0.276 0.867 0.018 0.090 0.107 0.17 0.33 0.232 0.357 0.098 1.009 0.196 1.643 0.349 0.706 0.178 1.438 0.499 1.894 0.437 1.357-0.188 0.58-1.643 0.366-1.99-1.152-1.805-1.911-2.983-2.518-2.519-0.152 0.125-0.161-0.304-0.152-0.474 0.027-0.59 0.322-0.803 0.5-1.259 0.339-0.867 0.598-1.857 1.116-2.366 0.387-0.501 0.994-1.313 1.111-1.741-0.099-0.929-0.126-1.911-0.143-2.767-0.018-0.92 0.125-1.725 1.161-2.286 0.249-0.135 0.579-0.188 0.928-0.188 0.616-0.010 1.303 0.17 1.741 0.491 0.697 0.518 1.134 1.616 1.081 2.401-0.036 0.616 0.071 1.25 0.268 1.911 0.232 0.777 0.599 1.321 1.188 1.946 0.706 0.75 1.259 2.223 1.42 3.16 0.143 0.877-0.054 1.421-0.241 1.448-0.286 0.043-0.464 0.945-1.357 0.91-0.571-0.027-0.625-0.366-0.786-0.661-0.259-0.455-0.518-0.312-0.616 0.17-0.054 0.241-0.019 0.599 0.062 0.865 0.161 0.563 0.107 1.090 0.009 1.742-0.188 1.232 0.866 1.464 1.572 0.874 0.696-0.579 0.848-0.669 1.723-0.973 1.33-0.456 0.884-0.857 0.169-1.098-0.643-0.215-0.669-1.296-0.438-1.501 0.054 1.161 0.661 1.331 0.911 1.491 1.098 0.681-0.411 1.244-1.063 1.574z" />
  </svg>
);

const BotIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.7530511,13.999921 C18.9956918,13.999921 20.0030511,15.0072804 20.0030511,16.249921 L20.0030511,17.1550008 C20.0030511,18.2486786 19.5255957,19.2878579 18.6957793,20.0002733 C17.1303315,21.344244 14.8899962,22.0010712 12,22.0010712 C9.11050247,22.0010712 6.87168436,21.3444691 5.30881727,20.0007885 C4.48019625,19.2883988 4.00354153,18.2500002 4.00354153,17.1572408 L4.00354153,16.249921 C4.00354153,15.0072804 5.01090084,13.999921 6.25354153,13.999921 L17.7530511,13.999921 Z M11.8985607,2.00734093 L12.0003312,2.00049432 C12.380027,2.00049432 12.6938222,2.2826482 12.7434846,2.64872376 L12.7503312,2.75049432 L12.7495415,3.49949432 L16.25,3.5 C17.4926407,3.5 18.5,4.50735931 18.5,5.75 L18.5,10.254591 C18.5,11.4972317 17.4926407,12.504591 16.25,12.504591 L7.75,12.504591 C6.50735931,12.504591 5.5,11.4972317 5.5,10.254591 L5.5,5.75 C5.5,4.50735931 6.50735931,3.5 7.75,3.5 L11.2495415,3.49949432 L11.2503312,2.75049432 C11.2503312,2.37079855 11.5324851,2.05700336 11.8985607,2.00734093 L12.0003312,2.00049432 L11.8985607,2.00734093 Z M9.74928905,6.5 C9.05932576,6.5 8.5,7.05932576 8.5,7.74928905 C8.5,8.43925235 9.05932576,8.99857811 9.74928905,8.99857811 C10.4392523,8.99857811 10.9985781,8.43925235 10.9985781,7.74928905 C10.9985781,7.05932576 10.4392523,6.5 9.74928905,6.5 Z M14.2420255,6.5 C13.5520622,6.5 12.9927364,7.05932576 12.9927364,7.74928905 C12.9927364,8.43925235 13.5520622,8.99857811 14.2420255,8.99857811 C14.9319888,8.99857811 15.4913145,8.43925235 15.4913145,7.74928905 C15.4913145,7.05932576 14.9319888,6.5 14.2420255,6.5 Z" />
  </svg>
);

const UnknownIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 19H12.01M8.21704 7.69689C8.75753 6.12753 10.2471 5 12 5C14.2091 5 16 6.79086 16 9C16 10.6565 14.9931 12.0778 13.558 12.6852C12.8172 12.9988 12.4468 13.1556 12.3172 13.2767C12.1629 13.4209 12.1336 13.4651 12.061 13.6634C12 13.8299 12 14.0866 12 14.6L12 16" />
  </svg>
);

const DeviceIcon = ({ device, browser, className }: { device?: string | null; browser?: string | null; className?: string }) => {
  const d = (device || "").toLowerCase();
  const b = (browser || "").toLowerCase();

  if (b.includes("bot") || b.includes("google")) return <BotIcon className={className} />;
  if (d.includes("android")) return <AndroidIcon className={className} />;
  if (d.includes("windows") || b.includes("windows")) return <WindowsIcon className={className} />;
  if (d.includes("iphone") || d.includes("ios")) return <IPhoneIcon className={className} />;
  if (d.includes("mac") || b.includes("mac") || d.includes("darwin")) return <MacOSIcon className={className} />;
  if (d.includes("linux") || b.includes("linux")) return <LinuxIcon className={className} />;
  
  return <UnknownIcon className={className} />;
};

export default function LiveViewMap({ onClose }: { onClose: () => void }) {
  const [visitors, setVisitors] = useState<LiveVisitor[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<LiveVisitor | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  useEffect(() => {
    const fetchVisitors = async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data } = await (supabase as any)
        .from("live_visitors")
        .select("*")
        .gte("last_seen", fiveMinAgo)
        .order("last_seen", { ascending: false });
      if (data) setVisitors(data);
    };

    fetchVisitors();

    const channel = supabase
      .channel("liveview_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_visitors" }, () => {
        fetchVisitors();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnectionStatus("connected");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setConnectionStatus("disconnected");
      });

    const poll = setInterval(fetchVisitors, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, []);

  const stats = useMemo(() => {
    const isMobile = (d?: string | null) => {
      const s = (d || "").toLowerCase();
      return s === "mobile" || s === "tablet";
    };
    const base = {
      total: visitors.length,
      viewing: visitors.filter(v => v.action === "viewing").length,
      cart: visitors.filter(v => v.action === "cart").length,
      checkout: visitors.filter(v => v.action === "checkout").length,
      purchased: visitors.filter(v => v.action === "purchased").length,
      mobile: visitors.filter(v => isMobile(v.device)).length,
      desktop: visitors.filter(v => !isMobile(v.device)).length,
    };
    return base;
  }, [visitors]);

  const geoVisitors = useMemo(() => {
    return visitors
      .filter((v) => {
        const lat = typeof v.lat === "string" ? parseFloat(v.lat) : v.lat;
        const lng = typeof v.lng === "string" ? parseFloat(v.lng) : v.lng;
        return (
          typeof lat === "number" && typeof lng === "number" &&
          Number.isFinite(lat) && Number.isFinite(lng) &&
          !(lat === 0 && lng === 0)
        );
      })
      .map((v) => {
        const lat = (typeof v.lat === "string" ? parseFloat(v.lat as any) : v.lat) as number;
        const lng = (typeof v.lng === "string" ? parseFloat(v.lng as any) : v.lng) as number;
        const jitterLat = hashToUnit(v.session_id + "-lat") * JITTER_DEG;
        const jitterLng = hashToUnit(v.session_id + "-lng") * JITTER_DEG;
        return { ...v, displayLat: lat + jitterLat, displayLng: lng + jitterLng };
      });
  }, [visitors]);

  const timeSince = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 10) return "agora";
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#020205] text-foreground flex flex-col font-sans select-none">
      {/* ── COMMAND CENTER HEADER ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#05060f]/90 backdrop-blur-xl shadow-2xl relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(255,69,0,0.2)]">
              <Radio className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none text-foreground flex items-center gap-2">
                Live Console <span className="text-[10px] bg-primary text-foreground px-1.5 py-0.5 rounded not-italic tracking-normal normal-case">ALPHA</span>
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                <Server className="w-3 h-3" />
                <span>Node: US-EAST-1</span>
                <span>•</span>
                <span>System: Stable</span>
              </div>
            </div>
          </div>

          <div className="h-10 w-px bg-white/10" />

          {/* Core Metrics */}
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Usuários</span>
              <span className="text-xl font-black text-foreground">{stats.total}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Mobile</span>
              <span className="text-xl font-black text-blue-400">{stats.mobile}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Desktop</span>
              <span className="text-xl font-black text-purple-400">{stats.desktop}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${connectionStatus === "connected" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">{connectionStatus === "connected" ? "Stream Live" : "Offline"}</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </div>

      {/* ── STATUS DASHBOARD ── */}
      <div className="grid grid-cols-4 border-b border-white/5 bg-[#05060f]/60 backdrop-blur-md overflow-hidden shrink-0">
        {Object.entries(actionConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const count = stats[key as keyof typeof stats] || 0;
          return (
            <div key={key} className="p-4 border-r border-white/5 flex items-center justify-between relative group cursor-default">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-[4px] ${cfg.bg} flex items-center justify-center ${cfg.color} ${cfg.shadow} transition-transform group-hover:scale-110`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{cfg.label}</p>
                  <p className={`text-2xl font-black ${cfg.color} leading-none tabular-nums`}>{count}</p>
                </div>
              </div>
              <BarChart className="w-10 h-10 text-white/[0.03] absolute right-2 -bottom-1" />
            </div>
          );
        })}
      </div>

      {/* ── MAIN MONITORING AREA ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* GEOLOCATION MAP */}
        <div className="flex-1 relative bg-[#020308] overflow-hidden">
          {/* Digital Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
          
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 150, center: [0, 20] }}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#0a0c1a"
                      stroke="#1e2540"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#11152a", outline: "none", stroke: "#2e3a63" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Real-time markers */}
              {geoVisitors.map((v) => {
                const cfg = actionConfig[v.action] || actionConfig.viewing;
                const isSelected = selectedVisitor?.id === v.id;
                return (
                  <Marker
                    key={v.id}
                    coordinates={[v.displayLng, v.displayLat]}
                    onClick={() => setSelectedVisitor(isSelected ? null : v)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Animated Outer Ring */}
                    <circle r={14} fill="none" stroke={cfg.dotColor} strokeWidth={1} opacity={0.3}>
                      <animate attributeName="r" from="6" to="24" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                    </circle>
                    {/* Core Pulse */}
                    <circle r={8} fill={cfg.dotColor} opacity={0.3} className="animate-pulse" />
                    {/* Point */}
                    <circle r={isSelected ? 5 : 4} fill={cfg.dotColor} className="shadow-lg" />
                    <circle r={1.5} fill="white" />
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>

          {/* SELECTED VISITOR HUD */}
          {selectedVisitor && (
            <div className="absolute top-6 left-6 w-80 bg-[#05060f]/90 backdrop-blur-xl border border-white/10 rounded-[5px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded bg-primary/10 border border-primary/20`}>
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-foreground">Sessão Ativa</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">{selectedVisitor.session_id.slice(0, 12)}...</p>
                  </div>
                </div>
                <button onClick={() => setSelectedVisitor(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-md border border-white/5">
                  <div className="p-2 rounded bg-blue-500/10 text-blue-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{selectedVisitor.city || "—"}{selectedVisitor.state ? `, ${selectedVisitor.state}` : ""}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">{selectedVisitor.country || "Brasil"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 rounded-[4px] border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Dispositivo</span>
                    <div className="flex items-center gap-2">
                      <DeviceIcon device={selectedVisitor.device} browser={selectedVisitor.browser} className="w-4 h-4 text-primary" />
                      <span className="text-[11px] font-bold">{selectedVisitor.device}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-[4px] border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Status</span>
                    <span className={`text-[11px] font-bold ${(actionConfig[selectedVisitor.action] || actionConfig.viewing).color}`}>
                      {(actionConfig[selectedVisitor.action] || actionConfig.viewing).label}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-[4px] border border-white/5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Página Atual</span>
                  <div className="flex items-start gap-2">
                    <Globe className="w-3 h-3 text-blue-400 mt-0.5" />
                    <span className="text-[11px] font-mono text-foreground break-all">{selectedVisitor.current_page}</span>
                  </div>
                </div>

                {selectedVisitor.ip_address && (
                    <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-2 border-t border-white/5 pt-3">
                        <Wifi className="w-3 h-3" />
                        IP: {selectedVisitor.ip_address}
                    </div>
                )}
              </div>
            </div>
          )}

          {/* Map Controls */}
          <div className="absolute right-6 bottom-6 flex flex-col gap-2">
            <div className="bg-[#05060f]/80 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-2xl space-y-3">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Legenda</h4>
              {Object.entries(actionConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.bg} border border-${cfg.color.split('-')[1]}-400/30`} style={{ backgroundColor: cfg.dotColor }} />
                  <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── REAL-TIME FEED PANEL ── */}
        <div className="w-[420px] bg-[#05060f]/80 backdrop-blur-3xl border-l border-white/10 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#08091a]/40">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Traffic Stream</h2>
            </div>
            <div className="px-2 py-1 bg-white/5 rounded border border-white/10 text-[9px] font-bold text-muted-foreground">
              {visitors.length} ATIVOS
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {visitors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-12 opacity-40">
                <Radio className="w-12 h-12 mb-4 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Aguardando Conexões...</p>
                <p className="text-[10px] text-muted-foreground mt-2">Novas sessões aparecerão automaticamente</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {visitors.map((v) => {
                  const cfg = actionConfig[v.action] || actionConfig.viewing;
                  const Icon = cfg.icon;
                  const isActive = selectedVisitor?.id === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVisitor(isActive ? null : v)}
                      className={`p-5 cursor-pointer transition-all relative overflow-hidden group ${isActive ? "bg-primary/[0.03]" : "hover:bg-white/[0.02]"}`}
                    >
                      {/* Interaction glow */}
                      {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-primary shadow-[0_0_15px_rgba(255,69,0,0.8)]" />}
                      
                      <div className="flex items-start gap-4 h-full">
                        <div className={`w-10 h-10 rounded-[4px] ${cfg.bg} border border-${cfg.color.split('-')[1]}-400/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-5 h-5 ${cfg.color}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-black text-foreground truncate flex items-center gap-2">
                                {v.city || "Usuário"}{v.state ? `, ${v.state}` : ""}
                            </h4>
                            <span className="text-[10px] font-mono text-muted-foreground tabular-nums opacity-60">
                                {timeSince(v.last_seen)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-[10px] text-white/10">•</span>
                            <DeviceIcon device={v.device} browser={v.browser} className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground font-mono">{v.device}</span>
                          </div>

                          <div className="flex items-center gap-2 px-2 py-1 bg-black/30 rounded border border-white/5 w-fit max-w-full">
                            <MousePointer2 className="w-3 h-3 text-muted-foreground" />
                            <p className="text-[10px] text-muted-foreground truncate font-mono">{v.current_page}</p>
                          </div>
                          
                          {v.product_name && (
                            <div className="flex items-center gap-2 mt-2 px-2 py-1 bg-primary/5 rounded border border-primary/10 w-fit max-w-full italic text-primary">
                                <Box className="w-3 h-3" />
                                <span className="text-[10px] font-bold truncate">{v.product_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Footer Terminal */}
          <div className="p-4 bg-black border-t border-white/5 font-mono text-[10px] text-green-500/60 shrink-0 overflow-hidden">
            <div className="flex items-center gap-2">
                <span className="animate-pulse">{">>"}</span>
                <span className="text-green-500">LISTENING_PORT: 54321</span>
                <span>•</span>
                <span className="text-green-500">GEO_UPDATE: SUCCESS</span>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>,
    document.body
  );
}
