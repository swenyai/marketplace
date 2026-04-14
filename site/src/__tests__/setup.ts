import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom ships `navigator` without the Clipboard API. Install a writable stub
// so components that call `navigator.clipboard.writeText(…)` work in tests.
// Individual tests can override `writeText` by redefining the clipboard value.
if (!("clipboard" in navigator)) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  cleanup();
});
