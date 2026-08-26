import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { useTheme } from "@theme/index";
import { Sparkles, ArrowRight, Volume2, VolumeX } from "lucide-react";

interface InteractiveVideoLoaderProps {
  onComplete: () => void;
  durationMs?: number;
  videoSrc?: string;
}

export const InteractiveVideoLoader: React.FC<InteractiveVideoLoaderProps> = ({
  onComplete,
  durationMs = 2800,
  videoSrc = "/back.mp4",
}) => {
  const { darkMode } = useTheme();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [progress, setProgress] = useState(0);
  const [phaseText, setPhaseText] = useState("Initializing RoomBae Spatial Engine...");
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [fps, setFps] = useState(60);
  const [hasWebGL, setHasWebGL] = useState(true);

  // Mouse coordinate refs for high-frequency frame lerping without React re-renders
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [mouseMotion, setMouseMotion] = useState({ x: 0, y: 0 });

  // Progress Counter & Phase Timing
  useEffect(() => {
    const startTime = performance.now();
    let frameId: number;

    const phases = [
      { at: 0, text: "Calibrating Neural Location Mesh..." },
      { at: 25, text: "Synchronizing Luxury Co-Living Spaces..." },
      { at: 55, text: "Rendering 3D Spatial Geometry..." },
      { at: 80, text: "Configuring Real-Time Smart Gateways..." },
      { at: 95, text: "Welcome to RoomBae" },
    ];

    const updateProgress = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(pct);

      for (let i = phases.length - 1; i >= 0; i--) {
        if (pct >= phases[i].at) {
          setPhaseText(phases[i].text);
          break;
        }
      }

      if (pct < 100) {
        frameId = requestAnimationFrame(updateProgress);
      } else {
        setIsReady(true);
        const exitTimer = setTimeout(() => {
          onComplete();
        }, 400);
        return () => clearTimeout(exitTimer);
      }
    };

    frameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(frameId);
  }, [durationMs, onComplete]);

  // Pointer Movement Handlers
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    // Map to [-1, 1] normalized coordinates
    const normX = (clientX / innerWidth) * 2 - 1;
    const normY = -(clientY / innerHeight) * 2 + 1;
    mouseRef.current.targetX = normX;
    mouseRef.current.targetY = normY;
    setMouseMotion({ x: normX, y: normY });
  }, []);

  const handlePointerLeave = useCallback(() => {
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
    setMouseMotion({ x: 0, y: 0 });
  }, []);

  // Three.js Scene, Video Texture, and Particle System Lifecycle
  useEffect(() => {
    const container = canvasContainerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    let isDisposed = false;
    let renderer: THREE.WebGLRenderer;

    // 1. Safe WebGL Renderer initialization with fallback
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = darkMode ? 1.2 : 1.05;
      container.appendChild(renderer.domElement);
      setHasWebGL(true);
    } catch {
      setHasWebGL(false);
      return;
    }

    // 2. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(darkMode ? 0x1a1a1a : 0xf0f0f0, 0.05);

    const camera = new THREE.PerspectiveCamera(
      45,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      100
    );
    camera.position.set(0, 0, 4.2);

    // 3. Lighting Setup adapted for Light / Dark Mode
    const ambientLight = new THREE.AmbientLight(
      darkMode ? 0x334455 : 0xffffff,
      darkMode ? 1.4 : 1.8
    );
    scene.add(ambientLight);

    const tealPointLight = new THREE.PointLight(
      darkMode ? 0x007a99 : 0x004d61,
      darkMode ? 5 : 3.5,
      15
    );
    tealPointLight.position.set(-2, 2, 3);
    scene.add(tealPointLight);

    const rubyPointLight = new THREE.PointLight(
      darkMode ? 0x9b336d : 0x822659,
      darkMode ? 4 : 2.5,
      15
    );
    rubyPointLight.position.set(2, -2, 3);
    scene.add(rubyPointLight);

    const interactiveCursorLight = new THREE.PointLight(
      darkMode ? 0x00e5ff : 0x007a99,
      darkMode ? 3 : 2,
      10
    );
    interactiveCursorLight.position.set(0, 0, 2);
    scene.add(interactiveCursorLight);

    // 4. Video Element & Video Texture
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.autoplay = true;
    video.crossOrigin = "anonymous";
    video.play().catch(() => {
      // Autoplay fallback
    });

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;
    videoTexture.colorSpace = THREE.SRGBColorSpace;

    // 5. Central 3D Curved Video Display Mesh
    const planeGeo = new THREE.PlaneGeometry(3.6, 2.05, 32, 32);

    // Add subtle curvature to plane geometry for cinematic depth
    const posAttr = planeGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const distFromCenter = Math.sqrt(vx * vx + vy * vy);
      posAttr.setZ(i, -Math.pow(distFromCenter, 2) * 0.04);
    }
    planeGeo.computeVertexNormals();

    const videoMaterial = new THREE.MeshPhysicalMaterial({
      map: videoTexture,
      roughness: darkMode ? 0.25 : 0.2,
      metalness: darkMode ? 0.15 : 0.05,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1,
      reflectivity: 0.8,
      side: THREE.DoubleSide,
    });

    const videoMesh = new THREE.Mesh(planeGeo, videoMaterial);
    scene.add(videoMesh);

    // 6. Luxury Framing Border & Vector Geometric Lattice
    const frameEdges = new THREE.EdgesGeometry(planeGeo);
    const frameMaterial = new THREE.LineBasicMaterial({
      color: darkMode ? 0x007a99 : 0x004d61,
      transparent: true,
      opacity: darkMode ? 0.6 : 0.4,
      linewidth: 2,
    });
    const frameLine = new THREE.LineSegments(frameEdges, frameMaterial);
    frameLine.position.z = 0.01;
    videoMesh.add(frameLine);

    // 7. Dynamic Ambient Floating Particles
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);
    const particleVelocities: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 8;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      particleScales[i] = Math.random() * 0.04 + 0.01;
      particleVelocities.push({
        x: (Math.random() - 0.5) * 0.003,
        y: (Math.random() - 0.5) * 0.003,
        z: (Math.random() - 0.5) * 0.002,
      });
    }

    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMat = new THREE.PointsMaterial({
      color: darkMode ? 0x00e5ff : 0x004d61,
      size: darkMode ? 0.04 : 0.035,
      transparent: true,
      opacity: darkMode ? 0.65 : 0.5,
      blending: darkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 8. Interactive Animation Loop with FPS counter and motion damping
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();
    let animId: number;

    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // FPS tracking
      frameCount++;
      if (now - fpsTimer >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - fpsTimer)));
        frameCount = 0;
        fpsTimer = now;
      }

      // Smooth inertia lerping for mouse interaction
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.07;
      mouse.y += (mouse.targetY - mouse.y) * 0.07;

      // 3D Mesh Perspective Tilt
      videoMesh.rotation.y = mouse.x * 0.28;
      videoMesh.rotation.x = -mouse.y * 0.2;
      videoMesh.position.x = mouse.x * 0.15;
      videoMesh.position.y = mouse.y * 0.1;

      // Camera Parallax & Cursor Light Tracking
      camera.position.x = mouse.x * 0.35;
      camera.position.y = mouse.y * 0.25;
      camera.lookAt(0, 0, 0);

      interactiveCursorLight.position.set(mouse.x * 3.5, mouse.y * 2.5, 1.8);

      // Particle Motion Loop
      const posArr = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3] += particleVelocities[i].x + mouse.x * 0.002;
        posArr[i * 3 + 1] += particleVelocities[i].y + mouse.y * 0.002;
        posArr[i * 3 + 2] += particleVelocities[i].z;

        // Wrap around bounds
        if (posArr[i * 3] > 4) posArr[i * 3] = -4;
        if (posArr[i * 3] < -4) posArr[i * 3] = 4;
        if (posArr[i * 3 + 1] > 3) posArr[i * 3 + 1] = -3;
        if (posArr[i * 3 + 1] < -3) posArr[i * 3 + 1] = 3;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Subtle breath rotation for particles
      particles.rotation.y += delta * 0.04;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // 9. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // 10. Memory Cleanup
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);

      try {
        videoTexture.dispose();
        planeGeo.dispose();
        videoMaterial.dispose();
        frameEdges.dispose();
        frameMaterial.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      } catch (e) {
        console.warn("Three.js cleanup:", e);
      }
    };
  }, [darkMode]);

  const toggleSound = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`fixed inset-0 z-[100] flex flex-col justify-between select-none overflow-hidden transition-colors duration-500 ${
        darkMode ? "bg-[#141617] text-white" : "bg-[#f5f7f8] text-[#1a1a1a]"
      }`}
      aria-busy="true"
      aria-label="RoomBae Spatial Experience Loading"
    >
      {/* Hardware Video Source Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        className={hasWebGL ? "hidden" : "absolute inset-0 w-full h-full object-cover opacity-80"}
        style={{
          transform: !hasWebGL
            ? `perspective(1000px) rotateY(${mouseMotion.x * 8}deg) rotateX(${-mouseMotion.y * 6}deg)`
            : undefined,
          transition: "transform 0.1s ease-out",
        }}
        playsInline
        muted={isMuted}
        loop
        autoPlay
        preload="auto"
      />

      {/* ─── Ambient Backdrop Glow Gradients ─────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: darkMode
            ? "radial-gradient(circle at 50% 45%, rgba(0, 122, 153, 0.18) 0%, rgba(155, 51, 109, 0.12) 40%, rgba(20, 22, 23, 0.95) 80%)"
            : "radial-gradient(circle at 50% 45%, rgba(0, 77, 97, 0.12) 0%, rgba(130, 38, 89, 0.08) 45%, rgba(245, 247, 248, 0.95) 80%)",
        }}
      />

      {/* ─── Top Header Bar ───────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-10 py-6">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
            style={{
              background: darkMode
                ? "linear-gradient(135deg, #007A99, #004D61)"
                : "linear-gradient(135deg, #004D61, #007A99)",
            }}
          >
            RB
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase font-mono">
              RoomBae <span className="text-[var(--brand-primary)]">Spatial</span>
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] tracking-widest font-mono">
              ENGINE V2.4 • THREE.JS WEBGL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-Time Frame Tracker Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono font-semibold backdrop-blur-md bg-black/10 border-[var(--border-main)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{fps} FPS</span>
          </div>

          <button
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-full border text-xs backdrop-blur-md border-[var(--border-main)] hover:bg-black/10 transition-colors cursor-pointer"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
            aria-label={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={onComplete}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer border border-[var(--border-main)] hover:scale-105 active:scale-95 bg-[var(--brand-primary)] text-white"
          >
            <span>{isReady ? "Enter RoomBae" : "Skip Tour"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ─── Center 3D Interactive Three.js Viewport ──────────────── */}
      <div
        ref={canvasContainerRef}
        className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* ─── Bottom Status & Interactive Progress Footer ──────────── */}
      <footer className="relative z-20 max-w-2xl w-full mx-auto px-6 pb-8 md:pb-10 flex flex-col items-center gap-4">
        {/* Dynamic Motion Status Headline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phaseText}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 text-center"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)] animate-spin" />
            <span className="text-xs md:text-sm font-semibold tracking-wide text-[var(--text-main)]">
              {phaseText}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* High-Precision Luxury Progress Bar */}
        <div className="w-full relative">
          <div
            className={`w-full h-1.5 rounded-full overflow-hidden border ${
              darkMode ? "bg-white/10 border-white/10" : "bg-black/5 border-black/10"
            }`}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: darkMode
                  ? "linear-gradient(90deg, #007A99 0%, #9B336D 50%, #00E5FF 100%)"
                  : "linear-gradient(90deg, #004D61 0%, #822659 50%, #007A99 100%)",
                boxShadow: darkMode
                  ? "0 0 12px rgba(0, 229, 255, 0.6)"
                  : "0 0 10px rgba(0, 77, 97, 0.4)",
              }}
              transition={{ ease: "easeOut", duration: 0.1 }}
            />
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-muted)] mt-2">
            <span>INTERACTIVE 3D PARALLAX • MOVE MOUSE</span>
            <span className="font-bold text-[var(--brand-primary)]">{progress}%</span>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default InteractiveVideoLoader;
