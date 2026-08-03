import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { useTheme } from "@theme/index";
import { ChevronDown, X } from "lucide-react";

// ============================================================================
// 1. Animated Tabs (Sliding Pill Indicator)
// ============================================================================

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
  fullWidth?: boolean;
}

export function AnimatedTabs({
  tabs,
  activeTab,
  onChange,
  className = "",
  layoutId = "active-tab-indicator",
  fullWidth = true,
}: AnimatedTabsProps) {
  const { darkMode } = useTheme();

  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-2xl border transition-colors ${
        darkMode ? "bg-[#2B2725] border-[#4A443F]" : "bg-[#F8EEE5] border-[#E6D7CA]"
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={isActive}
            className={`relative flex items-center ${fullWidth ? "flex-1 justify-center text-center" : ""} gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 select-none cursor-pointer z-10 ${
              isActive
                ? darkMode
                  ? "text-[#F7F3EE]"
                  : "text-[#3B2A24]"
                : darkMode
                ? "text-[#C6B9AE] hover:text-[#F7F3EE]"
                : "text-[#6E5A52] hover:text-[#3B2A24]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className={`absolute inset-0 rounded-xl shadow-sm -z-10 ${
                  darkMode
                    ? "bg-[#332D2B] border border-[#C89A4B]/40 shadow-[0_2px_10px_rgba(200,154,75,0.15)]"
                    : "bg-[#FFFDFB] border border-[#D9A87C]/50 shadow-[0_2px_10px_rgba(217,168,124,0.2)]"
                }`}
              />
            )}

            {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? (darkMode ? "text-[#C89A4B]" : "text-[#D9A87C]") : ""}`} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? darkMode
                      ? "bg-[#C89A4B]/20 text-[#E8C98A]"
                      : "bg-[#D9A87C]/20 text-[#C58B63]"
                    : darkMode
                    ? "bg-[#3D3632] text-[#C6B9AE]"
                    : "bg-[#E6D7CA] text-[#6E5A52]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// 2. Spotlight Card (Cursor Tracking Glow)
// ============================================================================

export interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  onClick?: () => void;
}

export function SpotlightCard({
  children,
  className = "",
  spotlightColor,
  onClick,
}: SpotlightCardProps) {
  const { darkMode } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const defaultSpotlight = spotlightColor ?? (darkMode ? "rgba(200, 154, 75, 0.15)" : "rgba(217, 168, 124, 0.18)");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: -1000, y: -1000 });
      }}
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
        darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-[#FFFDFB] border-[#E6D7CA]"
      } ${className}`}
      style={{
        boxShadow: isHovered
          ? darkMode
            ? "0 14px 35px rgba(200, 154, 75, 0.12)"
            : "0 14px 35px rgba(93, 55, 28, 0.12)"
          : undefined,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 -z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(450px circle at ${mousePosition.x}px ${mousePosition.y}px, ${defaultSpotlight}, transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// ============================================================================
// 3. Animated Counter (Smooth Numeric Roll)
// ============================================================================

export interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: AnimatedCounterProps) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => {
    return `${prefix}${current.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`;
  });

  const [output, setOutput] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return display.on("change", (v) => setOutput(v));
  }, [display]);

  return <span className={className}>{output}</span>;
}

// ============================================================================
// 4. Animated Accordion (Collapsible Section)
// ============================================================================

export interface AccordionItem {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

export interface AnimatedAccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
  className?: string;
}

export function AnimatedAccordion({
  items,
  defaultOpenId,
  className = "",
}: AnimatedAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);
  const { darkMode } = useTheme();

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        const Icon = item.icon;

        return (
          <div
            key={item.id}
            className={`rounded-2xl border overflow-hidden transition-colors ${
              darkMode ? "bg-[#332D2B] border-[#4A443F]" : "bg-[#FFFDFB] border-[#E6D7CA]"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between p-4 font-semibold text-sm text-left select-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {Icon && (
                  <Icon
                    className={`w-4.5 h-4.5 ${
                      darkMode ? "text-[#C89A4B]" : "text-[#D9A87C]"
                    }`}
                  />
                )}
                <span className={darkMode ? "text-[#F7F3EE]" : "text-[#3B2A24]"}>
                  {item.title}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <ChevronDown className={`w-4 h-4 ${darkMode ? "text-[#C6B9AE]" : "text-[#6E5A52]"}`} />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <div
                    className={`px-4 pb-4 pt-1 text-sm border-t ${
                      darkMode
                        ? "border-[#4A443F] text-[#C6B9AE]"
                        : "border-[#E6D7CA] text-[#6E5A52]"
                    }`}
                  >
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// 5. Animated Dialog / Modal
// ============================================================================

export interface AnimatedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function AnimatedDialog({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: AnimatedDialogProps) {
  const { darkMode } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`relative w-full ${maxWidth} rounded-3xl border shadow-2xl p-6 overflow-hidden z-10 ${
              darkMode ? "bg-[#2B2725] border-[#4A443F] text-[#F7F3EE]" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"
            }`}
          >
            {title && (
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/20">
                <h3 className="text-lg font-bold">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-xl opacity-70 hover:opacity-100 transition-opacity"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// 6. Animated Badge / Status Pill
// ============================================================================

export interface AnimatedBadgeProps {
  label: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  pulse?: boolean;
  className?: string;
}

export function AnimatedBadge({
  label,
  variant = "success",
  pulse = true,
  className = "",
}: AnimatedBadgeProps) {
  const variantStyles = {
    success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    info: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    neutral: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
  };

  const dotColors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-blue-500",
    neutral: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border select-none ${variantStyles[variant]} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColors[variant]}`} />
      </span>
      <span>{label}</span>
    </span>
  );
}

// ============================================================================
// 7. Floating Tooltip
// ============================================================================

export interface FloatingTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function FloatingTooltip({
  content,
  children,
  position = "top",
}: FloatingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { darkMode } = useTheme();

  const positionClasses = {
    top: "-top-10 left-1/2 -translate-x-1/2",
    bottom: "-bottom-10 left-1/2 -translate-x-1/2",
    left: "-left-28 top-1/2 -translate-y-1/2",
    right: "-right-28 top-1/2 -translate-y-1/2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === "top" ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${positionClasses[position]} z-50 px-2.5 py-1 text-xs font-medium rounded-lg border shadow-lg whitespace-nowrap pointer-events-none ${
              darkMode ? "bg-[#332D2B] border-[#4A443F] text-[#F7F3EE]" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]"
            }`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// 8. Animated List & Item Wrapper
// ============================================================================

export function AnimatedList({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function AnimatedListItem({
  children,
  index = 0,
  className = "",
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{
        duration: 0.25,
        delay: index * 0.04,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// 9. RevealOnScroll — Scroll-triggered entrance wrapper
// ============================================================================

export interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  variant?: "fadeUp" | "fadeLeft" | "fadeRight" | "scale" | "fade";
  delay?: number;
  duration?: number;
  threshold?: number;
}

const revealVariants = {
  fadeUp: {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

export function RevealOnScroll({
  children,
  className = "",
  variant = "fadeUp",
  delay = 0,
  duration = 0.6,
  threshold = 0.15,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  const chosen = prefersReducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : revealVariants[variant];

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={chosen}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{
        duration: prefersReducedMotion ? 0 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// 10. StaggerContainer + StaggerItem — Cascade animation group
// ============================================================================

export function StaggerContainer({
  children,
  className = "",
  stagger = 0.08,
  delayStart = 0,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayStart?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delayStart,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
  variant = "fadeUp",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof revealVariants;
}) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const chosen = prefersReducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : revealVariants[variant];

  return (
    <motion.div
      className={className}
      variants={chosen}
      transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// 11. RippleButton — Premium button with click ripple effect
// ============================================================================

export interface RippleButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  ariaLabel?: string;
}

interface RippleItem {
  id: number;
  x: number;
  y: number;
}

export function RippleButton({
  children,
  className = "",
  onClick,
  type = "button",
  disabled = false,
  ariaLabel,
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const addRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    onClick?.(e);
  }, [disabled, onClick]);

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={addRipple}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`relative overflow-hidden select-none ${className}`}
    >
      {children}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ scale: 0, opacity: 0.4 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: r.x - 16,
              top: r.y - 16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.35)",
              pointerEvents: "none",
            }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
}

// ============================================================================
// 12. MorphingIcon — Animated icon state transition
// ============================================================================

export function MorphingIcon({
  icon: Icon,
  hoverIcon: HoverIcon,
  className = "",
  iconClassName = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  hoverIcon: React.ComponentType<{ className?: string }>;
  className?: string;
  iconClassName?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence mode="wait">
        {hovered ? (
          <motion.span
            key="hover"
            initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7, rotate: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <HoverIcon className={iconClassName} />
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Icon className={iconClassName} />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
