import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MascaraSettings {
  active: boolean;
  logo_url: string;
  name: string;
  cnpj: string;
  address: string;
  primary_color: string;
  secondary_color: string;
  text_color: string;
}

const defaultMascara: MascaraSettings = {
  active: false,
  logo_url: "",
  name: "",
  cnpj: "",
  address: "",
  primary_color: "",
  secondary_color: "",
  text_color: "",
};

let cachedMascara: MascaraSettings | null = null;
let fetchPromise: Promise<MascaraSettings> | null = null;

async function fetchMascara(): Promise<MascaraSettings> {
  if (cachedMascara) return cachedMascara;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const { data } = await (supabase as any)
      .from("settings")
      .select("value")
      .eq("key", "mascara_settings")
      .maybeSingle();

    const result = data?.value ? { ...defaultMascara, ...data.value } : defaultMascara;
    cachedMascara = result;
    return result;
  })();

  return fetchPromise;
}

export function useMascara() {
  const [mascara, setMascara] = useState<MascaraSettings>(cachedMascara || defaultMascara);
  const [loading, setLoading] = useState(!cachedMascara);

  useEffect(() => {
    fetchMascara().then((m) => {
      setMascara(m);
      setLoading(false);
    });
  }, []);

  const invalidateCache = () => {
    cachedMascara = null;
    fetchPromise = null;
  };

  return { mascara, loading, invalidateCache };
}
