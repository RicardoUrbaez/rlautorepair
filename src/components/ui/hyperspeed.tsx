import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  px: number;
  py: number;
}

export const Hyperspeed = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const stars: Star[] = [];
    const numStars = 500;
    const speed = 2;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize stars with better distribution
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * canvas.width,
        px: 0,
        py: 0,
      });
    }

    const animate = () => {
      // More transparent background for longer trails
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      stars.forEach((star) => {
        star.z -= speed;

        // Reset star when it passes the camera
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * canvas.width * 2;
          star.y = (Math.random() - 0.5) * canvas.height * 2;
          star.z = canvas.width;
          star.px = 0;
          star.py = 0;
        }

        // Project 3D to 2D
        const k = 200 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        // Only draw if within bounds
        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
          // Draw star trail
          if (star.px !== 0) {
            const lineWidth = Math.max((1 - star.z / canvas.width) * 3, 0.5);
            const opacity = Math.max(1 - star.z / canvas.width, 0.3);
            
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = `rgba(147, 197, 253, ${opacity})`; // Blue-ish white
            ctx.beginPath();
            ctx.moveTo(star.px, star.py);
            ctx.lineTo(px, py);
            ctx.stroke();

            // Add a glow dot at the front
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.arc(px, py, lineWidth / 2, 0, Math.PI * 2);
            ctx.fill();
          }

          star.px = px;
          star.py = py;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10"
    />
  );
};
