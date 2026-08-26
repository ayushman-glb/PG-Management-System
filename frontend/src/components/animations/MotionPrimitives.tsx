import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { useTheme } from "@theme/index";
import { ChevronDown, X } from "lucide-react";
import { TIMING, EASING, SPRINGS } from "./constants";
import { modalOverlay, modalContent, fadeIn, fadeUp, fadeLeft, fadeRight, scaleIn } from "./variants";

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
        darkMode ? "bg-[var(--bg-nested)] border-[var(--border-main)]" : "bg-[var(--bg-surface)] border-[var(--border-main)]"
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
                ? "text-[var(--text-main)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={SPRINGS.SNAPPY}
                className={`absolute inset-0 rounded-xl shadow-sm -z-10 ${
                  darkMode
                    ? "bg-[var(--bg-card)] border border-[var(--brand-primary)]/40 shadow-[0_2px_12px_rgba(0,122,153,0.15)]"
                    : "bg-[var(--bg-card)] border border-[var(--brand-primary)]/40 shadow-[0_2px_12px_rgba(0,77,97,0.1)]"
                }`}
              />
            )}

            {Icon && (
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? "text-[var(--brand-primary)]" : "text-current"
                }`}
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]"
                    : "bg-[var(--bg-nested)] text-[var(--text-muted)]"
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
// 2. Spotlight Card (Cursor Tracking Glow in Dark Teal)
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

  const defaultSpotlight =
    spotlightColor ??
    (darkMode ? "rgba(0, 122, 153, 0.18)" : "rgba(0, 77, 97, 0.12)");

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
      transition={{ duration: TIMING.MICRO, ease: EASING.OUT_CUBIC }}
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
        darkMode ? "bg-[var(--bg-card)] border-[var(--border-main)]" : "bg-[var(--bg-card)] border-[var(--border-main)]"
      } ${className}`}
      style={{
        boxShadow: isHovered
          ? darkMode
            ? "0 14px 35px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 122, 153, 0.15)"
            : "0 14px 35px rgba(0, 77, 97, 0.12)"
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
              darkMode ? "bg-[var(--bg-card)] border-[var(--border-main)]" : "bg-[var(--bg-card)] border-[var(--border-main)]"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between p-4 font-semibold text-sm text-left select-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {Icon && (
                  <Icon className="w-4.5 h-4.5 text-[var(--brand-primary)]" />
                )}
                <span className="text-[var(--text-main)]">
                  {item.title}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: TIMING.MICRO, ease: EASING.SMOOTH }}
              >
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: TIMING.NORMAL, ease: EASING.SMOOTH }}
                >
                  <div className="px-4 pb-4 pt-1 text-sm border-t border-[var(--border-main)] text-[var(--text-muted)]">
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
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full ${maxWidth} rounded-3xl border shadow-2xl p-6 overflow-hidden z-10 ${
              darkMode ? "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)]" : "bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)]"
            }`}
          >
            {title && (
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-subtle)]">
                <h3 className="text-lg font-bold">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-xl opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
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
// 6. Animated Badge / Status Pill (Jewel-Tone Colors)
// ============================================================================

export interface AnimatedBadgeProps {
  label: string;
  variant?: "success" | "warning" | "danger" | "teal" | "ruby" | "neutral";
  pulse?: boolean;
  className?: string;
}

export function AnimatedBadge({
  label,
  variant = "teal",
  pulse = true,
  className = "",
}: AnimatedBadgeProps) {
  const variantStyles = {
    teal: "bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border-[var(--brand-primary)]/30",
    ruby: "bg-[var(--accent-ruby)]/15 text-[var(--accent-ruby)] border-[var(--accent-ruby)]/30",
    success: "bg-[var(--accent-forest)]/15 text-[var(--accent-forest)] border-[var(--accent-forest)]/30",
    warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    neutral: "bg-[var(--bg-nested)] text-[var(--text-muted)] border-[var(--border-main)]",
  };

  const dotColors = {
    teal: "bg-[var(--brand-primary)]",
    ruby: "bg-[var(--accent-ruby)]",
    success: "bg-[var(--accent-forest)]",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    neutral: "bg-[var(--text-muted)]",
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
            transition={{ duration: TIMING.MICRO }}
            className={`absolute ${positionClasses[position]} z-50 px-2.5 py-1 text-xs font-medium rounded-lg border shadow-lg whitespace-nowrap pointer-events-none bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)]`}
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
        duration: TIMING.NORMAL,
        delay: index * 0.04,
        ease: EASING.OUT_CUBIC,
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

export function RevealOnScroll({
  children,
  className = "",
  variant = "fadeUp",
  delay = 0,
  duration = TIMING.SECTION,
  threshold = 0.15,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

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

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const variantMap = {
    fadeUp,
    fadeLeft,
    fadeRight,
    scale: scaleIn,
    fade: fadeIn,
  };

  const selectedVariant = variantMap[variant] || fadeUp;

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={selectedVariant}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{
        duration: prefersReducedMotion ? 0 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: EASING.OUT_CUBIC,
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// 10. StaggerContainer + StaggerItem
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      transition={{ duration: TIMING.SECTION, ease: EASING.OUT_CUBIC }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// 11. RippleButton — Tactile button with click ripple effect
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

  const addRipple = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current || disabled) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples((prev) => [...prev, { id, x, y }]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
      onClick?.(e);
    },
    [disabled, onClick]
  );

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={addRipple}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: TIMING.MICRO, ease: EASING.SMOOTH }}
      className={`relative overflow-hidden select-none cursor-pointer ${className}`}
    >
      {children}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ scale: 0, opacity: 0.35 }}
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
              background: "rgba(255,255,255,0.4)",
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
            transition={{ duration: TIMING.MICRO, ease: EASING.OUT_CUBIC }}
          >
            <HoverIcon className={iconClassName} />
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: TIMING.MICRO, ease: EASING.OUT_CUBIC }}
          >
            <Icon className={iconClassName} />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
