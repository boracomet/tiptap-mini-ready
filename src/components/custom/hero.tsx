import { Button } from "@/components/ui/button"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { useTheme } from "next-themes"
import { DialogFormExample } from "./dialog-form-example"

export function Hero() {
  const { setTheme: setMode, resolvedTheme: mode } = useTheme()

  return (
    <div className="text-center">
      <h1 className="mb-4 text-5xl font-extrabold tracking-tight">
        Tiptap Mini Ready
      </h1>
      <p className="mb-6 text-xl">
        A crisp Tiptap editor, ready to drop in and easy to extend.
      </p>
      <div className="flex flex-col justify-center space-y-4 gap-x-2 sm:flex-row sm:space-y-0">
        <Button
          className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200"
          onClick={() => setMode(mode === "dark" ? "light" : "dark")}
        >
          {mode === "dark" ? "Light" : "Dark"} Mode
        </Button>
        <DialogFormExample />
        <a
          href="https://github.com/boracomet/tiptap-mini-ready"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline">
            <GitHubLogoIcon className="mr-2 size-5" />
            GitHub
          </Button>
        </a>
      </div>
    </div>
  )
}
