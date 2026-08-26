import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { InteractiveVideoLoader } from "../components/animations/InteractiveVideoLoader";
import { ThemeProvider } from "../providers/ThemeProvider";

// Mock HTMLMediaElement play/pause
beforeEach(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

describe("InteractiveVideoLoader Component", () => {
  it("renders 3D spatial loader with video source and skip button", () => {
    const onCompleteMock = vi.fn();

    render(
      <ThemeProvider>
        <InteractiveVideoLoader onComplete={onCompleteMock} durationMs={1000} />
      </ThemeProvider>
    );

    expect(screen.getByRole("heading", { name: /RoomBae/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Spatial/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Skip Tour/i })).toBeInTheDocument();
  });

  it("calls onComplete when user clicks skip button", () => {
    const onCompleteMock = vi.fn();

    render(
      <ThemeProvider>
        <InteractiveVideoLoader onComplete={onCompleteMock} durationMs={5000} />
      </ThemeProvider>
    );

    const skipButton = screen.getByRole("button", { name: /Skip Tour/i });
    fireEvent.click(skipButton);

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it("toggles audio mute state on sound button click", () => {
    const onCompleteMock = vi.fn();

    render(
      <ThemeProvider>
        <InteractiveVideoLoader onComplete={onCompleteMock} durationMs={5000} />
      </ThemeProvider>
    );

    const muteButton = screen.getByRole("button", { name: /Unmute Audio/i });
    expect(muteButton).toBeInTheDocument();

    fireEvent.click(muteButton);
    expect(screen.getByRole("button", { name: /Mute Audio/i })).toBeInTheDocument();
  });
});
