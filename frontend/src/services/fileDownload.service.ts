export interface DownloadOptions {
  url: string;
  filename: string;
  onProgress?: (progress: number) => void;
}

export const downloadFile = async ({ url, filename }: DownloadOptions): Promise<void> => {
  try {
    const token = typeof localStorage !== "undefined"
      ? (localStorage.getItem("accessToken") || localStorage.getItem("token") || localStorage.getItem("roombae_access_token"))
      : null;

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const downloadUrl = token && !url.includes("token=")
      ? `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`
      : url;

    const res = await fetch(downloadUrl, { headers });
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok || contentType.includes("application/json")) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.message || errorJson.error || `Download failed with HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error: any) {
    console.error("❌ File download failed:", error);
    throw new Error(error.message || "Failed to download file from server.");
  }
};
