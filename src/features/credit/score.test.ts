import { describe, expect, it } from "vitest";
import { formatDelta, scoreRange } from "./score";
import { reportLeft, scoreTop } from "./score-chart";

describe("scoreRange", () => {
  it.each([
    [300, "poor"],
    [579, "poor"],
    [580, "fair"],
    [669, "fair"],
    [670, "good"],
    [850, "good"],
  ])("%i es %s", (score, range) => {
    expect(scoreRange(score)).toBe(range);
  });
});

describe("formatDelta", () => {
  it("marca las subidas en verde, las bajadas en rojo y sin cambio en gris", () => {
    expect(formatDelta(12)).toMatchObject({ text: "+12", fg: "#15803D" });
    expect(formatDelta(-5)).toMatchObject({ text: "-5", fg: "#B91C1C" });
    expect(formatDelta(0)).toMatchObject({ text: "0", fg: "#4B5563" });
  });
});

describe("posiciones del gráfico", () => {
  it("ubica 850 arriba, 300 abajo y recorta lo que se sale", () => {
    expect(scoreTop(850)).toBe(0);
    expect(scoreTop(300)).toBe(100);
    expect(scoreTop(200)).toBe(100);
  });

  it("reparte los reportes y centra uno solo", () => {
    expect(reportLeft(0, 1)).toBe(50);
    expect([0, 1, 2].map((i) => reportLeft(i, 3))).toEqual([0, 50, 100]);
  });
});
