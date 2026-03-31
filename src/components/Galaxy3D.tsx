import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const Galaxy3D: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight || 600;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 8; // Moved even further away for a better overview

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.2;
        controls.enableZoom = true;
        controls.minDistance = 3;
        controls.maxDistance = 20;

        // Galaxy Parameters
        const parameters = {
            count: 300000, 
            size: 0.005, // Even smaller for a cleaner look
            radius: 5,
            branches: 3,
            spin: 1.2,
            randomness: 0.25,
            randomnessPower: 3,
            insideColor: '#ffffff',
            outsideColor: '#0066ff'
        };

        let geometry: THREE.BufferGeometry | null = null;
        let material: THREE.PointsMaterial | null = null;
        let points: THREE.Points | null = null;
        let dust: THREE.Points | null = null;
        let corePoints: THREE.Points | null = null;

        const generateGalaxy = () => {
            if (points !== null) {
                geometry?.dispose();
                material?.dispose();
                scene.remove(points);
            }
            if (corePoints !== null) {
                scene.remove(corePoints);
            }

            geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(parameters.count * 3);
            const colors = new Float32Array(parameters.count * 3);

            const colorInside = new THREE.Color(parameters.insideColor);
            const colorOutside = new THREE.Color(parameters.outsideColor);

            for (let i = 0; i < parameters.count; i++) {
                const i3 = i * 3;

                const radius = Math.pow(Math.random(), 2.8) * parameters.radius;
                const spinAngle = radius * parameters.spin;
                const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2;

                const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
                const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius * 0.2; // Even flatter
                const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;

                positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
                positions[i3 + 1] = randomY;
                positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

                const mixedColor = colorInside.clone();
                mixedColor.lerp(colorOutside, radius / parameters.radius);

                colors[i3] = mixedColor.r;
                colors[i3 + 1] = mixedColor.g;
                colors[i3 + 2] = mixedColor.b;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            material = new THREE.PointsMaterial({
                size: parameters.size,
                sizeAttenuation: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexColors: true,
                transparent: true,
                opacity: 0.25 // Lower opacity for a more subtle look
            });

            points = new THREE.Points(geometry, material);
            scene.add(points);

            // Sparse Core (No more "light bulb")
            const coreCount = 30000; // Reduced from 80k
            const corePositions = new Float32Array(coreCount * 3);
            const coreColors = new Float32Array(coreCount * 3);
            const coreGeometry = new THREE.BufferGeometry();

            for (let i = 0; i < coreCount; i++) {
                const i3 = i * 3;
                const radius = Math.pow(Math.random(), 1.5) * 1.2; // More spread out
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;

                corePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
                corePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.3;
                corePositions[i3 + 2] = radius * Math.cos(phi);

                const mixedColor = colorInside.clone();
                mixedColor.lerp(new THREE.Color('#ffddcc'), radius / 1.2);
                coreColors[i3] = mixedColor.r;
                coreColors[i3 + 1] = mixedColor.g;
                coreColors[i3 + 2] = mixedColor.b;
            }

            coreGeometry.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));
            coreGeometry.setAttribute('color', new THREE.BufferAttribute(coreColors, 3));
            
            const coreMaterial = new THREE.PointsMaterial({
                size: 0.008,
                sizeAttenuation: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexColors: true,
                transparent: true,
                opacity: 0.4
            });

            corePoints = new THREE.Points(coreGeometry, coreMaterial);
            scene.add(corePoints);

            // Background Dust
            const dustCount = 10000;
            const dustPositions = new Float32Array(dustCount * 3);
            for (let i = 0; i < dustCount; i++) {
                dustPositions[i * 3] = (Math.random() - 0.5) * 30;
                dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
                dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
            }
            const dustGeometry = new THREE.BufferGeometry();
            dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
            const dustMaterial = new THREE.PointsMaterial({
                size: 0.008,
                color: '#ffffff',
                transparent: true,
                opacity: 0.08,
                blending: THREE.AdditiveBlending
            });
            dust = new THREE.Points(dustGeometry, dustMaterial);
            scene.add(dust);
        };

        generateGalaxy();

        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            if (points) points.rotation.y = elapsedTime * 0.03;
            if (dust) dust.rotation.y = elapsedTime * 0.01;
            if (corePoints) corePoints.rotation.y = elapsedTime * 0.05;
            
            controls.update();
            renderer.render(scene, camera); // Back to standard renderer
            requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight || 600;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full relative bg-black overflow-hidden"
            style={{ 
                maskImage: 'radial-gradient(circle, black 40%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 100%)'
            }}
        />
    );
};

export default Galaxy3D;
