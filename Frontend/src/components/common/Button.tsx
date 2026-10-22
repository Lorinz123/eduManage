
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { LoaderCircle } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "ghost"
  | "success"
  | "navy";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

interface BaseButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

type IconButtonProps = BaseButtonProps & {
  size: "icon";
  "aria-label": string;
};

export type ButtonProps =
  | (BaseButtonProps & {
      size?: Exclude<ButtonSize, "icon">;
    })
  | IconButtonProps;

const baseStyles =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl " +
  "font-semibold border " +
  "transition-[background-color,border-color,color,box-shadow,transform] " +
  "duration-200 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 " +
  "active:scale-[0.98] " +
  "motion-reduce:transform-none motion-reduce:transition-none";

const variantStyles: Record<ButtonVariant, string> = {
  // Main actions: solid blue by default
  primary:
    "border-blue-600 bg-blue-600 text-white shadow-sm " +
    "hover:border-blue-700 hover:bg-blue-700 hover:shadow-md " +
    "active:border-blue-800 active:bg-blue-800 " +
    "focus-visible:ring-blue-500",

  // Secondary actions: solid neutral background
  secondary:
    "border-slate-200 bg-slate-100 text-slate-800 shadow-sm " +
    "hover:border-slate-300 hover:bg-slate-200 " +
    "active:bg-slate-300 " +
    "focus-visible:ring-slate-400",

  // Outline actions: visible border and background
  outline:
    "border-slate-300 bg-white text-slate-700 shadow-sm " +
    "hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 " +
    "active:border-blue-500 active:bg-blue-100 " +
    "focus-visible:ring-blue-500",

  // Destructive actions: solid red immediately
  danger:
    "border-red-600 bg-red-600 text-white shadow-sm " +
    "hover:border-red-700 hover:bg-red-700 hover:shadow-md " +
    "active:border-red-800 active:bg-red-800 " +
    "focus-visible:ring-red-500",

  // Low-emphasis actions
  ghost:
    "border-transparent bg-slate-100 text-slate-700 " +
    "hover:border-slate-200 hover:bg-slate-200 hover:text-slate-900 " +
    "active:bg-slate-300 " +
    "focus-visible:ring-slate-400",

  // Positive actions: solid green immediately
  success:
    "border-emerald-600 bg-emerald-600 text-white shadow-sm " +
    "hover:border-emerald-700 hover:bg-emerald-700 hover:shadow-md " +
    "active:border-emerald-800 active:bg-emerald-800 " +
    "focus-visible:ring-emerald-500",

  // Alternative primary actions: solid navy immediately
  navy:
    "border-[#142B49] bg-[#142B49] text-white shadow-sm " +
    "hover:border-[#1B3A60] hover:bg-[#1B3A60] hover:shadow-md " +
    "active:border-[#0F223B] active:bg-[#0F223B] " +
    "focus-visible:ring-[#315780]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-9 rounded-lg px-3 py-2 text-xs",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-5 py-3 text-sm",
  icon: "size-10 p-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      children,
      className = "",
      type = "button",
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;
    const isIconOnly = size === "icon";

    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={[
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {loading ? (
          <LoaderCircle
            size={17}
            aria-hidden="true"
            className="shrink-0 animate-spin motion-reduce:animate-none"
          />
        ) : leftIcon ? (
          <span
            aria-hidden="true"
            className="inline-flex shrink-0 items-center justify-center"
          >
            {leftIcon}
          </span>
        ) : null}

        {children != null &&
          children !== false &&
          children !== "" && (
            <span
              className={
                isIconOnly
                  ? "sr-only"
                  : "inline-flex items-center"
              }
            >
              {children}
            </span>
          )}

        {!loading && rightIcon && (
          <span
            aria-hidden="true"
            className="inline-flex shrink-0 items-center justify-center"
          >
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
