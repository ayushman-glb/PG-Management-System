import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Laptop,
  Smartphone,
  ShieldAlert,
  Clock,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Lock,
  Monitor,
  Globe,
  MapPin,
  XCircle,
  FileText,
} from "lucide-react";
import {
  deviceService,
  UserDeviceItem,
  DeviceLoginLogItem,
  SecurityEventItem,
} from "../../../services/device.service";

export const DeviceManagementSection: React.FC = () => {
  const [devices, setDevices] = useState<UserDeviceItem[]>([]);
  const [loginLogs, setLoginLogs] = useState<DeviceLoginLogItem[]>([]);
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"devices" | "logs" | "events">("devices");

  const fetchSecurityData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deviceList, logList, eventList] = await Promise.all([
        deviceService.getUserDevices(),
        deviceService.getDeviceLoginLogs().catch(() => []),
        deviceService.getSecurityEvents().catch(() => []),
      ]);
      setDevices(deviceList);
      setLoginLogs(logList);
      setEvents(eventList);
    } catch (err: any) {
      setError(err.message || "Failed to load device identity records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleTrust = async (deviceId: string) => {
    setActionLoadingId(deviceId);
    try {
      await deviceService.trustDevice(deviceId);
      await fetchSecurityData();
    } catch (err: any) {
      alert(err.message || "Failed to trust device");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevoke = async (deviceId: string) => {
    if (!confirm("Are you sure you want to revoke access for this device?")) return;
    setActionLoadingId(deviceId);
    try {
      await deviceService.revokeDevice(deviceId);
      await fetchSecurityData();
    } catch (err: any) {
      alert(err.message || "Failed to revoke device");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "TRUSTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Trusted
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
          </span>
        );
      case "AUTO_TRUSTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Trusted
          </span>
        );
      case "REVOKED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Trash2 className="w-3.5 h-3.5" /> Revoked
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
            <Lock className="w-3.5 h-3.5" /> Blocked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
            <ShieldAlert className="w-3.5 h-3.5" /> New / Pending Alert
          </span>
        );
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-6 shadow-xl space-y-6 text-[var(--text-main)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-xl border border-[var(--brand-primary)]/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)]">Device Security &amp; Login Intelligence</h2>
            <p className="text-xs text-[var(--text-muted)]">
              FingerprintJS Alert System, trusted browsers, and sign-in telemetry logs
            </p>
          </div>
        </div>
        <button
          onClick={fetchSecurityData}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] border border-[var(--border-main)] rounded-xl transition-all cursor-pointer"
          title="Refresh device data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[var(--brand-primary)]" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-3">
        <button
          onClick={() => setActiveTab("devices")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "devices"
              ? "bg-[var(--brand-primary)] text-white shadow-md shadow-[var(--brand-primary)]/20"
              : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]"
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          Recognized Devices ({devices.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "logs"
              ? "bg-[var(--brand-primary)] text-white shadow-md shadow-[var(--brand-primary)]/20"
              : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Sign-in Telemetry Logs ({loginLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "events"
              ? "bg-[var(--brand-primary)] text-white shadow-md shadow-[var(--brand-primary)]/20"
              : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Security Audit Events ({events.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 py-4">
          <div className="h-16 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
          <div className="h-16 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
          <div className="h-16 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
        </div>
      ) : activeTab === "devices" ? (
        devices.length === 0 ? (
          <div className="p-6 text-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border-main)] text-[var(--text-muted)] text-xs">
            No registered devices found for this account yet.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="divide-y divide-[var(--border-main)] border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-surface)]">
              {devices.map((device, idx) => {
                const isMobile =
                  device.deviceLabel.toLowerCase().includes("mobile") ||
                  device.deviceLabel.toLowerCase().includes("ios") ||
                  device.deviceLabel.toLowerCase().includes("android");

                return (
                  <div
                    key={device.id || idx}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--bg-primary)]/40 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="p-3 bg-[var(--bg-primary)] rounded-xl text-[var(--brand-primary)] border border-[var(--border-main)] shrink-0">
                        {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--text-main)] truncate">
                            {device.deviceLabel}
                          </p>
                          {getStatusBadge(device.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                          {device.screenResolution && (
                            <span className="flex items-center gap-1">
                              <Monitor className="w-3 h-3 text-[var(--text-muted)]" />
                              {device.screenResolution}
                            </span>
                          )}
                          {device.region && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
                              {device.region}
                            </span>
                          )}
                          {device.ipAddress && (
                            <span className="flex items-center gap-1 font-mono">
                              <Globe className="w-3 h-3 text-[var(--text-muted)]" />
                              {device.ipAddress}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <Clock className="w-3 h-3" />
                          <span>Last active: {new Date(device.lastSeenAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {device.status !== "TRUSTED" && device.status !== "BLOCKED" && (
                        <button
                          onClick={() => handleTrust(device.id)}
                          disabled={actionLoadingId === device.id}
                          className="px-3 py-1.5 text-xs font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 hover:bg-[var(--brand-primary)]/20 border border-[var(--brand-primary)]/20 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                        >
                          Trust
                        </button>
                      )}
                      {device.status !== "REVOKED" && device.status !== "REJECTED" && (
                        <button
                          onClick={() => handleRevoke(device.id)}
                          disabled={actionLoadingId === device.id}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : activeTab === "logs" ? (
        loginLogs.length === 0 ? (
          <div className="p-6 text-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border-main)] text-[var(--text-muted)] text-xs">
            No device sign-in telemetry logs recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-main)] border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-surface)] text-xs">
            {loginLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg-primary)]/40"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-main)] truncate">{log.deviceLabel}</span>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[var(--text-muted)] text-xs">
                    <span className="flex items-center gap-1 font-mono">
                      <Globe className="w-3 h-3 text-[var(--text-muted)]" />
                      {log.ipAddress}
                    </span>
                    {log.region && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
                        {log.region}
                      </span>
                    )}
                    {log.screenResolution && (
                      <span className="flex items-center gap-1">
                        <Monitor className="w-3 h-3 text-[var(--text-muted)]" />
                        {log.screenResolution}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[var(--text-muted)] text-xs shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )
      ) : events.length === 0 ? (
        <div className="p-6 text-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border-main)] text-[var(--text-muted)] text-xs">
          No security audit events recorded.
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-main)] border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-surface)] text-xs">
          {events.slice(0, 20).map((evt) => (
            <div key={evt.id} className="p-3.5 flex items-center justify-between hover:bg-[var(--bg-primary)]/40">
              <div>
                <span className="font-mono text-[var(--brand-primary)] font-semibold">{evt.eventType}</span>
                <span className="text-[var(--text-muted)] ml-2">Risk: {evt.riskLevel}</span>
              </div>
              <span className="text-[var(--text-muted)] text-xs">
                {new Date(evt.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
