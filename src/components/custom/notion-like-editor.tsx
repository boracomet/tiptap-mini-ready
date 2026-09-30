import "@/components/minimal-tiptap/styles/index.css"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import { EditorContent, useEditor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { StarterKit } from "@tiptap/starter-kit"
import { Placeholder } from "@tiptap/extensions"
import {
  FontBoldIcon,
  FontItalicIcon,
  StrikethroughIcon,
} from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { ToolbarButton } from "@/components/minimal-tiptap/components/toolbar-button"

type SlashMatch = { from: number; to: number; query: string }

type SlashItem = {
  label: string
  run: (editor: Editor) => void
}

const slashItems: SlashItem[] = [
  {
    label: "Text",
    run: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    label: "Heading",
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "List",
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Quote",
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    label: "Code",
    run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: "Divider",
    run: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
]

const slashMatch = (editor: Editor): SlashMatch | null => {
  const { selection } = editor.state
  if (!selection.empty) return null

  const { $from } = selection
  if (!$from.parent.isTextblock) return null

  const textBefore = $from.parent.textBetween(0, $from.parentOffset, "\n", "\0")
  const match = /(^|\s)\/([^\s/]*)$/.exec(textBefore)
  if (!match) return null

  const query = match[2] ?? ""
  return {
    from: $from.pos - query.length - 1,
    to: $from.pos,
    query,
  }
}

const seed =
  "<p>Heidi keeps meadow notes here. Select this sentence for the floating toolbar, or type / for a block.</p>"

export const NotionLikeEditor = () => {
  const [match, setMatch] = React.useState<SlashMatch | null>(null)
  const [index, setIndex] = React.useState(0)
  const [coords, setCoords] = React.useState({ top: 0, left: 0 })
  const menuRef = React.useRef({
    open: false,
    index: 0,
    items: [] as SlashItem[],
    match: null as SlashMatch | null,
  })

  const filtered = React.useMemo(() => {
    const query = match?.query.trim().toLowerCase() ?? ""
    if (!query) return slashItems
    return slashItems.filter((item) => item.label.toLowerCase().includes(query))
  }, [match])

  const applyItem = React.useCallback((editor: Editor, item: SlashItem, range: SlashMatch) => {
    editor.chain().focus().deleteRange({ from: range.from, to: range.to }).run()
    item.run(editor)
    setMatch(null)
  }, [])

  const editorRef = React.useRef<Editor | null>(null)

  menuRef.current = {
    open: Boolean(match) && filtered.length > 0,
    index,
    items: filtered,
    match,
  }

  const extensions = React.useMemo(
    () => [
      StarterKit.configure({
        heading: { HTMLAttributes: { class: "heading-node" } },
        bulletList: { HTMLAttributes: { class: "list-node" } },
        orderedList: { HTMLAttributes: { class: "list-node" } },
        blockquote: { HTMLAttributes: { class: "block-node" } },
        paragraph: { HTMLAttributes: { class: "text-node" } },
      }),
      Placeholder.configure({
        placeholder: "Type / to insert a block…",
      }),
    ],
    []
  )

  const editor = useEditor({
    extensions,
    content: seed,
    editorProps: {
      attributes: {
        class: "focus:outline-hidden px-5 py-4",
      },
      handleKeyDown: (_view, event) => {
        const menu = menuRef.current
        const current = editorRef.current
        if (!menu.open || !menu.match || !current) return false

        if (event.key === "ArrowDown") {
          const next = (menu.index + 1) % menu.items.length
          menuRef.current.index = next
          setIndex(next)
          return true
        }
        if (event.key === "ArrowUp") {
          const next = (menu.index - 1 + menu.items.length) % menu.items.length
          menuRef.current.index = next
          setIndex(next)
          return true
        }
        if (event.key === "Enter") {
          const item = menu.items[menuRef.current.index] ?? menu.items[0]
          if (item) applyItem(current, item, menu.match)
          return true
        }
        if (event.key === "Escape") {
          setMatch(null)
          return true
        }
        return false
      },
    },
  })

  editorRef.current = editor

  React.useEffect(() => {
    if (!editor) return

    const update = () => {
      const next = slashMatch(editor)
      setMatch(next)
      if (!next) return
      const position = editor.view.coordsAtPos(next.from)
      setCoords({ top: position.bottom + 8, left: position.left })
    }

    editor.on("transaction", update)
    return () => {
      editor.off("transaction", update)
    }
  }, [editor])

  React.useEffect(() => {
    setIndex(0)
  }, [match?.query])

  if (!editor) return null

  return (
    <div className="border-input relative flex min-h-56 w-full flex-col rounded-xl border shadow-xs">
      <EditorContent editor={editor} className="minimal-tiptap-editor" />
      <BubbleMenu
        editor={editor}
        pluginKey="notionFloatingToolbar"
        shouldShow={({ editor: current, from, to }) => {
          if (!current.isEditable || from === to) return false
          return current.state.doc.textBetween(from, to, " ").length > 0
        }}
      >
        <div className="bg-background flex items-center gap-0.5 rounded-md border p-1 shadow-md">
          <ToolbarButton
            tooltip="Bold"
            isActive={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <FontBoldIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            tooltip="Italic"
            isActive={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <FontItalicIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            tooltip="Strikethrough"
            isActive={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <StrikethroughIcon className="size-4" />
          </ToolbarButton>
        </div>
      </BubbleMenu>
      {match && filtered.length > 0 ? (
        <div
          role="listbox"
          aria-label="Slash commands"
          className="bg-popover text-popover-foreground fixed z-50 w-48 rounded-md border p-1 shadow-md"
          style={{ top: coords.top, left: coords.left }}
        >
          {filtered.map((item, itemIndex) => (
            <button
              key={item.label}
              type="button"
              role="option"
              aria-selected={itemIndex === index}
              className={cn(
                "flex w-full rounded px-2 py-1.5 text-left text-sm",
                itemIndex === index && "bg-accent"
              )}
              onMouseDown={(event) => {
                event.preventDefault()
                if (match) applyItem(editor, item, match)
              }}
              onMouseEnter={() => setIndex(itemIndex)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
