import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  "primary" | "secondary" | "tertiary" | "destructive";
const variantClasses: Record<ButtonVariant, string> = {
  primary: "primary-button",
  secondary: "secondary-button",
  tertiary: "quiet-button",
  destructive: "danger-button",
};

/** Native semantics, fieldset disabling and caller-owned action state are retained. */
export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      type={type}
      className={[variantClasses[variant], className].filter(Boolean).join(" ")}
    />
  );
}
