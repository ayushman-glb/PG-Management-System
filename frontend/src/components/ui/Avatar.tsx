import { useTheme, type AvatarPaletteMode } from "../../theme";

export interface AvatarProps {
  name?: string;
  initials?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  colorScheme?: AvatarPaletteMode;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-xs",
  lg: "w-10 h-10 text-sm font-bold",
  xl: "w-14 h-14 text-base font-extrabold",
  "2xl": "w-16 h-16 text-lg md:text-xl font-black",
};

export const LUXURY_PALETTES = {
  luxury: {
    light: "linear-gradient(135deg, #ff385c 0%, #ff385c 100%)",
    dark: "linear-gradient(135deg, #ff385c 0%, #ff385c 100%)",
  },
  gold: {
    light: "linear-gradient(135deg, #ff385c 0%, #ff385c 100%)",
    dark: "linear-gradient(135deg, #ff385c 0%, #ff385c 100%)",
  },
  amber: {
    light: "linear-gradient(135deg, #E7C4A0 0%, #ff385c 100%)",
    dark: "linear-gradient(135deg, #ff385c 0%, #E8C98A 100%)",
  },
  bronze: {
    light: "linear-gradient(135deg, #ff385c 0%, #A0643F 100%)",
    dark: "linear-gradient(135deg, #B57E38 0%, #945E20 100%)",
  },
  rose: {
    light: "linear-gradient(135deg, #E8B4A2 0%, #C57B6C 100%)",
    dark: "linear-gradient(135deg, #D89B8C 0%, #B86F62 100%)",
  },
  emerald: {
    light: "linear-gradient(135deg, #7CB392 0%, #5E9F72 100%)",
    dark: "linear-gradient(135deg, #5E9F72 0%, #3F7A51 100%)",
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

export function Avatar({
  name,
  initials,
  size = "md",
  className = "",
  colorScheme,
  showOnlineStatus = false,
  isOnline = true,
}: AvatarProps) {
  const { darkMode, avatarTheme } = useTheme();

  const computedInitials = getAvatarInitials(name, initials);
  const activeScheme = colorScheme || avatarTheme || "luxury";

  let paletteKey: keyof typeof LUXURY_PALETTES = "gold";
  if (activeScheme in LUXURY_PALETTES) {
    paletteKey = activeScheme as keyof typeof LUXURY_PALETTES;
  } else if (activeScheme === "multi") {
    let hash = 0;
    const str = computedInitials || name || "AJ";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % paletteKeys.length;
    paletteKey = paletteKeys[index];
  }

  const palette = LUXURY_PALETTES[paletteKey] || LUXURY_PALETTES.luxury;
  const bgGradient = darkMode ? palette.dark : palette.light;
  const shadow = darkMode
    ? "0 3px 10px rgba(200, 154, 75, 0.3)"
    : "0 3px 10px rgba(197, 139, 99, 0.25)";

  return (
    <div className="relative inline-flex flex-shrink-0">
      <div
        className={`
          rounded-full flex items-center justify-center font-bold text-white select-none
          transition-all duration-300 transform hover:scale-105
          ${sizeClasses[size]}
          ${className}
        `}
        style={{
          background: bgGradient,
          boxShadow: shadow,
        }}
        title={name || initials}
      >
        {computedInitials}
      </div>
      {showOnlineStatus && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full border-2
            ${size === "xs" || size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"}
            ${darkMode ? "border-[#121212]" : "border-white"}
            ${isOnline ? "bg-emerald-500" : "bg-amber-500"}
          `}
        />
      )}
    </div>
  );
}

export function AvatarThemeSelector() {
  const { avatarTheme, setAvatarTheme, darkMode } = useTheme();

  const options: { id: AvatarPaletteMode; label: string; previewLight: string; previewDark: string }[] = [
    {
      id: "luxury",
      label: "Default Gold",
      previewLight: "linear-gradient(135deg, #ff385c, #ff385c)",
      previewDark: "linear-gradient(135deg, #ff385c, #ff385c)",
    },
    {
      id: "multi",
      label: "Smart Multi",
      previewLight: "linear-gradient(135deg, #ff385c, #E7C4A0)",
      previewDark: "linear-gradient(135deg, #ff385c, #5E9F72)",
    },
    {
      id: "bronze",
      label: "Warm Bronze",
      previewLight: "linear-gradient(135deg, #ff385c, #A0643F)",
      previewDark: "linear-gradient(135deg, #B57E38, #945E20)",
    },
    {
      id: "amber",
      label: "Champagne",
      previewLight: "linear-gradient(135deg, #E7C4A0, #ff385c)",
      previewDark: "linear-gradient(135deg, #ff385c, #E8C98A)",
    },
    {
      id: "emerald",
      label: "Emerald Luxury",
      previewLight: "linear-gradient(135deg, #7CB392, #5E9F72)",
      previewDark: "linear-gradient(135deg, #5E9F72, #3F7A51)",
    },
    {
      id: "rose",
      label: "Rose Gold",
      previewLight: "linear-gradient(135deg, #E8B4A2, #C57B6C)",
      previewDark: "linear-gradient(135deg, #D89B8C, #B86F62)",
    },
  ];

  return (
    <div className={`p-3 rounded-xl border ${darkMode ? "bg-[#252525] border-[#2e2e2e]" : "bg-[#ffffff] border-[#dddddd]"}`}>
      <p className={`text-xs font-semibold mb-2.5 ${darkMode ? "text-[#a1a1aa]" : "text-[#6a6a6a]"}`}>
        Avatar Color Theme
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {options.map((opt) => {
          const isSelected = avatarTheme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setAvatarTheme(opt.id)}
              title={opt.label}
              className={`
                flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                ${isSelected
                  ? darkMode
                    ? "bg-[#1e1e1e] text-[#f7f7f7] ring-2 ring-[#ff385c]"
                    : "bg-[#f7f7f7] text-[#222222] ring-2 ring-[#ff385c]"
                  : darkMode
                    ? "text-[#6a6a6a] hover:text-[#f7f7f7] hover:bg-[#1e1e1e]"
                    : "text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]"
                }
              `}
            >
              <span
                className="w-3.5 h-3.5 rounded-full inline-block flex-shrink-0"
                style={{ background: darkMode ? opt.previewDark : opt.previewLight }}
              />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
