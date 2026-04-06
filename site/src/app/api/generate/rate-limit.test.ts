import { describe, it, expect } from "vitest";
import { createRateLimiter, extractClientIp } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows requests up to the limit within a window", () => {
    let t = 0;
    const rl = createRateLimiter({
      limit: 3,
      windowMs: 1000,
      now: () => t,
    });

    expect(rl.check("ip-a").allowed).toBe(true);
    expect(rl.check("ip-a").allowed).toBe(true);
    expect(rl.check("ip-a").allowed).toBe(true);
  });

  it("blocks the next request after the limit is reached", () => {
    let t = 0;
    const rl = createRateLimiter({
      limit: 2,
      windowMs: 1000,
      now: () => t,
    });

    rl.check("ip-a");
    rl.check("ip-a");
    const blocked = rl.check("ip-a");

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("tracks different keys independently", () => {
    let t = 0;
    const rl = createRateLimiter({
      limit: 1,
      windowMs: 1000,
      now: () => t,
    });

    expect(rl.check("ip-a").allowed).toBe(true);
    expect(rl.check("ip-a").allowed).toBe(false);
    // Different IP should not be affected.
    expect(rl.check("ip-b").allowed).toBe(true);
  });

  it("resets the counter after the window expires", () => {
    let t = 0;
    const rl = createRateLimiter({
      limit: 1,
      windowMs: 1000,
      now: () => t,
    });

    expect(rl.check("ip-a").allowed).toBe(true);
    expect(rl.check("ip-a").allowed).toBe(false);

    // Advance past the window.
    t = 1001;
    const afterReset = rl.check("ip-a");
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(0); // limit=1, used 1
  });

  it("reports remaining count correctly", () => {
    let t = 0;
    const rl = createRateLimiter({
      limit: 5,
      windowMs: 1000,
      now: () => t,
    });

    expect(rl.check("ip-a").remaining).toBe(4);
    expect(rl.check("ip-a").remaining).toBe(3);
    expect(rl.check("ip-a").remaining).toBe(2);
  });

  it("exposes resetAt aligned with the window", () => {
    let t = 500;
    const rl = createRateLimiter({
      limit: 5,
      windowMs: 1000,
      now: () => t,
    });

    const first = rl.check("ip-a");
    expect(first.resetAt).toBe(1500);

    // Subsequent checks within the window should return the same resetAt.
    t = 800;
    const second = rl.check("ip-a");
    expect(second.resetAt).toBe(1500);
  });
});

describe("extractClientIp", () => {
  it("returns the first IP from x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.1, 70.41.3.18, 150.172.238.178",
    });
    expect(extractClientIp(headers)).toBe("203.0.113.1");
  });

  it("trims whitespace around the extracted IP", () => {
    const headers = new Headers({
      "x-forwarded-for": "   203.0.113.1  , 70.41.3.18",
    });
    expect(extractClientIp(headers)).toBe("203.0.113.1");
  });

  it("handles a single IP with no comma", () => {
    const headers = new Headers({ "x-forwarded-for": "198.51.100.42" });
    expect(extractClientIp(headers)).toBe("198.51.100.42");
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", () => {
    const headers = new Headers({ "x-real-ip": "192.0.2.99" });
    expect(extractClientIp(headers)).toBe("192.0.2.99");
  });

  it("prefers x-forwarded-for when both headers are present", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.1",
      "x-real-ip": "192.0.2.99",
    });
    expect(extractClientIp(headers)).toBe("203.0.113.1");
  });

  it("returns 'unknown' when no proxy headers are set", () => {
    const headers = new Headers();
    expect(extractClientIp(headers)).toBe("unknown");
  });

  it("ignores an empty x-forwarded-for value", () => {
    const headers = new Headers({
      "x-forwarded-for": "",
      "x-real-ip": "192.0.2.99",
    });
    expect(extractClientIp(headers)).toBe("192.0.2.99");
  });
});
