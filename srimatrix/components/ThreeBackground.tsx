"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Remove any leftover canvas elements
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // 1. Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 48);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 2. Dynamic Studio Lighting for 3D Shading & Specular Highlights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const primaryLight = new THREE.DirectionalLight(0x6366f1, 2.2); // Vibrant Indigo
    primaryLight.position.set(35, 40, 45);
    scene.add(primaryLight);

    const tealLight = new THREE.DirectionalLight(0x06b6d4, 1.8); // Cyan / Teal
    tealLight.position.set(-35, -25, 30);
    scene.add(tealLight);

    const softPinkLight = new THREE.DirectionalLight(0xf472b6, 1.2); // Rose/Violet accent
    softPinkLight.position.set(0, 35, -20);
    scene.add(softPinkLight);

    // 3. Ethereal Undulating Particle Wave Surface
    // Creates a flowing, living topological mesh of glowing dots in the background
    const waveCols = 55;
    const waveRows = 38;
    const numWaveParticles = waveCols * waveRows;
    const wavePositions = new Float32Array(numWaveParticles * 3);
    const waveColors = new Float32Array(numWaveParticles * 3);

    const colorTeal = new THREE.Color("#06b6d4");
    const colorIndigo = new THREE.Color("#6366f1");
    const colorViolet = new THREE.Color("#a855f7");
    const colorWhite = new THREE.Color("#e0e7ff");

    let idx = 0;
    const waveWidth = 90;
    const waveHeight = 65;

    for (let i = 0; i < waveCols; i++) {
      for (let j = 0; j < waveRows; j++) {
        const u = i / (waveCols - 1);
        const v = j / (waveRows - 1);
        const x = (u - 0.5) * waveWidth;
        const y = (v - 0.5) * waveHeight - 4;
        const z = -12;

        wavePositions[idx * 3] = x;
        wavePositions[idx * 3 + 1] = y;
        wavePositions[idx * 3 + 2] = z;

        // Gradient coloring across the wave surface
        const mixColor = colorTeal.clone().lerp(colorIndigo, u).lerp(colorViolet, v);
        waveColors[idx * 3] = mixColor.r;
        waveColors[idx * 3 + 1] = mixColor.g;
        waveColors[idx * 3 + 2] = mixColor.b;

        idx++;
      }
    }

    const waveGeometry = new THREE.BufferGeometry();
    waveGeometry.setAttribute("position", new THREE.BufferAttribute(wavePositions, 3));
    waveGeometry.setAttribute("color", new THREE.BufferAttribute(waveColors, 3));

    // Custom circular soft particle texture
    const createCircleTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.3, "rgba(224, 231, 255, 0.8)");
        gradient.addColorStop(0.7, "rgba(99, 102, 241, 0.3)");
        gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const particleTexture = createCircleTexture();

    const waveMaterial = new THREE.PointsMaterial({
      size: 1.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      map: particleTexture,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const wavePoints = new THREE.Points(waveGeometry, waveMaterial);
    scene.add(wavePoints);

    // 4. Floating 3D Prisms & Glass Crystals (Icosahedrons & Torus Knots)
    const crystalGroup = new THREE.Group();
    scene.add(crystalGroup);

    const crystalColors = [
      "#6366f1", // Indigo
      "#06b6d4", // Cyan
      "#8b5cf6", // Purple
      "#38bdf8", // Sky
      "#ec4899", // Rose
      "#14b8a6", // Teal
    ];

    const crystalMaterials = crystalColors.map(
      (hex) =>
        new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(hex),
          roughness: 0.15,
          metalness: 0.1,
          transmission: 0.45,
          thickness: 1.5,
          transparent: true,
          opacity: 0.42,
          side: THREE.DoubleSide,
        })
    );

    interface FloatingCrystal {
      mesh: THREE.Mesh;
      baseX: number;
      baseY: number;
      baseZ: number;
      rotSpeedX: number;
      rotSpeedY: number;
      rotSpeedZ: number;
      floatSpeed: number;
      floatRange: number;
      timeOffset: number;
    }

    const floatingCrystals: FloatingCrystal[] = [];
    const numCrystals = 28; // Sleek, clean and uncluttered

    for (let i = 0; i < numCrystals; i++) {
      // Alternate between multifaceted Icosahedrons, Octahedrons, and delicate Torus knots
      let geom: THREE.BufferGeometry;
      const type = i % 4;
      const scale = Math.random() * 1.8 + 1.2;

      if (type === 0) {
        geom = new THREE.IcosahedronGeometry(scale, 0);
      } else if (type === 1) {
        geom = new THREE.OctahedronGeometry(scale * 1.1, 0);
      } else if (type === 2) {
        geom = new THREE.TorusGeometry(scale * 0.9, scale * 0.3, 16, 32);
      } else {
        geom = new THREE.DodecahedronGeometry(scale * 0.95, 0);
      }

      const mat = crystalMaterials[i % crystalMaterials.length];
      const mesh = new THREE.Mesh(geom, mat);

      // Flank positions to keep the center clean and readable for the login form
      const isLeft = Math.random() < 0.5;
      const baseX = isLeft
        ? -18 - Math.random() * 24
        : 18 + Math.random() * 24;
      const baseY = (Math.random() - 0.5) * 36;
      const baseZ = (Math.random() - 0.5) * 20 - 5;

      mesh.position.set(baseX, baseY, baseZ);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      crystalGroup.add(mesh);

      floatingCrystals.push({
        mesh,
        baseX,
        baseY,
        baseZ,
        rotSpeedX: (Math.random() - 0.5) * 0.015,
        rotSpeedY: (Math.random() - 0.5) * 0.015,
        rotSpeedZ: (Math.random() - 0.5) * 0.01,
        floatSpeed: Math.random() * 0.6 + 0.3,
        floatRange: Math.random() * 2.2 + 1.2,
        timeOffset: Math.random() * Math.PI * 2,
      });
    }

    // 5. Delicate Orbiting Halo Rings with subtle iridescent glow
    const haloGroup = new THREE.Group();
    scene.add(haloGroup);

    const haloMat1 = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
    });
    const halo1 = new THREE.Mesh(new THREE.TorusGeometry(32, 0.18, 12, 100), haloMat1);
    halo1.rotation.x = Math.PI / 3;
    haloGroup.add(halo1);

    const haloMat2 = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.14,
      wireframe: true,
    });
    const halo2 = new THREE.Mesh(new THREE.TorusGeometry(46, 0.15, 12, 120), haloMat2);
    halo2.rotation.z = Math.PI / 4;
    halo2.rotation.y = Math.PI / 5;
    haloGroup.add(halo2);

    // 6. Smooth Mouse & Touch Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      mouseX = (clientX / window.innerWidth - 0.5) * 2;
      mouseY = (clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });

    // 7. Responsive Viewport Resize
    const onResize = () => {
      if (!container) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    // 8. Fluid Animation Loop (60 FPS)
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Smooth camera parallax easing
      targetX += (mouseX - targetX) * 0.035;
      targetY += (mouseY - targetY) * 0.035;

      camera.position.x = targetX * 4.5;
      camera.position.y = -targetY * 3.5;
      camera.lookAt(0, 0, 0);

      // Light movement for realistic refractive highlights
      primaryLight.position.x = 35 + targetX * 12;
      primaryLight.position.y = 40 - targetY * 12;

      // Animate Ethereal Wave Surface
      const posAttr = waveGeometry.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;

      let pIndex = 0;
      for (let i = 0; i < waveCols; i++) {
        for (let j = 0; j < waveRows; j++) {
          const u = i / waveCols;
          const v = j / waveRows;
          const waveZ =
            Math.sin(u * 5 + elapsed * 0.8) * 2.4 +
            Math.cos(v * 4 + elapsed * 0.6) * 2.2 +
            Math.sin((u + v) * 3 + elapsed * 0.5) * 1.5 -
            12;

          positions[pIndex * 3 + 2] = waveZ;
          pIndex++;
        }
      }
      posAttr.needsUpdate = true;

      // Rotate Orbit Halos
      halo1.rotation.z = elapsed * 0.03;
      halo2.rotation.y = elapsed * 0.02;

      // Animate Floating Crystals
      for (let i = 0; i < floatingCrystals.length; i++) {
        const item = floatingCrystals[i];
        item.mesh.rotation.x += item.rotSpeedX;
        item.mesh.rotation.y += item.rotSpeedY;
        item.mesh.rotation.z += item.rotSpeedZ;

        item.mesh.position.y =
          item.baseY +
          Math.sin(elapsed * item.floatSpeed + item.timeOffset) * item.floatRange;
        item.mesh.position.x =
          item.baseX +
          Math.cos(elapsed * 0.5 * item.floatSpeed + item.timeOffset) * 0.8;
      }

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // 9. Comprehensive Cleanup to avoid memory leaks
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("resize", onResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      waveGeometry.dispose();
      waveMaterial.dispose();
      particleTexture.dispose();

      for (const item of floatingCrystals) {
        item.mesh.geometry.dispose();
      }
      for (const mat of crystalMaterials) {
        mat.dispose();
      }

      haloMat1.dispose();
      haloMat2.dispose();
      halo1.geometry.dispose();
      halo2.geometry.dispose();

      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden w-full h-full select-none"
    />
  );
}
