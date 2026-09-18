import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SalesNotificationData } from "@/components/admin/SalesNotificationToast";

const STORAGE_NOTIF_ENABLED = "metarat_sales_notif_enabled";
const STORAGE_SOUND_ENABLED = "metarat_sales_sound_enabled";
const STORAGE_KNOWN_ORDERS = "metarat_known_paid_orders";

// Global Web Audio API context and cached buffer for notification sound effects.
// Web Audio API plays sounds in-memory as sound effects without registering with
// MPNowPlayingInfoCenter in iOS Safari, completely eliminating the lock-screen player widget.
let globalAudioCtx: AudioContext | null = null;
let cachedAudioBuffer: AudioBuffer | null = null;
let isAudioBufferLoading = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!globalAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      globalAudioCtx = new AudioContextClass();
    }
  }
  return globalAudioCtx;
}

async function loadAndDecodeSaleSound(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (cachedAudioBuffer) return cachedAudioBuffer;
  if (isAudioBufferLoading) return null;
  isAudioBufferLoading = true;
  try {
    const res = await fetch("/sounds/sale.mp3?v=3");
    const arrayBuffer = await res.arrayBuffer();
    cachedAudioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
      ctx.decodeAudioData(arrayBuffer, resolve, reject);
    });
    return cachedAudioBuffer;
  } catch (err) {
    console.warn("Failed to decode sale sound with Web Audio:", err);
    return null;
  } finally {
    isAudioBufferLoading = false;
  }
}

export function useSalesNotifier() {
  const [currentNotification, setCurrentNotification] = useState<SalesNotificationData | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default";
  });

  const [isEnabled, setIsEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_NOTIF_ENABLED);
    return stored !== null ? stored === "true" : true;
  });

  const [isSoundEnabled, setIsSoundEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = STORAGE_SOUND_ENABLED in localStorage ? localStorage.getItem(STORAGE_SOUND_ENABLED) : null;
    return stored !== null ? stored === "true" : true;
  });

  const knownPaidIds = useRef<Set<string>>(new Set());
  const isInitialized = useRef<boolean>(false);
  const dismissTimerRef = useRef<any>(null);

  // Initialize Web Audio without triggering iOS media playback controls
  useEffect(() => {
    if (typeof window !== "undefined") {
      const unlockAudio = () => {
        const ctx = getAudioContext();
        if (ctx && ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        if (ctx) {
          loadAndDecodeSaleSound(ctx).catch(() => {});
        }
        if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
          try {
            navigator.mediaSession.playbackState = "none";
            navigator.mediaSession.metadata = null;
          } catch {}
        }
      };

      window.addEventListener("click", unlockAudio, { once: true });
      window.addEventListener("touchstart", unlockAudio, { once: true });
      window.addEventListener("keydown", unlockAudio, { once: true });

      return () => {
        window.removeEventListener("click", unlockAudio);
        window.removeEventListener("touchstart", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      };
    }
  }, []);

  // Request browser desktop notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return "denied";
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res;
    } catch {
      return "denied";
    }
  }, []);

  // Setter with persistence
  const setIsEnabled = useCallback((value: boolean) => {
    setIsEnabledState(value);
    localStorage.setItem(STORAGE_NOTIF_ENABLED, String(value));
    if (value && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(setPermission);
    }
  }, []);

  const setIsSoundEnabled = useCallback((value: boolean) => {
    setIsSoundEnabledState(value);
    localStorage.setItem(STORAGE_SOUND_ENABLED, String(value));
  }, []);

  const lastSoundTime = useRef<number>(0);

  // Play audio strictly via Web Audio API (never triggers lock screen player on iOS)
  const playSaleSound = useCallback(() => {
    if (!isSoundEnabled) return;
    const now = Date.now();
    if (now - lastSoundTime.current < 2500) {
      return; // Prevent duplicate playback
    }
    lastSoundTime.current = now;

    // Explicitly reset mediaSession to none so mobile lock screens don't show a player
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = "none";
        navigator.mediaSession.metadata = null;
      } catch {}
    }

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const playBuffer = (buffer: AudioBuffer) => {
        try {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          const gainNode = ctx.createGain();
          gainNode.gain.value = 1.0;
          source.connect(gainNode);
          gainNode.connect(ctx.destination);
          source.start(0);
        } catch (e) {
          console.warn("Buffer playback error:", e);
        }
      };

      if (cachedAudioBuffer) {
        playBuffer(cachedAudioBuffer);
      } else {
        loadAndDecodeSaleSound(ctx).then((buffer) => {
          if (buffer) playBuffer(buffer);
        });
      }
    } catch (e) {
      console.warn("Web Audio playback error:", e);
    }
  }, [isSoundEnabled]);

  // Trigger notification for an order
  const showNotification = useCallback((order: {
    id: string;
    order_number?: string;
    total?: number;
    customer_name?: string;
    created_at?: string;
    isTest?: boolean;
  }) => {
    if (!isEnabled && !order.isTest) return;

    const now = new Date();
    const formattedTime = now.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }) + ", " + now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    const orderNumber = order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`;

    const notifData: SalesNotificationData = {
      id: order.id,
      order_number: orderNumber,
      amount: order.total,
      customer_name: order.customer_name,
      timestamp: formattedTime,
    };

    // 1. Play sound
    playSaleSound();

    // 2. Browser native desktop notification
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        const desktopNotif = new Notification("Venda realizada", {
          body: `Pedido ${orderNumber} pago com sucesso\n${formattedTime}`,
          icon: "/favicon.png",
          badge: "/favicon.png",
          tag: `order-${order.id}`,
        });

        desktopNotif.onclick = () => {
          window.focus();
          window.location.href = "/admin/orders-pix";
        };
      } catch (err) {
        console.warn("Desktop notification failed:", err);
      }
    }

    // 3. In-app floating toast
    setCurrentNotification(notifData);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setCurrentNotification(null);
    }, 10000);
  }, [isEnabled, playSaleSound]);

  // Test function for settings screen
  const triggerTestNotification = useCallback(async () => {
    // Request permission if needed
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      await requestPermission();
    }

    const testId = "ORD-" + Date.now().toString().slice(-12) + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    showNotification({
      id: testId,
      order_number: testId,
      total: 197.00,
      customer_name: "Cliente Demonstração",
      created_at: new Date().toISOString(),
    });
  }, [requestPermission, showNotification]);

  // Load known paid orders from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KNOWN_ORDERS);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          list.forEach(id => knownPaidIds.current.add(String(id)));
        }
      }
    } catch {}
  }, []);

  // Synchronize settings from DB if available
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from("settings").select("value").eq("key", "tracking_settings").maybeSingle();
        if (data?.value) {
          const val = data.value as any;
          if (val.sales_notification_enabled !== undefined) {
            setIsEnabledState(val.sales_notification_enabled);
            localStorage.setItem(STORAGE_NOTIF_ENABLED, String(val.sales_notification_enabled));
          }
          if (val.sales_sound_enabled !== undefined) {
            setIsSoundEnabledState(val.sales_sound_enabled);
            localStorage.setItem(STORAGE_SOUND_ENABLED, String(val.sales_sound_enabled));
          }
        }
      } catch {}
    };
    fetchSettings();
  }, []);

  // Poll for recently paid orders
  useEffect(() => {
    let isMounted = true;

    const checkPaidOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, order_number, total, customer_name, status, payment_status, created_at")
          .order("created_at", { ascending: false })
          .limit(40);

        if (error || !data || !isMounted) return;

        const paidOrders = data.filter((o: any) => o.status === "paid" || o.payment_status === "paid");

        // First run: just initialize known IDs so we don't alert all past history
        if (!isInitialized.current) {
          paidOrders.forEach((o: any) => knownPaidIds.current.add(String(o.id)));
          isInitialized.current = true;
          try {
            const arr = Array.from(knownPaidIds.current).slice(-200);
            localStorage.setItem(STORAGE_KNOWN_ORDERS, JSON.stringify(arr));
          } catch {}
          return;
        }

        // Subsequent runs: detect newly paid orders
        for (const order of paidOrders) {
          const strId = String(order.id);
          if (!knownPaidIds.current.has(strId)) {
            knownPaidIds.current.add(strId);
            try {
              const arr = Array.from(knownPaidIds.current).slice(-200);
              localStorage.setItem(STORAGE_KNOWN_ORDERS, JSON.stringify(arr));
            } catch {}
            showNotification(order);
          }
        }
      } catch (err) {
        console.warn("Error polling paid orders:", err);
      }
    };

    // Run immediately and then every 6 seconds
    checkPaidOrders();
    const interval = setInterval(checkPaidOrders, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [showNotification]);

  // Listen to custom sales notification events from anywhere in the window
  useEffect(() => {
    const handleCustomSale = (e: any) => {
      if (e.detail) {
        showNotification(e.detail);
      }
    };
    window.addEventListener("metarat:sale_notification", handleCustomSale);
    return () => window.removeEventListener("metarat:sale_notification", handleCustomSale);
  }, [showNotification]);

  const closeNotification = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setCurrentNotification(null);
  }, []);

  return {
    currentNotification,
    closeNotification,
    isEnabled,
    setIsEnabled,
    isSoundEnabled,
    setIsSoundEnabled,
    permission,
    requestPermission,
    triggerTestNotification,
  };
}
