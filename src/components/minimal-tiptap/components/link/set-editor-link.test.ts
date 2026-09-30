import assert from "node:assert/strict"
import { before, describe, it } from "node:test"
import { JSDOM } from "jsdom"

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>")
const { window } = dom

const installGlobal = (key: string, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  })
}

installGlobal("window", window)
installGlobal("document", window.document)
installGlobal("HTMLElement", window.HTMLElement)
installGlobal("Element", window.Element)
installGlobal("Node", window.Node)
installGlobal("DocumentFragment", window.DocumentFragment)
installGlobal("DOMParser", window.DOMParser)
installGlobal("MutationObserver", window.MutationObserver)
installGlobal("getComputedStyle", window.getComputedStyle.bind(window))
installGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
  setTimeout(() => callback(Date.now()), 0)
)
installGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id))

describe("setEditorLink", () => {
  let editor: import("@tiptap/react").Editor
  let setEditorLink: typeof import("./set-editor-link.ts").setEditorLink

  before(async () => {
    const [{ Editor }, { StarterKit }, linkModule] = await Promise.all([
      import("@tiptap/react"),
      import("@tiptap/starter-kit"),
      import("./set-editor-link.ts"),
    ])
    setEditorLink = linkModule.setEditorLink
    editor = new Editor({
      element: document.createElement("div"),
      extensions: [StarterKit],
      content: "<p>Hello Alps</p>",
    })
  })

  it("sanitizes the URL, sets rel on a new tab, and does not add a paragraph", () => {
    editor.commands.setContent("<p>Hello Alps</p>")
    editor.commands.setTextSelection({ from: 1, to: 6 })

    const applied = setEditorLink(editor, "example.com", "Hello", true)

    assert.equal(applied, true)
    const html = editor.getHTML()
    assert.match(html, /href="https:\/\/example\.com"/)
    assert.match(html, /target="_blank"/)
    assert.match(html, /rel="noopener noreferrer"/)
    assert.equal(html.match(/<p[\s>]/g)?.length, 1)
    assert.equal(editor.state.doc.childCount, 1)
  })

  it("refuses a javascript URL", () => {
    editor.commands.setContent("<p>Hello Alps</p>")
    editor.commands.setTextSelection({ from: 1, to: 6 })

    const applied = setEditorLink(editor, "javascript:alert(1)", "Hello", true)

    assert.equal(applied, false)
    assert.equal(editor.getHTML().toLowerCase().includes("javascript:"), false)
    assert.equal(editor.state.doc.childCount, 1)
  })

  it("does not set target or rel when the link stays in the same tab", () => {
    editor.commands.setContent("<p>Hello Alps</p>")
    editor.commands.setTextSelection({ from: 1, to: 6 })

    setEditorLink(editor, "https://github.com/boracomet/tiptap-mini-ready", "Hello", false)

    const html = editor.getHTML()
    assert.match(html, /href="https:\/\/github.com\/boracomet\/tiptap-mini-ready"/)
    assert.equal(html.includes('target="_blank"'), false)
    assert.equal(html.includes("noopener"), false)
    assert.equal(editor.state.doc.childCount, 1)
  })
})
