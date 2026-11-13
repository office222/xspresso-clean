import { buildPlatformAdPreviews } from "./xspresso_ad_preview_engine_v1.js";

const node = (tag, text, className) => {
  const item = document.createElement(tag);
  if (text != null) item.textContent = String(text);
  if (className) item.className = className;
  return item;
};

function addText(parent, tag, text, className) {
  const item = node(tag, text, className);
  parent.append(item);
  return item;
}

function renderCreative(preview) {
  const content = preview.content;
  const creative = node("div", null, `xspresso-ad-creative xspresso-ad-${preview.layout}`);
  addText(creative, "div", content.brand, "xspresso-ad-brand");

  if (preview.layout === "search-results") {
    addText(creative, "div", "Sponsored", "xspresso-ad-sponsored");
    const url = addText(creative, "div", content.destinationUrl || "your-website.example", "xspresso-ad-url");
    url.title = "Destination URL";
    for (const headline of content.headlines) addText(creative, "div", headline, "xspresso-ad-search-headline");
    for (const description of content.descriptions) addText(creative, "p", description, "xspresso-ad-description");
    if (!content.headlines.length) addText(creative, "div", "Your ad headline", "xspresso-ad-search-headline");
    if (!content.descriptions.length) addText(creative, "p", content.primaryText || "Your ad description will appear here.", "xspresso-ad-description");
  } else {
    if (content.imageUrl) {
      const image = node("img");
      image.src = content.imageUrl;
      image.alt = `${content.brand} advertising creative`;
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      creative.append(image);
    } else if (content.videoUrl) {
      addText(creative, "div", "Video creative supplied", "xspresso-ad-media-placeholder");
    } else {
      addText(creative, "div", "Add image or video", "xspresso-ad-media-placeholder");
    }
    addText(creative, "p", content.primaryText || "Your ad text will appear here.", "xspresso-ad-primary");
    addText(creative, "h3", content.headline || "Your headline", "xspresso-ad-headline");
    if (content.description) addText(creative, "p", content.description, "xspresso-ad-description");
    const cta = addText(creative, "span", content.callToAction, "xspresso-ad-cta");
    cta.setAttribute("aria-label", `Call to action: ${content.callToAction}`);
  }
  return creative;
}

/**
 * Mounts an illustrative, platform-specific preview grid.
 * Approval and save actions are delegated to the host app; no publishing occurs here.
 */
export function mountMultiPlatformPreviewPanel({
  root,
  draft,
  platforms,
  connections = {},
  onApprove = () => {},
  onSaveDraft = () => {}
} = {}) {
  if (!root || typeof document === "undefined") throw new TypeError("A root element is required.");
  const previews = buildPlatformAdPreviews(draft, { platforms, connections });
  const panel = node("section", null, "xspresso-multi-preview");
  panel.setAttribute("aria-labelledby", "xspresso-multi-preview-title");
  addText(panel, "h2", "Preview your ads on each platform", "xspresso-multi-preview-title");
  addText(panel, "p", "One campaign, adapted into separate platform previews. These are design previews, not live ad renders.", "xspresso-multi-preview-intro");

  const cards = node("div", null, "xspresso-preview-grid");
  for (const preview of previews) {
    const card = node("article", null, "xspresso-preview-card");
    card.dataset.platform = preview.id;
    const header = node("div", null, "xspresso-preview-card-header");
    const heading = node("div");
    addText(heading, "h3", preview.platform);
    addText(heading, "p", preview.placement, "xspresso-preview-placement");
    header.append(heading);
    const status = node("span", preview.connection.status === "connected" ? "Account connected" : "Not connected", `xspresso-preview-connection ${preview.connection.status}`);
    header.append(status);
    card.append(header, renderCreative(preview));

    const warnings = node("ul", null, "xspresso-preview-warnings");
    for (const warning of preview.warnings) addText(warnings, "li", warning.message);
    if (!preview.warnings.length) addText(warnings, "li", "No basic preview warnings.");
    card.append(warnings);
    addText(card, "p", preview.notes, "xspresso-preview-note");

    const actions = node("div", null, "xspresso-preview-actions");
    const approve = node("button", "Approve this ad", "xspresso-preview-approve");
    approve.type = "button";
    approve.addEventListener("click", () => onApprove({ platform: preview.id, preview }));
    const save = node("button", "Save as draft", "xspresso-preview-save");
    save.type = "button";
    save.addEventListener("click", () => onSaveDraft({ platform: preview.id, preview }));
    actions.append(approve, save);
    card.append(actions);
    cards.append(card);
  }
  panel.append(cards);
  root.replaceChildren(panel);
  return { previews, destroy: () => panel.remove() };
}
