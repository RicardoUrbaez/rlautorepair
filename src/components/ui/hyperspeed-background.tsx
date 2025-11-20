import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export const HyperspeedBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5, // strength
      0.4, // radius
      0.85 // threshold
    );
    composer.addPass(bloomPass);

    // Create star field
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    const velocities = new Float32Array(starCount);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;
      velocities[i] = Math.random() * 0.5 + 0.5;
      sizes[i] = Math.random() * 2 + 1;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.1,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Create warp lines
    const lineCount = 100;
    const lines: THREE.Line[] = [];

    for (let i = 0; i < lineCount; i++) {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
      });

      const points = [];
      const startX = (Math.random() - 0.5) * 50;
      const startY = (Math.random() - 0.5) * 50;
      const startZ = Math.random() * -50;

      points.push(new THREE.Vector3(startX, startY, startZ));
      points.push(new THREE.Vector3(startX, startY, startZ - 10));

      geometry.setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      lines.push(line);
      scene.add(line);
    }

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Move stars
      const positions = starsGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        positions[i3 + 2] += velocities[i] * 0.3;
        
        if (positions[i3 + 2] > 50) {
          positions[i3 + 2] = -50;
        }
      }
      starsGeometry.attributes.position.needsUpdate = true;

      // Move lines
      lines.forEach((line) => {
        line.position.z += 0.5;
        if (line.position.z > 50) {
          line.position.z = -50;
          line.position.x = (Math.random() - 0.5) * 50;
          line.position.y = (Math.random() - 0.5) * 50;
        }
      });

      composer.render();
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      lines.forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10"
      style={{ background: 'transparent' }}
    />
  );
};
