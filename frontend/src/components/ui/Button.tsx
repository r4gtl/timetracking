import type { ButtonHTMLAttributes } from "react";
import "./Button.css";

type ButtonVariant = "primary" | "accent" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  small?: boolean;
}

export function Button({
  variant = "primary",
  small,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = ["btn", `btn--${variant}`, small ? "btn--small" : "", className]
    .filter(Boolean)
    .join(" ");
  return <button type={type} className={classes} {...props} />;
}
