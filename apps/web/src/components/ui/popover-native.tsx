import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

// Native popover API wrapper — light-dismiss without JS event wiring.
// Use for non-modal overlays: tooltips, inline menus, status panels.
// For complex modals (focus trap, nested forms) keep using shadcn Dialog.
//
// Browser support: Chrome 114+, Firefox 125+, Safari 17+.
// Progressive enhancement: falls back to a static block on older engines.
//
// Usage:
//   <PopoverNative
//     trigger={(id) => <button popovertarget={id}>Open</button>}
//   >
//     <p>Popover content</p>
//   </PopoverNative>

export interface PopoverNativeTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  popovertarget?: string;
  popovertargetaction?: "toggle" | "show" | "hide";
}

export interface PopoverNativeContentProps extends HTMLAttributes<HTMLDivElement> {
  popover?: "auto" | "manual";
}

interface PopoverNativeProps {
  trigger: (id: string) => ReactNode;
  children: ReactNode;
  className?: string;
  popoverType?: "auto" | "manual";
}

export function PopoverNative({
  trigger,
  children,
  className,
  popoverType = "auto",
}: PopoverNativeProps) {
  const id = useId();
  return (
    <>
      {trigger(id)}
      <div
        id={id}
        // React 19 passes unknown HTML attributes through — `popover` is a valid HTML attribute
        {...({ popover: popoverType } as Record<string, string>)}
        className={cn(
          "m-0 border border-rule bg-paper text-ink shadow-md [&:popover-open]:block",
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}
