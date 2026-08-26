import React from "react";
import { useTheme } from "../../theme";
import { Check } from "lucide-react";

export type AvatarPaletteMode =
  | "luxury"
  | "gold"
  | "amber"
  | "bronze"
  | "rose"
  | "emerald"
  | "multi";

const sizeMap = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-xs",
  lg: "w-10 h-10 text-sm font-bold",
  xl: "w-14 h-14 text-base font-extrabold",
  "2xl": "w-16 h-16 text-lg md:text-xl font-black",
};

export const LUXURY_PALETTES = {
  luxury: {
    light: "linear-gradient(135deg, #004D61 0%, #007A99 100%)",
    dark: "linear-gradient(135deg, #007A99 0%, #004D61 100%)",
  },
  gold: {
    light: "linear-gradient(135deg, #004D61 0%, #003847 100%)",
    dark: "linear-gradient(135deg, #007A99 0%, #004D61 100%)",
  },
  amber: {
    light: "linear-gradient(135deg, #822659 0%, #004D61 100%)",
    dark: "linear-gradient(135deg, #9B336D 0%, #007A99 100%)",
  },
  bronze: {
    light: "linear-gradient(135deg, #822659 0%, #9B336D 100%)",
    dark: "linear-gradient(135deg, #9B336D 0%, #822659 100%)",
  },
  rose: {
    light: "linear-gradient(135deg, #822659 0%, #C57B6C 100%)",
    dark: "linear-gradient(135deg, #9B336D 0%, #B86F62 100%)",
  },
  emerald: {
    light: "linear-gradient(135deg, #3E5641 0%, #4F6E52 100%)",
    dark: "linear-gradient(135deg, #4F6E52 0%, #3E5641 100%)",
  },
};

const paletteKeys = ["gold", "bronze", "amber", "rose", "emerald"] as const;

export function getAvatarInitials(name?: string, initials?: string): string {
  if (initials) return initials.toUpperCase().slice(0, 2);
  if (!name) return "PG";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function hashStringToPalette(str: string): keyof typeof LUXURY_PALETTES {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % paletteKeys.length;
  return paletteKeys[idx];
}

export interface AvatarProps {
  name?: string;
  initials?: string;
  imageUrl?: string;
  size?: keyof typeof sizeMap;
  palette?: keyof typeof LUXURY_PALETTES | "auto";
  status?: "online" | "offline" | "busy" | "away";
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = "User",
  initials,
  imageUrl,
  size = "md",
  palette = "auto",
  status,
  className = "",
  onClick,
}) => {
  const { darkMode, avatarTheme } = useTheme();

  const chosenPaletteKey: keyof typeof LUXURY_PALETTES = React.useMemo(() => {
    if (palette !== "auto") return palette;
    if (avatarTheme === "multi") return hashStringToPalette(name || initials || "X");
    if (avatarTheme && avatarTheme in LUXURY_PALETTES) {
      return avatarTheme as keyof typeof LUXURY_PALETTES;
    }
    return "luxury";
  }, [palette, avatarTheme, name, initials]);

  const background = darkMode
    ? LUXURY_PALETTES[chosenPaletteKey].dark
    : LUXURY_PALETTES[chosenPaletteKey].light;

  const displayInitials = getAvatarInitials(name, initials);

  const statusColors = {
    online: "bg-emerald-500",
    offline: "bg-neutral-400",
    busy: "bg-rose-500",
    away: "bg-amber-400",
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm select-none transition-all duration-150 ${
        sizeMap[size]
      } ${onClick ? "cursor-pointer hover:opacity-90 hover:scale-105" : ""} ${className}`}
      style={{
        background: imageUrl ? undefined : background,
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span className="tracking-wider">{displayInitials}</span>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-[var(--bg-primary)] ${
            statusColors[status]
          } ${
            size === "xs" || size === "sm"
              ? "w-1.5 h-1.5"
              : size === "md" || size === "lg"
              ? "w-2.5 h-2.5"
              : "w-3.5 h-3.5"
          }`}
        />
      )}
    </div>
  );
};

export function AvatarThemeSelector() {
  const { avatarTheme, setAvatarTheme, darkMode } = useTheme();

  const options: { id: AvatarPaletteMode; label: string; previewLight: string; previewDark: string }[] = [
    {
      id: "luxury",
      label: "Dark Teal",
      previewLight: "linear-gradient(135deg, #004D61, #007A99)",
      previewDark: "linear-gradient(135deg, #007A99, #004D61)",
    },
    {
      id: "multi",
      label: "Smart Multi",
      previewLight: "linear-gradient(135deg, #004D61, #822659)",
      previewDark: "linear-gradient(135deg, #007A99, #3E5641)",
    },
    {
      id: "bronze",
      label: "Deep Ruby",
      previewLight: "linear-gradient(135deg, #822659, #9B336D)",
      previewDark: "linear-gradient(135deg, #9B336D, #822659)",
    },
    {
      id: "amber",
      label: "Teal & Ruby",
      previewLight: "linear-gradient(135deg, #822659, #004D61)",
      previewDark: "linear-gradient(135deg, #9B336D, #007A99)",
    },
    {
      id: "emerald",
      label: "Forest Green",
      previewLight: "linear-gradient(135deg, #3E5641, #4F6E52)",
      previewDark: "linear-gradient(135deg, #4F6E52, #3E5641)",
    },
    {
      id: "rose",
      label: "Rose Ruby",
      previewLight: "linear-gradient(135deg, #822659, #C57B6C)",
      previewDark: "linear-gradient(135deg, #9B336D, #B86F62)",
    },
  ];

  return (
    <div className={`p-3 rounded-xl border ${darkMode ? "bg-[var(--bg-nested)] border-[var(--border-main)]" : "bg-[var(--bg-primary)] border-[var(--border-main)]"}`}>
      <p className={`text-xs font-semibold mb-2.5 ${darkMode ? "text-[var(--text-muted)]" : "text-[var(--text-muted)]"}`}>
        Avatar Color Theme
      </p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const isSelected = (avatarTheme || "luxury") === opt.id;
          const bg = darkMode ? opt.previewDark : opt.previewLight;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAvatarTheme(opt.id)}
              className={`p-2 rounded-lg border text-left transition-all flex flex-col items-center gap-1.5 cursor-pointer relative ${
                isSelected
                  ? "border-[var(--brand-primary)] bg-[var(--bg-card)] shadow-xs"
                  : "border-[var(--border-subtle)] hover:border-[var(--border-main)] hover:bg-[var(--bg-surface)]"
              }`}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-xs"
                style={{ background: bg }}
              >
                RB
              </div>
              <span className="text-[10px] font-medium text-[var(--text-main)] truncate max-w-full">
                {opt.label}
              </span>
              {isSelected && (
                <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Avatar;
