import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-2xl border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground font-sans transition-all shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-[#111726] text-slate-100 border-slate-800 [&>svg]:text-orange-400",
        destructive:
          "bg-rose-500/10 text-rose-300 border-rose-500/30 [&>svg]:text-rose-400",
        warning:
          "bg-amber-500/10 text-amber-300 border-amber-500/30 [&>svg]:text-amber-400",
        success:
          "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 [&>svg]:text-emerald-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-display font-extrabold text-sm leading-tight tracking-tight mb-1 text-white", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs font-medium leading-relaxed opacity-90", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
