import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-oswald uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow hover:shadow-glow",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Custom variants for the game
        hero: "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-glow hover:shadow-glow-secondary transform hover:scale-105 transition-all duration-300",
        play: "bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xl py-6 px-12 rounded-full shadow-glow glow-pulse hover:scale-105 transition-all duration-300",
        category: "bg-card/80 backdrop-blur-sm border border-border hover:border-primary hover:bg-card text-foreground hover:shadow-glow transition-all duration-300",
        answer: "bg-muted/50 backdrop-blur-sm border border-border hover:border-primary/50 hover:bg-muted text-foreground transition-all duration-200",
        answerSelected: "bg-primary text-primary-foreground border border-primary shadow-glow",
        answerCorrect: "bg-correct text-primary-foreground border border-correct",
        answerWrong: "bg-wrong text-primary-foreground border border-wrong",
        purchase: "bg-gradient-to-r from-level-gold to-secondary text-primary-foreground shadow-glow hover:scale-105 transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        full: "w-full h-14 rounded-xl text-lg",
        answer: "w-full min-h-16 p-4 text-left text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
