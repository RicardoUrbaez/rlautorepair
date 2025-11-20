import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PrismaticBurstProps {
  className?: string;
  particleCount?: number;
  colors?: string[];
  duration?: number;
  size?: number;
}

export const PrismaticBurst = ({
  className,
  particleCount = 20,
  colors = [
    "rgb(255, 0, 128)",
    "rgb(0, 255, 255)",
    "rgb(255, 255, 0)",
    "rgb(128, 0, 255)",
    "rgb(255, 128, 0)",
    "rgb(0, 255, 128)",
  ],
  duration = 1000,
  size = 8,
}: PrismaticBurstProps) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    angle: number;
    color: string;
    delay: number;
  }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      angle: (360 / particleCount) * i,
      color: colors[i % colors.length],
      delay: Math.random() * 200,
    }));
    setParticles(newParticles);
  }, [particleCount, colors]);

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-burst"
          style={
            {
              "--burst-angle": `${particle.angle}deg`,
              "--burst-color": particle.color,
              "--burst-duration": `${duration}ms`,
              "--burst-delay": `${particle.delay}ms`,
              "--burst-size": `${size}px`,
              animationDelay: `${particle.delay}ms`,
            } as React.CSSProperties
          }
        >
          <div
            className="rounded-full"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${size * 2}px ${particle.color}`,
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes burst {
          0% {
            transform: translate(-50%, -50%) rotate(var(--burst-angle)) translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--burst-angle)) translateY(-150px) scale(0);
            opacity: 0;
          }
        }
        
        .animate-burst {
          animation: burst var(--burst-duration) ease-out forwards;
        }
      `}</style>
    </div>
  );
};

interface PrismaticBurstTriggerProps {
  children: React.ReactNode;
  className?: string;
  particleCount?: number;
  colors?: string[];
  duration?: number;
  size?: number;
}

export const PrismaticBurstTrigger = ({
  children,
  className,
  particleCount = 20,
  colors,
  duration = 1000,
  size = 8,
}: PrismaticBurstTriggerProps) => {
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const burstId = Date.now();
    setBursts((prev) => [...prev, { id: burstId, x, y }]);

    setTimeout(() => {
      setBursts((prev) => prev.filter((burst) => burst.id !== burstId));
    }, duration + 500);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative cursor-pointer", className)}
      onClick={handleClick}
    >
      {children}
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="absolute pointer-events-none z-[9999]"
          style={{
            left: `${burst.x}px`,
            top: `${burst.y}px`,
            width: "300px",
            height: "300px",
            transform: "translate(-50%, -50%)",
          }}
        >
          <PrismaticBurst
            particleCount={particleCount}
            colors={colors}
            duration={duration}
            size={size}
          />
        </div>
      ))}
    </div>
  );
};
