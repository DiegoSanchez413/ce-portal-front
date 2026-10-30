import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatCountdown, useSecondsUntil } from "./countdown";

describe("contador de reenvío", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-30T10:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("formatea minutos y segundos", () => {
    expect(formatCountdown(59)).toBe("0:59");
    expect(formatCountdown(60)).toBe("1:00");
    expect(formatCountdown(5)).toBe("0:05");
  });

  it("baja cada segundo y se detiene en cero", () => {
    const { result } = renderHook(() => useSecondsUntil("2026-10-30T10:00:59Z"));
    expect(result.current).toBe(59);

    act(() => vi.advanceTimersByTime(9_000));
    expect(result.current).toBe(50);

    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current).toBe(0);
  });

  it("devuelve cero sin fecha o con una fecha pasada", () => {
    expect(renderHook(() => useSecondsUntil(null)).result.current).toBe(0);
    expect(renderHook(() => useSecondsUntil("2026-10-30T09:59:00Z")).result.current).toBe(0);
  });
});
