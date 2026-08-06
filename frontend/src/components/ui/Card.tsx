import type { ReactNode } from "react";
import "./Card.css";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <div className={className ? `ui-card ${className}` : "ui-card"}>{children}</div>;
}
