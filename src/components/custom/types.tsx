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
    description:
      "Write below, then format from the bar under the text. Select a phrase and open the link bubble.",
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
    description:
      "Captions for a Heidi trip through the Alps. On a narrow screen, swipe the toolbar sideways; try image align.",
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
    description:
      "The Heidi article scrolls inside this card. Use the top toolbar for headings, lists, and more.",
    background: (
      <MinimalTiptapThree
        value={Content}
        throttleDelay={3000}
        className={cn(
          "h-[min(42rem,70vh)] max-h-[70vh] min-h-0 w-full min-w-0 overflow-hidden rounded-xl"
        )}
        editorContentClassName="min-h-0 flex-1 overflow-auto"
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
        description="Local demo (no TipTap Cloud). Hover a block for + and drag, or Move up / Move down. Type / for the slash menu; select text for the bubble link. AI stays off."
        background={<NotionLikeEditor />}
      />
    </BentoGrid>
  )
}
