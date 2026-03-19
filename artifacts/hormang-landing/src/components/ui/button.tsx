import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "glass"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground shadow-[0_8px_16px_-4px_hsl(var(--primary)/0.4)] hover:shadow-[0_12px_24px_-4px_hsl(var(--primary)/0.5)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm": variant === "default",
            "bg-secondary text-secondary-foreground shadow-[0_8px_16px_-4px_hsl(var(--secondary)/0.4)] hover:shadow-[0_12px_24px_-4px_hsl(var(--secondary)/0.5)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm": variant === "secondary",
            "border-2 border-border bg-background hover:border-primary hover:text-primary hover:-translate-y-0.5 hover:shadow-md active:translate-y-0": variant === "outline",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0": variant === "glass",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            "h-11 px-6 py-2": size === "default",
            "h-9 rounded-lg px-4": size === "sm",
            "h-14 rounded-2xl px-10 text-base": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
