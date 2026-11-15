import test from "node:test";
import assert from "node:assert/strict";
import { buildPlatformAdPreviews, getSupportedAdPreviewPlatforms } from "./xspresso_ad_preview_engine_v1.js";

test("builds separate previews for each requested platform", () => {
  const previews = buildPlatformAdPreviews({
    brand: "Sample Shop",
    headline: "A useful headline",
    primaryText: "A clear offer for customers.",
    description: "Shop today",
    destinationUrl: "https://example.com",
    imageUrl: "https://example.com/product.jpg"
  });
  assert.deepEqual(previews.map(item => item.id), ["facebook", "instagram", "google", "tiktok"]);
  assert.equal(previews.find(item => item.id === "facebook").layout, "social-feed");
  assert.equal(previews.find(item => item.id === "instagram").layout, "visual-first");
  assert.equal(previews.find(item => item.id === "google").layout, "search-results");
  assert.equal(previews.find(item => item.id === "tiktok").layout, "vertical-video");
});

test("does not claim publishing is available even for connected accounts", () => {
  const [preview] = buildPlatformAdPreviews({}, {
    platforms: ["facebook"],
    connections: { facebook: { connected: true, accountLabel: "Demo account" } }
  });
  assert.equal(preview.connection.status, "connected");
  assert.equal(preview.connection.accountLabel, "Demo account");
  assert.equal(preview.publishAvailable, false);
});

test("reports missing creative and destination information", () => {
  const [preview] = buildPlatformAdPreviews({}, { platforms: ["instagram"] });
  assert.ok(preview.warnings.some(item => item.code === "MEDIA_MISSING"));
  assert.ok(preview.warnings.some(item => item.code === "DESTINATION_MISSING"));
  assert.equal(preview.readiness, "needs_attention");
});

test("warns when preview copy exceeds its configured review guideline", () => {
  const [preview] = buildPlatformAdPreviews({
    headline: "H".repeat(45),
    primaryText: "Offer",
    imageUrl: "https://example.com/image.jpg",
    destinationUrl: "https://example.com"
  }, { platforms: ["facebook"] });
  assert.ok(preview.warnings.some(item => item.code === "TEXT_OVER_LIMIT" && item.field === "headline"));
});

test("ignores unknown platform identifiers and supports explicit subsets", () => {
  const previews = buildPlatformAdPreviews({}, { platforms: ["facebook", "myspace"] });
  assert.deepEqual(previews.map(item => item.id), ["facebook"]);
  assert.equal(getSupportedAdPreviewPlatforms().length, 4);
});
