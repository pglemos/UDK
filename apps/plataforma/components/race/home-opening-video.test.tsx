import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeOpeningVideo } from "./home-opening-video";

describe("Home opening video", () => {
  it("offers inline muted playback and accessible controls without forcing autoplay before checking motion preferences", () => {
    const html = renderToStaticMarkup(<HomeOpeningVideo />);
    expect(html).toContain("/media/official/home/ultras-opening.mp4");
    expect(html).toContain('width="2048" height="512"');
    expect(html).toContain('muted=""');
    expect(html).toContain('playsInline=""');
    expect(html).toContain('controls=""');
    expect(html).not.toContain('autoPlay=""');
    expect(html).toContain('href="#apresentacao"');
  });
});
