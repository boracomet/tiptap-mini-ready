import * as React from "react"
import type { Editor } from "@tiptap/react"
import type { Content, UseEditorOptions } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { useEditor } from "@tiptap/react"
import { Typography } from "@tiptap/extension-typography"
import { TextStyle } from "@tiptap/extension-text-style"
import { Placeholder, Selection } from "@tiptap/extensions"
import { Markdown } from "@tiptap/markdown"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TableKit } from "@tiptap/extension-table"
import {
  Image,
  HorizontalRule,
  CodeBlockLowlight,
  Color,
  UnsetAllMarks,
  ResetMarksOnEnter,
  FileHandler,
  MarkdownPaste,
} from "../extensions"
import { cn } from "@/lib/utils"
import {
  fileToBase64,
  getOutput,
  isSameContent,
  randomId,
  shouldSyncExternalValue,
} from "../utils"
import { useThrottle } from "../hooks/use-throttle"
import { toast } from "sonner"

export interface UseMinimalTiptapEditorProps extends UseEditorOptions {
  value?: Content
  output?: "html" | "json" | "text" | "markdown"
  placeholder?: string
  editorClassName?: string
  throttleDelay?: number
  onUpdate?: (content: Content) => void
  onBlur?: (content: Content) => void
  uploader?: (file: File) => Promise<string>
}

async function fakeuploader(file: File): Promise<string> {
  // NOTE: This is a fake upload function. Replace this with your own upload logic.
  // This function should return the uploaded image URL.

  // wait 3s to simulate upload
  await new Promise((resolve) => setTimeout(resolve, 3000))

  const src = await fileToBase64(file)

  return src
}

const toBlobImageContent = (file: File) => {
  const blobUrl = URL.createObjectURL(file)
  const id = randomId()

  return {
    type: "image" as const,
    attrs: {
      id,
      src: blobUrl,
      alt: file.name,
      title: file.name,
      fileName: file.name,
    },
  }
}

const createExtensions = ({
  placeholder,
  uploader,
  output = "html",
}: {
  placeholder: string
  uploader?: (file: File) => Promise<string>
  output: UseMinimalTiptapEditorProps["output"]
}) => [
  StarterKit.configure({
    blockquote: { HTMLAttributes: { class: "block-node" } },
    // bold
    bulletList: { HTMLAttributes: { class: "list-node" } },
    code: { HTMLAttributes: { class: "inline", spellcheck: "false" } },
    codeBlock: false,
    // document
    dropcursor: { width: 2, class: "ProseMirror-dropcursor border" },
    // gapcursor
    // hardBreak
    heading: { HTMLAttributes: { class: "heading-node" } },
    // undoRedo
    horizontalRule: false,
    // italic
    // listItem
    // listKeymap
    link: {
      enableClickSelection: true,
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      protocols: ["http", "https", "mailto", "tel", "sms", "fax"],
      HTMLAttributes: {
        class: "link",
      },
    },
    orderedList: { HTMLAttributes: { class: "list-node" } },
    paragraph: { HTMLAttributes: { class: "text-node" } },
    // strike
    // text
    // underline
    // trailingNode
  }),
  
  Image.configure({
    allowedMimeTypes: ["image/*"],
    maxFileSize: 5 * 1024 * 1024,
    allowBase64: true,
    uploadFn: async (file) => {
      return uploader ? await uploader(file) : await fakeuploader(file)
    },
    onToggle(editor, files, pos) {
      editor.commands.insertContentAt(pos, files.map(toBlobImageContent))
    },
    onImageRemoved({ id, src }) {
      console.log("Image removed", { id, src })
    },
    onValidationError(errors) {
      errors.forEach((error) => {
        toast.error("Image validation error", {
          position: "bottom-right",
          description: error.reason,
        })
      })
    },
    onActionSuccess({ action }) {
      const mapping = {
        copyImage: "Copy Image",
        copyLink: "Copy Link",
        download: "Download",
      }
      toast.success(mapping[action], {
        position: "bottom-right",
        description: "Image action success",
      })
    },
    onActionError(error, { action }) {
      const mapping = {
        copyImage: "Copy Image",
        copyLink: "Copy Link",
        download: "Download",
      }
      toast.error(`Failed to ${mapping[action]}`, {
        position: "bottom-right",
        description: error.message,
      })
    },
  }),
  FileHandler.configure({
    allowBase64: true,
    allowedMimeTypes: ["image/*"],
    maxFileSize: 5 * 1024 * 1024,
    onDrop: (editor, files, pos) => {
      editor.commands.insertContentAt(pos, files.map(toBlobImageContent))
    },
    onPaste: (editor, files) => {
      editor.commands.insertContent(files.map(toBlobImageContent))
    },
    onValidationError: (errors) => {
      errors.forEach((error) => {
        toast.error("Image validation error", {
          position: "bottom-right",
          description: error.reason,
        })
      })
    },
  }),
  Color,
  TextStyle,
  Selection,
  Typography,
  UnsetAllMarks,
  HorizontalRule,
  ResetMarksOnEnter,
  CodeBlockLowlight,
  Placeholder.configure({ placeholder: () => placeholder }),
  // Add MarkdownPaste extension when output is markdown
  ...(output === "markdown" ? [
    // Markdown with GFM support for tables, task lists, etc.
    Markdown.configure({
      markedOptions: {
        gfm: true,
      },
    }),
    // Task lists (checkboxes)
    TaskList.configure({
      HTMLAttributes: { class: "task-list-node" },
    }),
    TaskItem.configure({
      nested: true,
    }),
    // Tables
    TableKit.configure({
      table: {
        resizable: true,
        HTMLAttributes: { class: "table-node" },
      },
    }),
    MarkdownPaste
  ] : []),
]

export const useMinimalTiptapEditor = ({
  value,
  output = "html",
  placeholder = "",
  editorClassName,
  throttleDelay = 0,
  onUpdate,
  onBlur,
  uploader,
  ...props
}: UseMinimalTiptapEditorProps) => {
  const lastEmittedRef = React.useRef<Content | undefined>(undefined)
  const emitGenerationRef = React.useRef(0)
  const contentType = output === "markdown" ? "markdown" : undefined

  const flushUpdate = React.useCallback(
    (content: Content, generation: number) => {
      if (generation !== emitGenerationRef.current) return
      lastEmittedRef.current = content
      onUpdate?.(content)
    },
    [onUpdate]
  )

  const throttledSetValue = useThrottle(flushUpdate, throttleDelay)

  const handleUpdate = React.useCallback(
    (editor: Editor) => {
      throttledSetValue(getOutput(editor, output), emitGenerationRef.current)
    },
    [output, throttledSetValue]
  )

  const handleCreate = React.useCallback(
    (editor: Editor) => {
      if (value === undefined || !editor.isEmpty) return
      if (typeof value === "string" && value.length === 0) return

      editor.commands.setContent(value, {
        emitUpdate: false,
        contentType,
      })
      lastEmittedRef.current = value
    },
    [contentType, value]
  )

  const handleBlur = React.useCallback(
    (editor: Editor) => onBlur?.(getOutput(editor, output)),
    [output, onBlur]
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createExtensions({ placeholder, uploader, output }),
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        class: cn("focus:outline-hidden", editorClassName),
      },
    },
    onUpdate: ({ editor }) => handleUpdate(editor),
    onCreate: ({ editor }) => handleCreate(editor),
    onBlur: ({ editor }) => handleBlur(editor),
    ...props,
  })

  React.useEffect(() => {
    if (!editor || editor.isDestroyed || value === undefined) return

    const current = getOutput(editor, output)
    if (!shouldSyncExternalValue(current, value, lastEmittedRef.current)) {
      if (value !== undefined && isSameContent(current, value)) {
        lastEmittedRef.current = value
      }
      return
    }

    emitGenerationRef.current += 1
    editor.commands.setContent(value, {
      emitUpdate: false,
      contentType,
    })
    lastEmittedRef.current = value
  }, [contentType, editor, output, value])

  return editor
}

export default useMinimalTiptapEditor
