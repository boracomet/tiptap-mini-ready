import { BentoCard, BentoGrid } from "@/components/custom/bento-grid"
import { MinimalTiptapEditor } from "../minimal-tiptap"
import { cn } from "@/lib/utils"
import { MinimalTiptapOne } from "./minimal-tiptap-one"
import { MinimalTiptapThree } from "./minimal-tiptap-three"
import { NotionLikeEditor } from "./notion-like-editor"
import Content from "../../data/content.json"
import Gallery from "../../data/gallery.json"

const commentSeed =
  "<p>The Swiss air is complimentary. Heidi would still like a reply before the goats take the thread.</p>"

const features = [
  {
    name: "Comment",
    description: "Add a comment",
    background: (
      <MinimalTiptapOne
        value={commentSeed}
        throttleDelay={1000}
        className={cn("h-auto min-h-40 w-full min-w-0 rounded-xl")}
        editorContentClassName="overflow-auto"
        output="html"
        placeholder="Write a comment…"
        editable={true}
        editorClassName="focus:outline-hidden px-5 py-4"
      />
    ),
  },
  {
    name: "Gallery",
    description: "Captions for a Heidi trip through the Alps.",
    background: (
      <MinimalTiptapEditor
        value={Gallery}
        throttleDelay={2000}
        className={cn("h-auto min-h-56 w-full min-w-0 rounded-xl")}
        editorContentClassName="overflow-auto"
        output="html"
        placeholder="Add a caption…"
        editable={true}
        editorClassName="focus:outline-hidden px-5 py-4"
      />
    ),
  },
  {
    name: "Article",
    description: "The full editor, still negotiating with the Alps.",
    background: (
      <MinimalTiptapThree
        value={Content}
        throttleDelay={3000}
        className={cn("h-auto min-h-56 w-full min-w-0 rounded-xl")}
        editorContentClassName="overflow-auto"
        output="json"
        placeholder="This is your placeholder..."
        editable={true}
        editorClassName="focus:outline-hidden px-5 py-4"
      />
    ),
  },
]

export function BentoMinimalTiptap() {
  return (
    <BentoGrid>
      {features.map((feature) => (
        <BentoCard key={feature.name} {...feature} />
      ))}
      <div className="col-span-full flex items-center gap-4 pt-2">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Templates
        </h2>
        <div className="bg-border h-px flex-1" />
      </div>
      <BentoCard
        name="Notion-like"
        description="Local demo (no TipTap Cloud AI or collaboration). Hover a block for + and the drag handle. AI slash commands stay off."
        background={<NotionLikeEditor />}
      />
    </BentoGrid>
  )
}
