import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  filterFiles,
  isSameContent,
  linkAttributesFor,
  sanitizeUrl,
  shouldSyncExternalValue,
} from "./utils.ts"

describe("isSameContent", () => {
  it("treats identical strings as the same content", () => {
    assert.equal(isSameContent("<p>Hi</p>", "<p>Hi</p>"), true)
  })

  it("detects string changes before an editor reset", () => {
    assert.equal(isSameContent("<p>Hi</p>", ""), false)
    assert.equal(isSameContent("<p>Hi</p>", "<p>Ho</p>"), false)
  })

  it("compares JSON documents structurally", () => {
    assert.equal(
      isSameContent(
        { type: "doc", content: [{ type: "paragraph" }] },
        { type: "doc", content: [{ type: "paragraph" }] }
      ),
      true
    )
    assert.equal(
      isSameContent({ type: "doc", content: [] }, { type: "doc", content: [{ type: "paragraph" }] }),
      false
    )
  })
})

describe("shouldSyncExternalValue", () => {
  it("does not write the same content back while typing", () => {
    const html = "<p>Hello</p>"
    assert.equal(shouldSyncExternalValue(html, html, "<p>Hel</p>"), false)
  })

  it("ignores a throttled echo while the editor has moved on", () => {
    const echoed = "<p>Hello</p>"
    assert.equal(shouldSyncExternalValue("<p>Hello!</p>", echoed, echoed), false)
  })

  it("still applies a reset that was not produced by the editor", () => {
    assert.equal(shouldSyncExternalValue("<p>Hello!</p>", "", "<p>Hello</p>"), true)
  })

  it("applies an external form reset", () => {
    assert.equal(shouldSyncExternalValue("<p>Hello</p>", "", "<p>Hello</p>"), true)
  })

  it("leaves an uncontrolled editor alone", () => {
    assert.equal(shouldSyncExternalValue("<p>Hello</p>", undefined, undefined), false)
  })
})

describe("linkAttributesFor", () => {
  it("sanitizes a bare domain and adds rel for a new tab", () => {
    assert.deepEqual(linkAttributesFor("example.com", true), {
      href: "https://example.com",
      target: "_blank",
      rel: "noopener noreferrer",
    })
  })

  it("keeps a safe absolute URL and omits target when staying in the same tab", () => {
    assert.deepEqual(linkAttributesFor("https://github.com/boracomet/tiptap-mini-ready", false), {
      href: "https://github.com/boracomet/tiptap-mini-ready",
      target: null,
      rel: null,
    })
  })

  it("rejects an empty URL", () => {
    assert.equal(linkAttributesFor("   "), null)
    assert.equal(sanitizeUrl(""), undefined)
    assert.equal(sanitizeUrl(null), undefined)
  })

  it("rejects blocked protocols instead of rewriting them", () => {
    for (const url of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "  javascript:alert(1)",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "data:text/html,<script>alert(1)</script>",
    ]) {
      assert.equal(sanitizeUrl(url), undefined)
      assert.equal(linkAttributesFor(url, true), null)
    }
  })

  it("still allows image data URLs when base64 is enabled", () => {
    const image = "data:image/png;base64,aaaa"
    assert.equal(sanitizeUrl("data:text/html,hi", { allowBase64: true }), undefined)
    assert.equal(sanitizeUrl(image, { allowBase64: false }), undefined)
  })
})

describe("filterFiles", () => {
  it("rejects a javascript URL instead of treating the sanitized value as valid", () => {
    const [valid, errors] = filterFiles([{ src: "javascript:alert(1)" }], {
      allowedMimeTypes: ["image/*"],
      allowBase64: false,
      maxFileSize: 1024,
    })

    assert.equal(valid.length, 0)
    assert.equal(errors.length, 1)
    assert.equal(errors[0]?.reason, "invalidBase64")
  })

  it("keeps an https image URL", () => {
    const [valid, errors] = filterFiles(
      [{ src: "https://example.com/alps.png" }],
      {
        allowedMimeTypes: ["image/*"],
        allowBase64: false,
      }
    )

    assert.equal(errors.length, 0)
    assert.equal(valid.length, 1)
  })
})
