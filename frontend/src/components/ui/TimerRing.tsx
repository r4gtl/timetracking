import "./TimerRing.css";

interface TimerRingProps {
  /** 0-1: how much of the ring is filled (e.g. sweep of the current minute, or billable share). */
  progress: number;
  size?: number;
  active: boolean;
}

export function TimerRing({ progress, size = 48, active }: TimerRingProps) {
  const strokeWidth = Math.max(3, Math.round(size / 9));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const dashOffset = circumference * (1 - clamped);

  return (
    <svg
      className="timer-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={active ? "Timer in corso" : "Timer fermo"}
    >
      <circle
        className="timer-ring__track"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        className={active ? "timer-ring__arc timer-ring__arc--active" : "timer-ring__arc"}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </svg>
  );
}
