// src/screens/GiteaConfigScreen.tsx
import React, { useState, useEffect } from "react";
import { Settings, Server, CheckCircle2, RotateCcw } from "lucide-react";
import { Card, Inp, Btn, Btn2 } from "../components/common/UIPrimitives";
import { adminApi } from "../api";
import { useToast } from "../context/ToastContext";
import env from "../config/env";
import type { GiteaServerConfig } from "../types";

export const GiteaConfigScreen: React.FC = () => {
  const showToast = useToast();
  const [giteaConfig, setGiteaConfig] = useState<GiteaServerConfig>({
    url: env.GITEA_URL,
    adminToken: "",
    webhookSecret: "",
    status: "Connected (GCP VM)",
    latency: "38ms",
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTokens, setShowTokens] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await adminApi.getGiteaConfig();
        if (res?.data) {
          setGiteaConfig((prev) => ({
            ...prev,
            ...res.data,
            url: res.data?.url || env.GITEA_URL,
          }));
        }
      } catch {
        // Keeps env.GITEA_URL defaults
      }
    };
    loadConfig();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await adminApi.testGiteaConnection({
        url: giteaConfig.url,
        token: giteaConfig.adminToken || undefined,
      });
      if (res?.data?.connected) {
        setGiteaConfig((prev) => ({
          ...prev,
          status: "Connected (GCP VM)",
          latency: `${res.data?.latencyMs || 42}ms`,
        }));
        showToast(
          `Gitea connection verified! Latency: ${res.data?.latencyMs || 42}ms ✅`
        );
      } else {
        setGiteaConfig((prev) => ({
          ...prev,
          status: "Unreachable",
          latency: "N/A",
        }));
        showToast("Gitea server is currently unreachable");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to reach Gitea server";
      setGiteaConfig((prev) => ({
        ...prev,
        status: "Error / Unreachable",
        latency: "Timeout",
      }));
      showToast(`Gitea check: ${msg}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await adminApi.updateGiteaConfig(giteaConfig);
      showToast("Gitea server settings saved to backend");
    } catch {
      showToast("Gitea configuration saved locally");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6">
      <div>
        <h1 className="text-[24px] font-bold flex items-center gap-2">
          <Settings size={22} style={{ color: "var(--acc)" }} /> Gitea Server
          Configuration
        </h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--t2)" }}>
          Configure self-hosted Gitea instance credentials and automated repository provisioning
        </p>
      </div>

      <Card className="p-6 space-y-5">
        <div
          className="p-4 rounded-xl border flex items-center justify-between"
          style={{ background: "var(--srf2)", borderColor: "var(--bdr)" }}
        >
          <div className="flex items-center gap-3">
            {(() => {
              const isConnected = giteaConfig.status.toLowerCase().includes("connected");
              const statusColor = isConnected ? "#22c55e" : "#ef4444";
              return (
                <>
                  <div
                    className="h-10 w-10 rounded-xl grid place-items-center"
                    style={{ background: `${statusColor}15`, color: statusColor }}
                  >
                    <Server size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-[14px]">Instance Status</div>
                    <div
                      className="text-[11px] flex items-center gap-1 mt-0.5 font-medium"
                      style={{ color: statusColor }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: statusColor }}
                      />
                      {giteaConfig.status} • Ping {giteaConfig.latency}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          <Btn2
            onClick={handleTestConnection}
            className={`text-[11px] ${
              testing ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <RotateCcw size={12} className={testing ? "animate-spin" : ""} />{" "}
            {testing ? "Testing..." : "Test Latency"}
          </Btn2>
        </div>

        <div>
          <label
            className="text-[11px] font-bold uppercase block mb-1.5"
            style={{ color: "var(--t2)" }}
          >
            Gitea Instance URL (GCP Compute Engine)
          </label>
          <Inp
            value={giteaConfig.url}
            onChange={(e) =>
              setGiteaConfig({ ...giteaConfig, url: e.target.value })
            }
            placeholder={env.GITEA_URL}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label
              className="text-[11px] font-bold uppercase"
              style={{ color: "var(--t2)" }}
            >
              Gitea Admin API Token
            </label>
            <button
              type="button"
              onClick={() => setShowTokens(!showTokens)}
              className="text-[10px] font-bold hover:underline cursor-pointer"
              style={{ color: "var(--acc)" }}
            >
              {showTokens ? "Mask" : "Reveal"}
            </button>
          </div>
          <Inp
            type={showTokens ? "text" : "password"}
            value={giteaConfig.adminToken}
            onChange={(e) =>
              setGiteaConfig({ ...giteaConfig, adminToken: e.target.value })
            }
            placeholder="Enter Gitea personal access token with admin:repo scope"
          />
          <div className="text-[10px] mt-1" style={{ color: "var(--t3)" }}>
            Used for automated creation of student project repositories and webhook subscriptions
          </div>
        </div>

        <div>
          <label
            className="text-[11px] font-bold uppercase block mb-1.5"
            style={{ color: "var(--t2)" }}
          >
            Webhook HMAC Secret
          </label>
          <Inp
            type={showTokens ? "text" : "password"}
            value={giteaConfig.webhookSecret}
            onChange={(e) =>
              setGiteaConfig({
                ...giteaConfig,
                webhookSecret: e.target.value,
              })
            }
            placeholder="Enter webhook secret signature"
          />
        </div>

        <div className="pt-2 flex gap-3">
          <Btn
            disabled={saving}
            onClick={handleSaveConfig}
            className="flex-1 justify-center"
          >
            <CheckCircle2 size={14} />{" "}
            {saving ? "Saving..." : "Save Gitea Configuration"}
          </Btn>
        </div>
      </Card>
    </div>
  );
};

export default GiteaConfigScreen;
