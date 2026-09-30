![Tiptap Mini Ready](docs/readme-banner.jpg)

# Tiptap Mini Ready

A modern TipTap editor for React.

TipTap v3 · Customizable · Ready to use · React

Maintained by [Bora Ata Türkoğlu](https://github.com/boracomet). Styled with [shadcn/ui](https://ui.shadcn.com).

Live demo: [https://boracomet.github.io/tiptap-mini-ready/](https://boracomet.github.io/tiptap-mini-ready/)

The demo stacks Comment, Gallery, and Article. Under Templates, Notion-like is a local page: each block has a + and a drag handle, the handle opens Move up and Move down, and the slash menu filters text, headings, lists, todos, quotes, code, dividers, and images. It is not the official TipTap Notion-like template. Cloud collaboration stays off, and the AI commands are disabled. See [Notion-like template](#notion-like-template).

Repository: [https://github.com/boracomet/tiptap-mini-ready](https://github.com/boracomet/tiptap-mini-ready)

## Installation

From the component registry:

```bash
npx shadcn@latest add https://raw.githubusercontent.com/boracomet/tiptap-mini-ready/main/registry/block-registry.json
```

### Manual installation

Install the editor dependencies:

```bash
npm install lowlight react-medium-image-zoom @radix-ui/react-icons @tiptap/extension-bubble-menu @tiptap/extension-code-block-lowlight @tiptap/extension-color @tiptap/extension-horizontal-rule @tiptap/extension-image @tiptap/extension-list @tiptap/extension-table @tiptap/extension-text-style @tiptap/markdown @tiptap/extension-typography @tiptap/extensions @tiptap/pm @tiptap/react @tiptap/starter-kit
```

Wrap the app in `TooltipProvider`:

```tsx
import { TooltipProvider } from "@/components/ui/tooltip"

export const App = () => {
  return (
    <TooltipProvider>
      <YourComponent />
    </TooltipProvider>
  )
}
```

Shadcn components used by the editor: Button, Dropdown Menu, Input, Label, Popover, Separator, Switch, Toggle, Tooltip, Dialog, Toggle Group, and Sonner.

In this Vite app, `components.json` points Tailwind CSS at `src/global.css` (there is no separate `tailwind.config.ts`).

Reference your Tailwind entry from the editor stylesheet:

```css
@reference "path-to-your-entry-point-tailwind.css";
```

## Usage

```tsx
import { useState } from "react"
import { Content } from "@tiptap/react"
import { MinimalTiptapEditor } from "./minimal-tiptap"

export const App = () => {
  const [value, setValue] = useState<Content>("")

  return (
    <MinimalTiptapEditor
      value={value}
      onChange={setValue}
      className="w-full"
      editorContentClassName="p-5"
      output="html"
      placeholder="Enter your description..."
      autofocus={true}
      editable={true}
      editorClassName="focus:outline-hidden"
    />
  )
}
```

`value` is controlled. External updates, including a form reset, replace the document when the incoming value differs from the editor content. Keystrokes are not written back with `setContent` when the content already matches.

## Props

The editor accepts standard Tiptap editor props plus:

| Prop                     | Type                                     | Default | Description                                |
| ------------------------ | ---------------------------------------- | ------- | ------------------------------------------ |
| `value`                  | `Content`                                | -       | Controlled editor content                  |
| `onChange`               | function                                 | -       | Called when the document changes           |
| `editorContentClassName` | string                                   | -       | Class for the editor content container     |
| `output`                 | `'html' \| 'json' \| 'text' \| 'markdown'` | `'html'` | Output format passed to `onChange`      |
| `placeholder`            | string                                   | -       | Placeholder text                           |
| `editorClassName`        | string                                   | -       | Class for the editable surface             |
| `throttleDelay`          | number                                   | `0`     | Delay in milliseconds before `onChange`   |
| `uploader`               | `(file: File) => Promise<string>`        | -       | Replaces the demo image upload             |

## Images

Toolbar uploads, and drop or paste, insert a blob URL first. The image node then calls `uploadFn` and swaps in the returned URL. Dropped or pasted files do not stay inline as base64 when an uploader is configured.

```typescript
Image.configure({
  allowedMimeTypes: ["image/jpeg", "image/png", "image/gif"],
  maxFileSize: 5 * 1024 * 1024,
  uploadFn: async (file) => {
    return "https://example.com/uploaded-image.jpg"
  },
})
```

If `uploadFn` is omitted, the demo uploader returns a data URL after a short delay. Validation and action errors are reported through the `onValidationError` and `onActionError` callbacks.

## Toolbar

```tsx
<SectionOne editor={editor} activeLevels={[1, 2, 3, 4, 5, 6]} variant="outline" />

<SectionTwo
  editor={editor}
  activeActions={["bold", "italic", "strikethrough", "code", "clearFormatting"]}
  mainActionCount={2}
/>

<SectionFour editor={editor} activeActions={["orderedList", "bulletList"]} mainActionCount={0} />

<SectionFive editor={editor} activeActions={["codeBlock", "blockquote", "horizontalRule"]} mainActionCount={0} />
```

Active toolbar buttons use the toggle pressed state. Text colors follow the `dark` class set by `next-themes`, not only the operating system color scheme.

Links are saved through one path: the URL is sanitized, `target="_blank"` also sets `rel="noopener noreferrer"`, and saving does not insert a new paragraph.

## Development

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
```

Rebuild the shadcn registry after changing the editor component:

```bash
pnpm build-registry
```

Host it locally:

```bash
pnpm host-registry
npx shadcn@latest add http://127.0.0.1:8080/block-registry.json -o
```

## Notion-like template

The official [Notion-like editor](https://tiptap.dev/docs/ui-components/templates/notion-like-editor) is installed with the TipTap CLI:

```bash
npx @tiptap/cli@latest add notion-like-editor
```

That template is under the TipTap Pro license and needs at least a [Start plan](https://tiptap.dev/pricing) (a trial can be used while integrating it). This repository does not include that source. `npx @tiptap/cli@latest status` reports that this environment is not authenticated with the TipTap registry, and an unauthenticated request for the component is rejected. Do not commit invented collaboration or AI tokens.

Full parity with the docs demo adds live cursors, presence, and the AI menu. For this Vite app the client needs:

- `VITE_TIPTAP_COLLAB_DOC_PREFIX` — prefix for collaborative documents
- `VITE_TIPTAP_COLLAB_APP_ID` — document server id
- `VITE_TIPTAP_COLLAB_TOKEN` — JWT for Collaboration
- `VITE_TIPTAP_AI_TOKEN` — JWT for AI

Render the licensed component with a unique room, for example `<NotionEditor room="my-document-room" placeholder="Start writing..." />`. Example JWTs from a TipTap Cloud account expire quickly. Production should mint JWTs on a server. None of those values are stored in this repo.

Without them the demo stays local. Hover any block for the add and drag controls. Drag a block to reorder it, or open the handle menu and choose Move up or Move down. Those commands stop at the first and last block. The slash menu has a filter and the block types above. Continue Writing and Ask AI are visible and disabled until `VITE_TIPTAP_AI_TOKEN` is set. Dark and light follow the page theme switch. The open-source drag handle loads `@tiptap/extension-collaboration` and `yjs` as libraries only. This editor does not open a collaboration provider.

## Demo deployment

Pushes to `main` run `.github/workflows/deploy-demo.yml`, which builds this Vite app and publishes GitHub Pages. In the repository settings, set Pages to **GitHub Actions** once. The site is served from `/tiptap-mini-ready/`.

## Attribution

Tiptap Mini Ready is maintained by Bora Ata Türkoğlu. The editor is derived from the MIT-licensed minimal-tiptap component. The original copyright notice is kept in [LICENSE](LICENSE).

For a broader official editor, see the [Tiptap simple editor template](https://tiptap.dev/docs/ui-components/templates/simple-editor).
