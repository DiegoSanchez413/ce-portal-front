import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { colors } from "./colors";

describe("paleta global", () => {
  it("globals.css tiene un token --color-* con el mismo valor para cada color de colors.ts", () => {
    const css = readFileSync(resolve(__dirname, "../../app/globals.css"), "utf8");
    for (const [name, value] of Object.entries(colors)) {
      expect(css, name).toContain(`--color-${name}: ${value};`);
    }
  });
});
