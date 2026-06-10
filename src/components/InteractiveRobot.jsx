import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const InteractiveRobot = () => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    container.innerHTML = "";
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // --- 1. Scene Setup ---
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 3.8); // Shifted down slightly to center the round body
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    const domElement = renderer.domElement;
    container.appendChild(domElement);
    
    // --- 2. Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(2, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);
    
    const rimLight = new THREE.DirectionalLight(0xff007f, 2.5); // Neon pink rim
    rimLight.position.set(-3, 3, -1);
    scene.add(rimLight);
    
    const fillLight = new THREE.DirectionalLight(0x00ffff, 2.0); // Neon cyan fill
    fillLight.position.set(3, 1, 2);
    scene.add(fillLight);
    
    // --- 3. Procedural Canvas Textures ---
    // Speckle texture for the matte white body
    const createSpeckleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 512);
      
      // Paint tiny, irregular grey speckles
      ctx.fillStyle = '#cfd8dc';
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 2 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    };
    
    // Gradient texture for the inner head sphere
    const createGradientTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      // Beautiful diagonal rainbow-ish gradient matching reference
      const grad = ctx.createLinearGradient(0, 256, 180, 0);
      grad.addColorStop(0, '#ff3b7f'); // Neon pink/rose
      grad.addColorStop(0.45, '#ff8a50'); // Vibrant coral
      grad.addColorStop(0.8, '#ffeb3b'); // Warm yellow
      grad.addColorStop(1.0, '#a7f3d0'); // Soft mint green
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(canvas);
    };
    
    const speckleMap = createSpeckleTexture();
    const gradientMap = createGradientTexture();
    
    // --- 4. Materials ---
    const bodyMaterial = new THREE.MeshStandardMaterial({
      map: speckleMap,
      roughness: 0.75,
      metalness: 0.1,
    });
    
    const collarMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
    });
    
    const glassHelmetMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.95, // Glass effect
      ior: 1.5,           // Index of refraction
      thickness: 0.1,     // Glass thickness
      specularIntensity: 1.0
    });
    
    const innerHeadMaterial = new THREE.MeshStandardMaterial({
      map: gradientMap,
      roughness: 0.1,
      metalness: 0.1,
    });
    
    const glowingEyeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    
    // --- 5. Robot Geometry ---
    const robotGroup = new THREE.Group();
    
    // Speckled Matte White Body Sphere
    const bodyGeo = new THREE.SphereGeometry(0.7, 32, 32);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    robotGroup.add(bodyMesh);
    
    // White Neck Collar/Rim Ring
    const collarGeo = new THREE.CylinderGeometry(0.44, 0.47, 0.08, 32, 1, false);
    const collarMesh = new THREE.Mesh(collarGeo, collarMaterial);
    collarMesh.position.y = 0.58;
    robotGroup.add(collarMesh);
    
    // Head Group (Focal point that tracks cursor)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.95, 0); // Pivot point on neck
    
    // Inner colorful gradient head sphere
    const innerHeadGeo = new THREE.SphereGeometry(0.38, 32, 32);
    const innerHeadMesh = new THREE.Mesh(innerHeadGeo, innerHeadMaterial);
    headGroup.add(innerHeadMesh);
    
    // Outer glass bubble helmet
    const glassHelmetGeo = new THREE.SphereGeometry(0.41, 32, 32);
    const glassHelmetMesh = new THREE.Mesh(glassHelmetGeo, glassHelmetMaterial);
    headGroup.add(glassHelmetMesh);
    
    // Glowing oval outline eyes (stretched Torus)
    const eyeGeo = new THREE.TorusGeometry(0.045, 0.012, 8, 24);
    
    const leftEye = new THREE.Mesh(eyeGeo, glowingEyeMaterial);
    leftEye.position.set(-0.13, 0.06, 0.35);
    leftEye.scale.set(0.65, 1.25, 0.5); // Stretched into ovals
    leftEye.rotation.y = -0.15;
    headGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeo, glowingEyeMaterial);
    rightEye.position.set(0.13, 0.06, 0.35);
    rightEye.scale.set(0.65, 1.25, 0.5);
    rightEye.rotation.y = 0.15;
    headGroup.add(rightEye);
    
    // Side ears/antennas on the glass helmet
    const earPostGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
    const earDishGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12);
    
    const leftEarGroup = new THREE.Group();
    leftEarGroup.position.set(-0.43, 0.05, 0);
    leftEarGroup.rotation.z = Math.PI / 2.3;
    
    const leftEarPost = new THREE.Mesh(earPostGeo, collarMaterial);
    const leftEarDish = new THREE.Mesh(earDishGeo, collarMaterial);
    leftEarDish.position.y = 0.04;
    leftEarGroup.add(leftEarPost, leftEarDish);
    headGroup.add(leftEarGroup);
    
    const rightEarGroup = new THREE.Group();
    rightEarGroup.position.set(0.43, 0.05, 0);
    rightEarGroup.rotation.z = -Math.PI / 2.3;
    
    const rightEarPost = new THREE.Mesh(earPostGeo, collarMaterial);
    const rightEarDish = new THREE.Mesh(earDishGeo, collarMaterial);
    rightEarDish.position.y = 0.04;
    rightEarGroup.add(rightEarPost, rightEarDish);
    headGroup.add(rightEarGroup);
    
    robotGroup.add(headGroup);
    
    // Scale the robot model to fit perfectly within the container bounds
    robotGroup.scale.set(1.18, 1.18, 1.18);
    scene.add(robotGroup);
    
    // Floor shadow catcher
    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.95;
    floor.receiveShadow = true;
    scene.add(floor);
    
    robotGroup.position.y = -0.35;
    
    // --- 6. Cursor Tracking (Global Window Coordinates) ---
    const mouse = new THREE.Vector2();
    const targetRotation = new THREE.Vector2();
    
    const handleMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // Head tilts to look at cursor
      targetRotation.y = mouse.x * 0.8;
      targetRotation.x = -mouse.y * 0.4;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // --- 7. Animation Loop ---
    let animationFrameId;
    
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Smooth look rotation
      headGroup.rotation.y += (targetRotation.y - headGroup.rotation.y) * 0.08;
      headGroup.rotation.x += (targetRotation.x - headGroup.rotation.x) * 0.08;
      
      // Slow breathing movement
      const elapsedTime = Date.now() * 0.0015;
      robotGroup.position.y = -0.35 + Math.sin(elapsedTime) * 0.025;
      headGroup.position.y = 0.95 + Math.sin(elapsedTime * 1.3) * 0.008;
      
      // Subtle body rotation for three dimensional depth
      bodyMesh.rotation.y = Math.sin(elapsedTime * 0.35) * 0.05;
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // --- 8. Resize Handler ---
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      
      renderer.setSize(newWidth, newHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // --- 9. Cleanups ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (container && domElement) {
        container.removeChild(domElement);
      }
      
      bodyGeo.dispose();
      collarGeo.dispose();
      innerHeadGeo.dispose();
      glassHelmetGeo.dispose();
      eyeGeo.dispose();
      earPostGeo.dispose();
      earDishGeo.dispose();
      floorGeo.dispose();
      
      speckleMap.dispose();
      gradientMap.dispose();
      
      bodyMaterial.dispose();
      collarMaterial.dispose();
      glassHelmetMaterial.dispose();
      innerHeadMaterial.dispose();
      glowingEyeMaterial.dispose();
      floorMat.dispose();
      
      renderer.dispose();
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '420px', 
        position: 'relative'
      }} 
    />
  );
};

export default InteractiveRobot;
