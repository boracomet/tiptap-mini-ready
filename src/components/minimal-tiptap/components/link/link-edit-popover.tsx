import * as React from "react"
import type { Editor } from "@tiptap/react"
import type { VariantProps } from "class-variance-authority"
import type { toggleVariants } from "@/components/ui/toggle"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Link2Icon } from "@radix-ui/react-icons"
import { ToolbarButton } from "../toolbar-button"
import { LinkEditBlock } from "./link-edit-block"
import { setEditorLink } from "./set-editor-link"

interface LinkEditPopoverProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const LinkEditPopover = ({
  editor,
  size,
  variant,
  open: openProp,
  onOpenChange,
}: LinkEditPopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = openProp ?? uncontrolledOpen
  const onOpenChangeRef = React.useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next)
      onOpenChangeRef.current?.(next)
    },
    [openProp]
  )

  const { from, to } = editor.state.selection
  const text = editor.state.doc.textBetween(from, to, " ")

  const onSetLink = React.useCallback(
    (url: string, text?: string, openInNewTab?: boolean) => {
      const applied = setEditorLink(editor, url, text, openInNewTab)
      if (!applied) return
      setOpen(false)
      // The bubble menu transaction can remount this popover before the close commits.
      window.setTimeout(() => setOpen(false), 0)
    },
    [editor, setOpen]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton
          isActive={editor.isActive("link")}
          tooltip="Link"
          aria-label="Insert link"
          disabled={editor.isActive("codeBlock")}
          size={size}
          variant={variant}
        >
          <Link2Icon className="size-5" />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom">
        <LinkEditBlock onSave={onSetLink} defaultText={text} />
      </PopoverContent>
    </Popover>
  )
}

export { LinkEditPopover }
