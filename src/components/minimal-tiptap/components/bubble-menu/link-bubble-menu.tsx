import * as React from "react"
import type { ShouldShowProps } from "../../types"
import type { Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { LinkEditBlock } from "../link/link-edit-block"
import { LinkPopoverBlock } from "../link/link-popover-block"
import { setEditorLink } from "../link/set-editor-link"

interface LinkBubbleMenuProps {
  editor: Editor
}

interface LinkAttributes {
  href: string
  target: string
}

const collapsedLinkRange = (editor: Editor) => {
  const { from, to, $from } = editor.state.selection
  const markType = editor.schema.marks.link
  const mark = markType
    ? $from.marks().find((item) => item.type === markType)
    : undefined
  if (!mark) return { from, to }

  const parent = $from.parent
  const parentStart = $from.start()
  let offset = 0

  for (let index = 0; index < parent.childCount; index += 1) {
    const child = parent.child(index)
    const childFrom = parentStart + offset
    const childTo = childFrom + child.nodeSize
    offset += child.nodeSize
    if (from < childFrom || from > childTo) continue
    if (!child.isText || !mark.isInSet(child.marks)) break

    let start = childFrom
    let end = childTo
    let startIndex = index
    let endIndex = index

    while (startIndex > 0) {
      const previous = parent.child(startIndex - 1)
      if (!previous.isText || !mark.isInSet(previous.marks)) break
      start -= previous.nodeSize
      startIndex -= 1
    }

    while (endIndex + 1 < parent.childCount) {
      const next = parent.child(endIndex + 1)
      if (!next.isText || !mark.isInSet(next.marks)) break
      end += next.nodeSize
      endIndex += 1
    }

    return { from: start, to: end }
  }

  return { from, to }
}

export const LinkBubbleMenu: React.FC<LinkBubbleMenuProps> = ({ editor }) => {
  const [showEdit, setShowEdit] = React.useState(false)
  const [linkAttrs, setLinkAttrs] = React.useState<LinkAttributes>({
    href: "",
    target: "",
  })
  const [selectedText, setSelectedText] = React.useState("")

  const updateLinkState = React.useCallback(() => {
    const { from, to } = editor.state.selection
    const { href, target } = editor.getAttributes("link")
    const range = from === to ? collapsedLinkRange(editor) : { from, to }
    const text = editor.state.doc.textBetween(range.from, range.to, " ")

    setLinkAttrs({ href, target })
    setSelectedText(text)
  }, [editor])

  const shouldShow = React.useCallback(
    ({ editor, from, to }: ShouldShowProps) => {
      const linkActive = editor.isActive("link")

      // A collapsed caret still belongs to the link under it.
      if (from === to && !linkActive) {
        return false
      }

      const { href } = editor.getAttributes("link")

      if (!linkActive || !editor.isEditable) {
        return false
      }

      if (href) {
        updateLinkState()
        return true
      }
      return false
    },
    [updateLinkState]
  )

  const handleEdit = React.useCallback(() => {
    setShowEdit(true)
  }, [])

  const onSetLink = React.useCallback(
    (url: string, text?: string, openInNewTab?: boolean) => {
      const applied = setEditorLink(editor, url, text, openInNewTab)
      if (!applied) return
      setShowEdit(false)
      updateLinkState()
    },
    [editor, updateLinkState]
  )

  const onUnsetLink = React.useCallback(() => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run()
    setShowEdit(false)
    updateLinkState()
  }, [editor, updateLinkState])

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      options={{
        placement: "bottom-start",
        onHide: () => setShowEdit(false),
      }}
    >
      {showEdit ? (
        <LinkEditBlock
          defaultUrl={linkAttrs.href}
          defaultText={selectedText}
          defaultIsNewTab={linkAttrs.target === "_blank"}
          onSave={onSetLink}
          className="bg-popover text-popover-foreground w-full min-w-80 rounded-md border p-4 shadow-md outline-hidden"
        />
      ) : (
        <LinkPopoverBlock
          onClear={onUnsetLink}
          url={linkAttrs.href}
          onEdit={handleEdit}
        />
      )}
    </BubbleMenu>
  )
}
