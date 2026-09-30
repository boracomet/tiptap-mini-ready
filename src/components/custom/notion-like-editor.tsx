import "@/components/minimal-tiptap/styles/index.css"

import * as React from "react"
import { createPortal } from "react-dom"
import type { Editor } from "@tiptap/react"
import { EditorContent, useEditor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { StarterKit } from "@tiptap/starter-kit"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { Placeholder } from "@tiptap/extensions"
import {
  DragHandlePlugin,
  defaultComputePositionConfig,
  dragHandlePluginDefaultKey,
} from "@tiptap/extension-drag-handle"
import { NodeRangeSelection } from "@tiptap/extension-node-range"
import { Image } from "@/components/minimal-tiptap/extensions/image"
import { MeasuredContainer } from "@/components/minimal-tiptap/components/measured-container"
import {
  FontBoldIcon,
  FontItalicIcon,
  StrikethroughIcon,
} from "@radix-ui/react-icons"
import {
  Code,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Plus,
  Sparkles,
  TextQuote,
  Type,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ToolbarButton } from "@/components/minimal-tiptap/components/toolbar-button"

type SlashMatch = { from: number; to: number; query: string }

type SlashGroup = "AI" | "Style" | "Lists" | "Blocks"

type SlashItem = {
  id: string
  label: string
  group: SlashGroup
  keywords: string
  icon: LucideIcon
  disabled?: boolean
  run?: (editor: Editor) => void
}

const groups: SlashGroup[] = ["AI", "Style", "Lists", "Blocks"]

const pickImage = (editor: Editor) => {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = "image/*"
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    editor.chain().focus().setImages([{ src: file, alt: file.name, title: file.name }]).run()
  }
  input.click()
}

const slashItems: SlashItem[] = [
  {
    id: "continue",
    label: "Continue Writing",
    group: "AI",
    keywords: "ai continue writing",
    icon: Sparkles,
    disabled: true,
  },
  {
    id: "ask",
    label: "Ask AI",
    group: "AI",
    keywords: "ai ask",
    icon: Sparkles,
    disabled: true,
  },
  {
    id: "text",
    label: "Text",
    group: "Style",
    keywords: "text paragraph",
    icon: Type,
    run: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: "h1",
    label: "Heading 1",
    group: "Style",
    keywords: "h1 heading title",
    icon: Heading1,
    run: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    label: "Heading 2",
    group: "Style",
    keywords: "h2 heading",
    icon: Heading2,
    run: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    label: "Heading 3",
    group: "Style",
    keywords: "h3 heading",
    icon: Heading3,
    run: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
  },
  {
    id: "bullet",
    label: "Bullet list",
    group: "Lists",
    keywords: "bullet list ul",
    icon: List,
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "numbered",
    label: "Numbered list",
    group: "Lists",
    keywords: "numbered ordered list ol",
    icon: ListOrdered,
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "todo",
    label: "Todo",
    group: "Lists",
    keywords: "todo task checkbox",
    icon: ListTodo,
    run: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    id: "quote",
    label: "Quote",
    group: "Blocks",
    keywords: "quote blockquote",
    icon: TextQuote,
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "code",
    label: "Code",
    group: "Blocks",
    keywords: "code block",
    icon: Code,
    run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "divider",
    label: "Divider",
    group: "Blocks",
    keywords: "divider horizontal rule hr",
    icon: Minus,
    run: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "image",
    label: "Image",
    group: "Blocks",
    keywords: "image photo picture upload",
    icon: ImageIcon,
    run: pickImage,
  },
]

const slashMatch = (editor: Editor): SlashMatch | null => {
  const { selection } = editor.state
  if (!selection.empty) return null

  const { $from } = selection
  if (!$from.parent.isTextblock || $from.parent.type.spec.code) return null

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

const menuCoordinates = (anchor: { top: number; bottom: number; left: number }) => {
  const menuHeight = 400
  const below = anchor.bottom + 8
  const top =
    below + menuHeight > window.innerHeight ? Math.max(8, anchor.top - menuHeight - 8) : below
  return { top, left: anchor.left }
}

const firstEnabledIndex = (items: SlashItem[]) => {
  const index = items.findIndex((item) => !item.disabled)
  return index < 0 ? 0 : index
}

const stepIndex = (items: SlashItem[], start: number, direction: 1 | -1) => {
  if (items.length === 0) return 0
  let index = start
  for (let step = 0; step < items.length; step += 1) {
    index = (index + direction + items.length) % items.length
    if (!items[index]?.disabled) return index
  }
  return start
}

type DragSource = { pos: number; size: number }

type TopLevelBlock = { index: number; pos: number; size: number }

const topLevelBlocks = (doc: Editor["state"]["doc"]): TopLevelBlock[] => {
  const blocks: TopLevelBlock[] = []
  doc.forEach((node, offset) => {
    blocks.push({ index: blocks.length, pos: offset, size: node.nodeSize })
  })
  return blocks
}

const blockAt = (doc: Editor["state"]["doc"], pos: number) => {
  return topLevelBlocks(doc).find((block) => pos >= block.pos && pos < block.pos + block.size) ?? null
}

const moveTopLevelBlock = (editor: Editor, pos: number, direction: -1 | 1) => {
  const { doc } = editor.state
  const current = blockAt(doc, pos)
  if (!current) return false

  const blocks = topLevelBlocks(doc)
  const target = blocks[current.index + direction]
  if (!target) return false

  const node = doc.nodeAt(current.pos)
  if (!node) return false

  const range = NodeRangeSelection.create(doc, current.pos, current.pos + node.nodeSize)
  const moved = range.content().content.firstChild
  if (!moved) return false

  const tr = editor.state.tr
  if (direction < 0) {
    tr.insert(target.pos, moved)
    const mapped = tr.mapping.map(current.pos)
    tr.delete(mapped, mapped + moved.nodeSize)
  } else {
    tr.delete(current.pos, current.pos + node.nodeSize)
    const insertAt = tr.mapping.map(target.pos + target.size)
    tr.insert(insertAt, moved)
  }

  editor.view.dispatch(tr)
  return true
}

const topLevelFromPoint = (view: Editor["view"], x: number, y: number) => {
  const elements = view.root.elementsFromPoint(x, y)
  for (const element of elements) {
    if (!(element instanceof HTMLElement) || !view.dom.contains(element)) continue
    let current: HTMLElement | null = element
    while (current.parentElement && current.parentElement !== view.dom) {
      current = current.parentElement
    }
    if (current.parentElement !== view.dom) continue

    let pos: number
    try {
      pos = view.posAtDOM(current, 0)
    } catch {
      continue
    }

    const $pos = view.state.doc.resolve(pos)
    const nodePos = $pos.depth === 0 ? pos : $pos.before(1)
    const node = view.state.doc.nodeAt(nodePos)
    if (!node) continue
    return { pos: nodePos, size: node.nodeSize, dom: current }
  }
  return null
}

const BlockGutter = ({
  editor,
  onAdd,
  dragSourceRef,
}: {
  editor: Editor
  onAdd: (pos: number) => void
  dragSourceRef: React.MutableRefObject<DragSource | null>
}) => {
  const [element, setElement] = React.useState<HTMLDivElement | null>(null)
  const [blockPos, setBlockPos] = React.useState(-1)
  const [moveMenu, setMoveMenu] = React.useState<{ top: number; left: number } | null>(null)
  const posRef = React.useRef(-1)
  const addPressed = React.useRef(false)
  const pointerRef = React.useRef<{ x: number; y: number } | null>(null)
  const onAddRef = React.useRef(onAdd)
  onAddRef.current = onAdd
  const currentBlock = blockPos >= 0 ? blockAt(editor.state.doc, blockPos) : null
  const blockCount = editor.state.doc.childCount
  const canMoveUp = Boolean(currentBlock && currentBlock.index > 0)
  const canMoveDown = Boolean(currentBlock && currentBlock.index < blockCount - 1)

  React.useEffect(() => {
    if (!element || editor.isDestroyed) return

    const cancelAddDrag = (event: DragEvent) => {
      if (!addPressed.current) return
      event.preventDefault()
      event.stopImmediatePropagation()
    }

    const rememberSource = (event: DragEvent) => {
      if (addPressed.current) return
      const pos = posRef.current
      const node = pos >= 0 ? editor.state.doc.nodeAt(pos) : null
      if (!node) {
        dragSourceRef.current = null
        return
      }
      dragSourceRef.current = { pos, size: node.nodeSize }
      event.dataTransfer?.setData("text/plain", node.textContent || "block")
    }

    const ensureDragData = (event: DragEvent) => {
      if (addPressed.current || !event.dataTransfer) return
      const source = dragSourceRef.current
      const node = source ? editor.state.doc.nodeAt(source.pos) : null
      event.dataTransfer.setData("text/plain", node?.textContent || "block")
      if (editor.view.dragging || !node || !source) return

      const selection = NodeRangeSelection.create(editor.state.doc, source.pos, source.pos + node.nodeSize)
      editor.view.dragging = { slice: selection.content(), move: true }
      editor.view.dispatch(editor.state.tr.setSelection(selection))
    }

    const clearSource = () => {
      dragSourceRef.current = null
    }

    element.addEventListener("dragstart", cancelAddDrag, true)
    element.addEventListener("dragstart", rememberSource, true)
    element.addEventListener("dragend", clearSource)
    const plugin = DragHandlePlugin({
      pluginKey: dragHandlePluginDefaultKey,
      editor,
      element,
      computePositionConfig: {
        ...defaultComputePositionConfig,
        placement: "left-start",
        strategy: "absolute",
      },
      onNodeChange: ({ pos }) => {
        posRef.current = pos
        setBlockPos(pos)
      },
    })
    element.addEventListener("dragstart", ensureDragData)
    editor.registerPlugin(plugin.plugin)

    return () => {
      element.removeEventListener("dragstart", cancelAddDrag, true)
      element.removeEventListener("dragstart", rememberSource, true)
      element.removeEventListener("dragstart", ensureDragData)
      element.removeEventListener("dragend", clearSource)
      editor.unregisterPlugin(dragHandlePluginDefaultKey)
      plugin.unbind()
    }
  }, [dragSourceRef, editor, element])

  React.useEffect(() => {
    if (!moveMenu || editor.isDestroyed) return
    editor.view.dispatch(editor.state.tr.setMeta("lockDragHandle", true))
    if (element) element.style.visibility = "visible"
    return () => {
      if (editor.isDestroyed) return
      editor.view.dispatch(editor.state.tr.setMeta("lockDragHandle", false))
    }
  }, [editor, element, moveMenu])

  React.useEffect(() => {
    if (!moveMenu) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest("[data-move-menu], [data-drag-handle]")) return
      setMoveMenu(null)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [moveMenu])

  const moveMenuNode = moveMenu
    ? createPortal(
        <div
          data-move-menu
          role="menu"
          aria-label="Move block"
          className="bg-popover text-popover-foreground fixed z-50 w-40 rounded-md border p-1 shadow-md"
          style={{ top: moveMenu.top, left: moveMenu.left }}
        >
          <button
            type="button"
            role="menuitem"
            data-move-up
            disabled={!canMoveUp}
            className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40"
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              addPressed.current = true
            }}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              addPressed.current = false
              if (!canMoveUp) return
              moveTopLevelBlock(editor, posRef.current, -1)
              setMoveMenu(null)
            }}
          >
            <ChevronUp className="size-4" />
            Move up
          </button>
          <button
            type="button"
            role="menuitem"
            data-move-down
            disabled={!canMoveDown}
            className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40"
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              addPressed.current = true
            }}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              addPressed.current = false
              if (!canMoveDown) return
              moveTopLevelBlock(editor, posRef.current, 1)
              setMoveMenu(null)
            }}
          >
            <ChevronDown className="size-4" />
            Move down
          </button>
        </div>,
        document.body
      )
    : null

  return (
    <div
      ref={setElement}
      data-notion-gutter
      aria-label="Block controls"
      className="text-muted-foreground z-30 flex items-center"
      style={{ visibility: "hidden", position: "absolute" }}
    >
      <button
        type="button"
        data-add-block
        aria-label="Add a block below"
        className="hover:bg-accent hover:text-accent-foreground flex size-6 items-center justify-center rounded"
        draggable={false}
        onMouseDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          addPressed.current = true
        }}
        onMouseUp={() => {
          addPressed.current = false
        }}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          addPressed.current = false
          onAddRef.current(posRef.current)
        }}
      >
        <Plus className="size-4" />
      </button>
      <button
        type="button"
        data-drag-handle
        aria-haspopup="menu"
        aria-expanded={moveMenu ? true : undefined}
        aria-label="Drag to move, or open Move up and Move down"
        title="Drag to move. Click for Move up and Move down."
        className="hover:bg-accent hover:text-accent-foreground flex size-6 cursor-grab items-center justify-center rounded active:cursor-grabbing"
        draggable={false}
        onMouseDown={(event) => {
          pointerRef.current = { x: event.clientX, y: event.clientY }
        }}
        onMouseUp={(event) => {
          const start = pointerRef.current
          pointerRef.current = null
          if (!start || !element) return
          const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y)
          if (moved > 4) return
          const rect = element.getBoundingClientRect()
          setMoveMenu({ top: rect.bottom + 4, left: rect.left })
        }}
      >
        <GripVertical className="size-4" />
      </button>
      {moveMenuNode}
    </div>
  )
}

const seed = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Meadow notes" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Heidi's working copy. The Alps keep editing themselves. Select any sentence for the floating toolbar.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "This morning" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "The meadow opened on time. The goats called a meeting before breakfast and voted the wildflowers non-essential.",
        },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Pack the thermos. The story gets wholesome fast." }],
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Coffee counts. Yodeling does not." }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Do not negotiate with the horns." }],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Still open" }],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Admire the flag. It is a square on purpose." }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Ask the echo to stop repeating the meeting notes." }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Write Spyri a thank-you. The Alps will not." }],
            },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "If you yodel, the echo yodels back. That is acoustics, not a collaborator.",
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Field snippet" }],
    },
    {
      type: "codeBlock",
      content: [
        {
          type: "text",
          text: "if (goat.votes > heidi.votes) {\n  bringCheese()\n}",
        },
      ],
    },
    {
      type: "image",
      attrs: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Switzerland.svg/330px-Flag_of_Switzerland.svg.png",
        alt: "Flag of Switzerland",
        title: "Swiss flag",
        align: "left",
        width: 120,
      },
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "The cross has opinions about rectangles. Heidi has opinions about goats.",
        },
      ],
    },
    {
      type: "image",
      attrs: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Matterhorn_from_Domh%C3%BCtte_-_2.jpg/960px-Matterhorn_from_Domh%C3%BCtte_-_2.jpg",
        alt: "The Matterhorn above a blue sky",
        title: "Matterhorn",
        align: "center",
        width: 520,
      },
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "End of today's page. Tomorrow the mountain will pretend this was its idea.",
        },
      ],
    },
  ],
}

export const NotionLikeEditor = () => {
  const [match, setMatch] = React.useState<SlashMatch | null>(null)
  const [forcedOpen, setForcedOpen] = React.useState(false)
  const [filter, setFilter] = React.useState("")
  const [index, setIndex] = React.useState(0)
  const [coords, setCoords] = React.useState({ top: 0, left: 0 })
  const menuRef = React.useRef({
    open: false,
    index: 0,
    items: [] as SlashItem[],
    match: null as SlashMatch | null,
  })
  const menuElementRef = React.useRef<HTMLDivElement | null>(null)
  const filterRef = React.useRef<HTMLInputElement | null>(null)
  const filterFocused = React.useRef(false)
  const forcedRef = React.useRef(false)
  const editorRef = React.useRef<Editor | null>(null)
  const dragSourceRef = React.useRef<DragSource | null>(null)

  const filtered = React.useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return slashItems
    return slashItems.filter((item) => {
      const haystack = `${item.label} ${item.keywords}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [filter])

  const menuOpen = (Boolean(match) || forcedOpen) && filtered.length > 0

  const applyItem = React.useCallback((editor: Editor, item: SlashItem, range: SlashMatch | null) => {
    if (item.disabled || !item.run) return
    if (range) {
      editor.chain().focus().deleteRange({ from: range.from, to: range.to }).run()
    } else {
      editor.chain().focus().run()
    }
    item.run(editor)
    forcedRef.current = false
    setForcedOpen(false)
    setMatch(null)
    setFilter("")
  }, [])

  menuRef.current = {
    open: menuOpen,
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
        trailingNode: { node: "paragraph", notAfter: ["paragraph"] },
      }),
      TaskList.configure({
        HTMLAttributes: { class: "task-list-node" },
      }),
      TaskItem.configure({ nested: true }),
      Image.configure({
        allowedMimeTypes: ["image/*"],
        maxFileSize: 5 * 1024 * 1024,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder: "Type / for commands…",
        showOnlyCurrent: true,
        includeChildren: false,
      }),
    ],
    []
  )

  const editor = useEditor({
    extensions,
    content: seed,
    editorProps: {
      attributes: {
        class: "focus:outline-hidden py-4 pr-5 pl-16",
      },
      handleDrop: (view, event) => {
        const source = dragSourceRef.current
        dragSourceRef.current = null
        if (!source) return false

        const target = topLevelFromPoint(view, event.clientX, event.clientY)
        const sourceNode = view.state.doc.nodeAt(source.pos)
        if (!target || !sourceNode) return true

        const rect = target.dom.getBoundingClientRect()
        const placeAfter = event.clientY > rect.top + rect.height / 2
        let insertAt = placeAfter ? target.pos + target.size : target.pos
        if (insertAt >= source.pos && insertAt <= source.pos + sourceNode.nodeSize) return true

        const tr = view.state.tr
        if (insertAt < source.pos) {
          tr.insert(insertAt, sourceNode)
          const mapped = tr.mapping.map(source.pos)
          tr.delete(mapped, mapped + sourceNode.nodeSize)
        } else {
          tr.delete(source.pos, source.pos + sourceNode.nodeSize)
          insertAt = tr.mapping.map(insertAt)
          tr.insert(insertAt, sourceNode)
        }

        view.dispatch(tr)
        return true
      },
      handleKeyDown: (_view, event) => {
        const menu = menuRef.current
        const current = editorRef.current
        if (!menu.open || !current) return false

        if (event.key === "ArrowDown") {
          const next = stepIndex(menu.items, menu.index, 1)
          menuRef.current.index = next
          setIndex(next)
          return true
        }
        if (event.key === "ArrowUp") {
          const next = stepIndex(menu.items, menu.index, -1)
          menuRef.current.index = next
          setIndex(next)
          return true
        }
        if (event.key === "Enter") {
          const item = menu.items[menuRef.current.index]
          if (item && !item.disabled) applyItem(current, item, menu.match)
          return true
        }
        if (event.key === "Escape") {
          forcedRef.current = false
          setForcedOpen(false)
          setMatch(null)
          setFilter("")
          return true
        }
        return false
      },
    },
  })

  editorRef.current = editor

  const addBlockBelow = React.useCallback((pos: number) => {
    const current = editorRef.current
    if (!current || pos < 0) return
    const node = current.state.doc.nodeAt(pos)
    if (!node) return

    const insertAt = pos + node.nodeSize
    forcedRef.current = true
    current.chain().insertContentAt(insertAt, { type: "paragraph" }).setTextSelection(insertAt + 1).run()
    const position = current.view.coordsAtPos(insertAt + 1)
    setForcedOpen(true)
    setMatch(null)
    setFilter("")
    setIndex(firstEnabledIndex(slashItems))
    setCoords(menuCoordinates(position))
  }, [])

  React.useEffect(() => {
    if (!editor) return

    const update = () => {
      const next = slashMatch(editor)
      if (next) {
        forcedRef.current = false
        setForcedOpen(false)
        setMatch(next)
        if (!filterFocused.current) setFilter(next.query)
        const position = editor.view.coordsAtPos(next.from)
        setCoords(menuCoordinates(position))
        return
      }

      if (filterFocused.current || forcedRef.current) return
      setMatch(null)
    }

    editor.on("transaction", update)
    return () => {
      editor.off("transaction", update)
    }
  }, [editor])

  React.useEffect(() => {
    setIndex(firstEnabledIndex(filtered))
  }, [filter, filtered])

  React.useEffect(() => {
    if (forcedOpen) filterRef.current?.focus()
  }, [forcedOpen])

  React.useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (menuElementRef.current?.contains(target)) return
      if (target instanceof Element && target.closest("[data-notion-gutter], [data-move-menu]")) return

      const current = editorRef.current
      const range = menuRef.current.match
      forcedRef.current = false
      setForcedOpen(false)
      setFilter("")
      setMatch(null)
      if (current && range) {
        current.chain().focus().deleteRange({ from: range.from, to: range.to }).run()
      }
    }

    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [menuOpen])

  const onFilterChange = (value: string) => {
    const sanitized = value.replace(/\//g, "")
    setFilter(sanitized)
    const current = editorRef.current
    const range = menuRef.current.match
    if (!current || !range) return
    const query = sanitized.replace(/\s/g, "")
    current.view.dispatch(current.state.tr.insertText(query, range.from + 1, range.to))
  }

  const onFilterKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const menu = menuRef.current
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setIndex(stepIndex(menu.items, menu.index, 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setIndex(stepIndex(menu.items, menu.index, -1))
    } else if (event.key === "Enter") {
      event.preventDefault()
      const current = editorRef.current
      const item = menu.items[menu.index]
      if (current && item && !item.disabled) applyItem(current, item, menu.match)
    } else if (event.key === "Escape") {
      event.preventDefault()
      forcedRef.current = false
      setForcedOpen(false)
      setMatch(null)
      setFilter("")
    }
  }

  if (!editor) return null

  return (
    <MeasuredContainer
      as="div"
      name="editor"
      className="border-input relative flex min-h-56 w-full flex-col rounded-xl border shadow-xs"
    >
      <EditorContent editor={editor} className="notion-like-surface minimal-tiptap-editor relative" />
      <BlockGutter editor={editor} onAdd={addBlockBelow} dragSourceRef={dragSourceRef} />
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
      {menuOpen ? (
        <div
          ref={menuElementRef}
          role="listbox"
          aria-label="Slash commands"
          className="bg-popover text-popover-foreground fixed z-50 w-72 rounded-lg border p-2 shadow-lg"
          style={{ top: coords.top, left: coords.left }}
        >
          <label className="bg-muted mb-2 flex items-center gap-1 rounded-md px-2">
            <span className="text-muted-foreground text-sm" aria-hidden>
              /
            </span>
            <input
              ref={filterRef}
              value={filter}
              onChange={(event) => onFilterChange(event.target.value)}
              onKeyDown={onFilterKeyDown}
              onFocus={() => {
                filterFocused.current = true
              }}
              onBlur={() => {
                filterFocused.current = false
              }}
              placeholder="Filter..."
              aria-label="Filter commands"
              className="placeholder:text-muted-foreground w-full bg-transparent py-1.5 text-sm outline-none"
            />
          </label>
          <div className="max-h-80 overflow-auto">
            {groups.map((group) => {
              const items = filtered.filter((item) => item.group === group)
              if (items.length === 0) return null
              return (
                <div key={group} className="mb-1">
                  <div className="text-muted-foreground px-2 py-1 text-xs font-medium">{group}</div>
                  {items.map((item) => {
                    const itemIndex = filtered.indexOf(item)
                    const Icon = item.icon
                    const selected = itemIndex === index && !item.disabled
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        aria-disabled={item.disabled || undefined}
                        disabled={item.disabled}
                        title={item.disabled ? "Unavailable without a TipTap Cloud AI token" : undefined}
                        className={cn(
                          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm",
                          selected && "bg-accent",
                          item.disabled && "cursor-not-allowed opacity-50"
                        )}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          if (!item.disabled) applyItem(editor, item, match)
                        }}
                        onMouseEnter={() => {
                          if (!item.disabled) setIndex(itemIndex)
                        }}
                      >
                        <Icon className="text-muted-foreground size-4 shrink-0" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </MeasuredContainer>
  )
}
