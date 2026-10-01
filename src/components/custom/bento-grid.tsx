import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-auto grid-cols-1 gap-12",
        className
      )}
    >
      {children}
    </div>
  )
}

const BentoCard = ({
  name,
  description,
  className,
  background,
  optional = false,
}: {
  name: string
  description?: string
  className?: string
  background: ReactNode
  optional?: boolean
}) => (
  <section className={cn("col-span-full flex flex-col gap-3", className)}>
    <div className="space-y-1">
      <h2
        className={cn(
          "text-xl font-semibold tracking-tight",
          optional && "text-muted-foreground text-base font-medium"
        )}
      >
        {name}
      </h2>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
    </div>
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl",
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        "transform-gpu dark:bg-card dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:border dark:border-border"
      )}
    >
      {background}
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300" />
    </div>
  </section>
)

export { BentoCard, BentoGrid }
