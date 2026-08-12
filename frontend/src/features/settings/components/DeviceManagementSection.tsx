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
} from "lucide-react";
import { deviceService, UserDeviceItem, SecurityEventItem } from "../../../services/device.service";

export const DeviceManagementSection: React.FC = () => {
  const [devices, setDevices] = useState<UserDeviceItem[]>([]);
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deviceList, eventList] = await Promise.all([
        deviceService.getUserDevices(),
        deviceService.getSecurityEvents().catch(() => []),
      ]);
      setDevices(deviceList);
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
      case "REVOKED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Trash2 className="w-3.5 h-3.5" /> Revoked
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-3.5 h-3.5" /> New / Unverified
          </span>
        );
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Device Identity & Security</h2>
            <p className="text-xs text-neutral-400">
              Manage trusted browsers, active sessions, and browser fingerprint verification
            </p>
          </div>
        </div>
        <button
          onClick={fetchSecurityData}
          disabled={loading}
          className="p-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"
          title="Refresh device list"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 py-4">
          <div className="h-16 bg-neutral-800/50 rounded-xl animate-pulse" />
          <div className="h-16 bg-neutral-800/50 rounded-xl animate-pulse" />
        </div>
      ) : devices.length === 0 ? (
        <div className="p-6 text-center bg-neutral-800/30 rounded-xl border border-neutral-800 text-neutral-400 text-xs">
          No registered devices found for this account yet.
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Recognized Devices ({devices.length})
          </h3>
          <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/40">
            {devices.map((device, idx) => (
              <div
                key={device.id || idx}
                className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-800/30 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-3 bg-neutral-800 rounded-xl text-amber-400 border border-neutral-700/50">
                    {device.deviceLabel.toLowerCase().includes("mobile") ||
                    device.deviceLabel.toLowerCase().includes("ios") ||
                    device.deviceLabel.toLowerCase().includes("android") ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <Laptop className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {device.deviceLabel}
                      </p>
                      {getStatusBadge(device.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        First seen: {new Date(device.firstSeenAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>Last active: {new Date(device.lastSeenAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {device.status !== "TRUSTED" && device.status !== "BLOCKED" && (
                    <button
                      onClick={() => handleTrust(device.id)}
                      disabled={actionLoadingId === device.id}
                      className="px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-all"
                    >
                      Trust
                    </button>
                  )}
                  {device.status !== "REVOKED" && (
                    <button
                      onClick={() => handleRevoke(device.id)}
                      disabled={actionLoadingId === device.id}
                      className="px-3 py-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div className="pt-4 border-t border-neutral-800 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Recent Security Activity Log
          </h3>
          <div className="max-h-48 overflow-y-auto divide-y divide-neutral-800 border border-neutral-800 rounded-xl bg-neutral-950/60 text-xs">
            {events.slice(0, 10).map((evt) => (
              <div key={evt.id} className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-amber-400 font-semibold">{evt.eventType}</span>
                  <span className="text-neutral-400 ml-2">Risk Level: {evt.riskLevel}</span>
                </div>
                <span className="text-neutral-500 text-[11px]">
                  {new Date(evt.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
