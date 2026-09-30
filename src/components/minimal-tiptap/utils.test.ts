import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
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

  it("does not leave javascript as the link protocol", () => {
    const href = sanitizeUrl("javascript:alert(1)")
    assert.equal(href?.toLowerCase().startsWith("javascript:"), false)
    const attributes = linkAttributesFor("javascript:alert(1)", true)
    assert.equal(attributes?.href.toLowerCase().startsWith("javascript:"), false)
    assert.equal(attributes?.rel, "noopener noreferrer")
  })
})
