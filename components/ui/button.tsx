import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 cursor-pointer focus-visible:outline-none",
  {
    variants: {
      variant: {
        default: "bg-[#131921] text-white hover:bg-[#232f3e] rounded-md",
        cta: "ap-cta-yellow text-[#0f1111] rounded-full",
        primary: "ap-cta-orange text-[#131921] font-bold rounded-full",
        ghost: "bg-transparent text-[#0f1111] hover:bg-[#f3f4f4] rounded-md",
        link: "bg-transparent text-[#007185] hover:text-[#c45500] hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-9 px-4",
        lg: "h-11 px-5 text-[15px]",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
