import type { Editor } from "@tiptap/react"
import { linkAttributesFor } from "../../utils"

export function setEditorLink(
  editor: Editor,
  rawUrl: string,
  text?: string,
  openInNewTab?: boolean
): boolean {
  const attributes = linkAttributesFor(rawUrl, openInNewTab)
  if (!attributes) return false

  const { from, to } = editor.state.selection
  const selectedText = editor.state.doc.textBetween(from, to, " ")
  const nextText = text?.trim() || selectedText || attributes.href
  const chain = editor.chain().focus().extendMarkRange("link")

  if (from === to || nextText !== selectedText) {
    chain.insertContent({
      type: "text",
      text: nextText,
      marks: [
        {
          type: "link",
          attrs: {
            ...attributes,
            class: "link",
          },
        },
      ],
    })
  } else {
    chain.setLink({ ...attributes, class: "link" })
  }

  return chain.run()
}
