import { afterEach } from "vitest";

// component tests render into jsdom; clean up between tests (nothing to do in the node environment)
afterEach(async () => {
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
});
