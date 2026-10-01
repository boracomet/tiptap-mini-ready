import "@/components/minimal-tiptap/styles/index.css"

import type { Content, Editor } from "@tiptap/react"
import type { UseMinimalTiptapEditorProps } from "@/components/minimal-tiptap/hooks/use-minimal-tiptap"
import { EditorContent } from "@tiptap/react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { SectionOne } from "@/components/minimal-tiptap/components/section/one"
import { SectionTwo } from "@/components/minimal-tiptap/components/section/two"
import { SectionThree } from "@/components/minimal-tiptap/components/section/three"
import { SectionFour } from "@/components/minimal-tiptap/components/section/four"
import { SectionFive } from "@/components/minimal-tiptap/components/section/five"
import { LinkBubbleMenu } from "@/components/minimal-tiptap/components/bubble-menu/link-bubble-menu"
import { useMinimalTiptapEditor } from "@/components/minimal-tiptap/hooks/use-minimal-tiptap"
import { MeasuredContainer } from "../minimal-tiptap/components/measured-container"

export interface MinimalTiptapProps
  extends Omit<UseMinimalTiptapEditorProps, "onUpdate"> {
  value?: Content
  onChange?: (value: Content) => void
  className?: string
  editorContentClassName?: string
}

const Toolbar = ({ editor }: { editor: Editor }) => (
  <div className="border-border bg-background flex h-12 min-w-0 w-full shrink-0 touch-pan-x overflow-x-auto overscroll-x-contain border-b p-2 dark:border-input">
    <div className="flex w-max items-center gap-0.5">
      <SectionOne editor={editor} activeLevels={[1, 2, 3]} />

      <Separator orientation="vertical" className="mx-2 dark:bg-input" />

      <SectionTwo
        editor={editor}
        activeActions={[
          "italic",
          "bold",
          "underline",
          "code",
          "strikethrough",
          "clearFormatting",
        ]}
        mainActionCount={5}
      />

      <Separator orientation="vertical" className="mx-2 dark:bg-input" />

      <SectionThree editor={editor} />

      <Separator orientation="vertical" className="mx-2 dark:bg-input" />

      <SectionFour
        editor={editor}
        activeActions={["bulletList", "orderedList"]}
        mainActionCount={2}
      />

      <Separator orientation="vertical" className="mx-2 dark:bg-input" />

      <SectionFive
        editor={editor}
        activeActions={["blockquote", "codeBlock", "horizontalRule"]}
        mainActionCount={3}
      />
    </div>
  </div>
)

export const MinimalTiptapThree = ({
  value,
  onChange,
  className,
  editorContentClassName,
  ...props
}: MinimalTiptapProps) => {
  const editor = useMinimalTiptapEditor({
    value,
    onUpdate: onChange,
    ...props,
  })

  if (!editor) {
    return null
  }

  return (
    <MeasuredContainer
      as="div"
      name="editor"
      className={cn(
        "border-input bg-background min-data-[orientation=vertical]:h-72 flex h-auto w-full flex-col rounded-md border shadow-xs",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        className
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className={cn("minimal-tiptap-editor", editorContentClassName)}
      />
      <LinkBubbleMenu editor={editor} />
    </MeasuredContainer>
  )
}

MinimalTiptapThree.displayName = "MinimalTiptapThree"

export default MinimalTiptapThree
