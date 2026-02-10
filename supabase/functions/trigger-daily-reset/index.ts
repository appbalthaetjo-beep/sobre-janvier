// Supabase Edge Function: trigger-daily-reset
// POST { deviceKey: string }
//
// Looks up the Expo push token for the deviceKey and sends an immediate push
// via Expo Push API with a deep link to `sobre://daily-reset`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type TriggerRequest = { deviceKey?: string };

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}

function isValidDeviceKey(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 16 && value.trim().length <= 200;
}

function isValidExpoPushToken(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const token = value.trim();
  return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type, authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  let payload: TriggerRequest;
  try {
    payload = (await req.json()) as TriggerRequest;
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  if (!isValidDeviceKey(payload.deviceKey)) {
    return jsonResponse(400, { error: "invalid_device_key" });
  }
  const deviceKey = payload.deviceKey.trim();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: "missing_server_env" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("user_devices")
    .select("expo_push_token")
    .eq("device_key", deviceKey)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return jsonResponse(500, { error: "db_error", details: error.message });
  }

  const expoPushToken = data?.expo_push_token;
  if (!isValidExpoPushToken(expoPushToken)) {
    return jsonResponse(404, { error: "device_not_registered" });
  }

  const message = {
    to: expoPushToken,
    sound: "default",
    title: "Daily Reset Sobre",
    body: "Fais ton check-in pour débloquer tes apps pour aujourd’hui.",
    data: { url: "sobre://daily-reset", type: "daily-reset" },
    priority: "high",
    collapseId: "daily-reset",
  };
  // Force a clean UTF-8 body (the line above may get mangled by editors/encodings).
  (message as any).body = "Fais ton check-in pour d\u00e9bloquer tes apps pour aujourd\u2019hui.";

  const expoResp = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(message),
  });

  const expoBodyText = await expoResp.text();
  if (!expoResp.ok) {
    return jsonResponse(502, { error: "expo_push_failed", status: expoResp.status, body: expoBodyText });
  }

  return jsonResponse(200, { ok: true, expo: expoBodyText });
});
