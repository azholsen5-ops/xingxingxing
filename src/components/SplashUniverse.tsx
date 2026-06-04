import React, { useEffect, useRef } from 'react';

interface SplashUniverseProps {
    progress: number;
    isExploding: boolean;
    onExplosionComplete: () => void;
    mouseX: number;
    mouseY: number;
}

interface Star3D {
    // 3D Cartesian coordinates relative to center (0, 0, 0)
    x: number;
    y: number;
    z: number;
    
    // Original radius/angle in sphere
    radius: number;
    theta: number; // elevation angle
    phi: number;   // azimuthal orbital angle
    
    // Orbital parameters
    speedMultiplier: number;
    rotationOffset: number;
    
    // Aesthetics
    size: number;
    alpha: number;
    color: string;
    
    // Named star attributes
    name?: string;
    
    // Projected coordinate cache for motion trail line drawing
    lastScreenX: number | null;
    lastScreenY: number | null;
}

export const SplashUniverse: React.FC<SplashUniverseProps> = ({
    progress,
    isExploding,
    onExplosionComplete,
    mouseX,
    mouseY
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const starsRef = useRef<Star3D[]>([]);
    
    // Camera state control for dragging and smooth fluid drifting
    const cameraStateRef = useRef({
        rotX: -0.32,  // Slight birds-eye pitch tilt
        rotY: 0.15,   // Rotational yaw angle
        targetRotX: -0.32,
        targetRotY: 0.15,
        isDragging: false,
        lastMouseX: 0,
        lastMouseY: 0
    });

    const stateRef = useRef({ progress, isExploding, mouseX, mouseY });

    // Instantly sync parent state values into ref to bypass canvas tear-downs
    useEffect(() => {
        stateRef.current = { progress, isExploding, mouseX, mouseY };
    }, [progress, isExploding, mouseX, mouseY]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (canvas) {
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', handleResize);

        // Grid rotation drag listeners
        const onMouseDown = (e: MouseEvent) => {
            if (stateRef.current.isExploding) return;
            const cam = cameraStateRef.current;
            cam.isDragging = true;
            cam.lastMouseX = e.clientX;
            cam.lastMouseY = e.clientY;
        };

        const onMouseMove = (e: MouseEvent) => {
            const cam = cameraStateRef.current;
            if (cam.isDragging) {
                const deltaX = e.clientX - cam.lastMouseX;
                const deltaY = e.clientY - cam.lastMouseY;
                
                cam.targetRotY += deltaX * 0.004;
                cam.targetRotX = Math.max(-1.1, Math.min(1.1, cam.targetRotX + deltaY * 0.004));
                
                cam.lastMouseX = e.clientX;
                cam.lastMouseY = e.clientY;
            }
        };

        const onMouseUp = () => {
            cameraStateRef.current.isDragging = false;
        };

        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        // Precise stellar colors mimicking astronomical temperatures
        const lerpColor = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, ratio: number) => {
            const r = Math.round(r1 + (r2 - r1) * ratio);
            const g = Math.round(g1 + (g2 - g1) * ratio);
            const b = Math.round(b1 + (b2 - b1) * ratio);
            return `rgba(${r}, ${g}, ${b}, `;
        };

        const getStellarColor = (ratio: number) => {
            if (ratio < 0.15) {
                // High temperature Core Class O: Brilliant peach white & gold glow
                return lerpColor(255, 255, 255, 254, 215, 170, ratio / 0.15);
            } else if (ratio < 0.45) {
                // Warm Solar Class F/G: Rich amber to vibrant gold-orange
                return lerpColor(254, 215, 170, 244, 63, 94, (ratio - 0.15) / 0.30);
            } else if (ratio < 0.75) {
                // Energetic Class B/A: Light turquoise to cosmic neon cyan
                return lerpColor(244, 63, 94, 34, 211, 238, (ratio - 0.45) / 0.30);
            } else {
                // Outer interstellar halo class M: Deep royal indigo and violet dusk
                return lerpColor(34, 211, 238, 99, 102, 241, Math.min(1, (ratio - 0.75) / 0.25));
            }
        };

        // Standard stellar coordinate layout based on nearby star systems
        const namedStarsConfig = [
            { name: "Sirius (天狼星)", x: -260, y: -90, z: 270, color: "rgba(186, 230, 253, " },
            { name: "Alpha Centauri (半人马座α)", x: 170, y: 35, z: -160, color: "rgba(254, 240, 138, " },
            { name: "Proxima Centauri (比邻星)", x: 190, y: 40, z: -170, color: "rgba(248, 113, 113, " },
            { name: "Vega (织女星)", x: -440, y: 280, z: -220, color: "rgba(191, 219, 254, " },
            { name: "Arcturus (大角星)", x: 390, y: -260, z: 340, color: "rgba(253, 186, 116, " },
            { name: "Capella (五车二)", x: -120, y: 410, z: -460, color: "rgba(253, 224, 71, " },
            { name: "Rigel (参宿七)", x: -570, y: -440, z: -710, color: "rgba(147, 197, 253, " },
            { name: "Betelgeuse (参宿四)", x: 620, y: 190, z: -760, color: "rgba(239, 68, 68, " },
            { name: "Altair (河鼓二/牛郎星)", x: -190, y: -110, z: -390, color: "rgba(244, 244, 245, " },
            { name: "Aldebaran (毕宿五)", x: 490, y: -160, z: -530, color: "rgba(251, 146, 60, " },
            { name: "Antares (心宿二)", x: -280, y: -210, z: 750, color: "rgba(248, 113, 113, " },
            { name: "Pollux (北河三)", x: 250, y: 260, z: 190, color: "rgba(253, 186, 116, " },
            { name: "Deneb (天津四)", x: -760, y: 550, z: -890, color: "rgba(219, 234, 254, " }
        ];

        // Intelligently generates a beautiful 3D Globular Spherical Cluster combined with named star projection drops
        const initGalaxy = () => {
            const isMobile = window.innerWidth < 768;
            const starCount = isMobile ? 3200 : 7500;
            const arr: Star3D[] = [];

            // 1. Add major named constellations
            namedStarsConfig.forEach((star) => {
                const radius = Math.sqrt(star.x * star.x + star.y * star.y + star.z * star.z);
                arr.push({
                    x: star.x,
                    y: star.y,
                    z: star.z,
                    radius,
                    theta: Math.acos(star.y / (radius || 1)),
                    phi: Math.atan2(star.z, star.x),
                    speedMultiplier: 0.0001 + Math.random() * 0.0002, // very slow orbits
                    rotationOffset: Math.random() * Math.PI * 2,
                    size: 1.5 + Math.random() * 0.8,
                    alpha: 0.85 + Math.random() * 0.15,
                    color: star.color,
                    name: star.name,
                    lastScreenX: null,
                    lastScreenY: null
                });
            });

            // 2. Generate a gorgeous, dense 3D Globular Spherical Star Cluster
            const maxRadius = 1150;
            for (let i = 0; i < starCount; i++) {
                // Dense spherical power-law core (super concentrated at x,y,z = 0)
                const radius = Math.pow(Math.random(), 2.8) * maxRadius + 12;
                const ratio = radius / maxRadius;

                // Spherical coordinates with uniform random spread
                const costheta = Math.random() * 2 - 1;
                const sintheta = Math.sqrt(1 - costheta * costheta);
                const phi = Math.random() * Math.PI * 2;

                // Create a beautiful, organic oblate-spheroidal constellation cluster shape
                const x = radius * sintheta * Math.cos(phi);
                const z = radius * sintheta * Math.sin(phi);
                const y = radius * costheta * 0.72; // Slightly flattened for a cosmic galactic disk aesthetic

                // Faster orbits in the core (Keplerian orbits)
                const speedMultiplier = (0.0038 / (ratio * 2.5 + 0.35)) + 0.0003;

                // Sizing profile
                const sizeRand = Math.random();
                let size = 0.4 + sizeRand * 0.65;
                if (sizeRand > 0.985) {
                    size = 1.3 + Math.random() * 1.5; // Massive giants sparkling
                }

                const alpha = Math.random() * 0.65 + 0.15;
                const color = getStellarColor(ratio);

                arr.push({
                    x,
                    y,
                    z,
                    radius,
                    theta: Math.acos(y / (radius || 1)),
                    phi,
                    speedMultiplier,
                    rotationOffset: Math.random() * Math.PI * 2,
                    size,
                    alpha,
                    color,
                    lastScreenX: null,
                    lastScreenY: null
                });
            }
            starsRef.current = arr;
        };

        initGalaxy();

        // Viewport camera parameters
        const fov = 580;
        let cameraZ = 1380;       // Optimal telescope focus zone
        let warpProgress = 0;     // Warp velocity hyperdrive tracker
        let globalTime = 0;

        let lastTime = performance.now();

        const renderFrame = (now: number) => {
            const timeDelta = Math.min(50, now - lastTime) / 1000;
            lastTime = now;

            const { progress: currentProgress, isExploding: activeExploding, mouseX: mX, mouseY: mY } = stateRef.current;
            
            globalTime += timeDelta;

            // FADE BUFFER / HYPERDRIVE TRAILS
            if (activeExploding) {
                // Stretch long, high-speed kinetic starburst streaks
                ctx.fillStyle = 'rgba(3, 6, 12, 0.28)';
                ctx.fillRect(0, 0, width, height);
            } else {
                ctx.clearRect(0, 0, width, height);

                // DRAW BEAUTIFUL RICH COSMIC NEBULA CLOUDS IN BACKGROUND (Video-like magenta/cyan/blue nebular depth)
                const centerX = width / 2;
                const centerY = height / 2;
                
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                
                // Nebula Cloud 1: Deep Royal Violet Dust (Slowly drifts, pulses)
                const cloud1X = centerX + Math.cos(globalTime * 0.12) * 110;
                const cloud1Y = centerY + Math.sin(globalTime * 0.08) * 80;
                const cloud1Radius = Math.min(width, height) * 0.6;
                const nebulaGrad1 = ctx.createRadialGradient(cloud1X, cloud1Y, 0, cloud1X, cloud1Y, cloud1Radius);
                nebulaGrad1.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
                nebulaGrad1.addColorStop(0.5, 'rgba(139, 92, 246, 0.04)');
                nebulaGrad1.addColorStop(1, 'rgba(3, 6, 12, 0)');
                ctx.fillStyle = nebulaGrad1;
                ctx.fillRect(0, 0, width, height);

                // Nebula Cloud 2: Hot Solar Magenta Halo
                const cloud2X = centerX - Math.sin(globalTime * 0.09) * 150;
                const cloud2Y = centerY + Math.cos(globalTime * 0.14) * 60;
                const cloud2Radius = Math.min(width, height) * 0.52;
                const nebulaGrad2 = ctx.createRadialGradient(cloud2X, cloud2Y, 0, cloud2X, cloud2Y, cloud2Radius);
                nebulaGrad2.addColorStop(0, 'rgba(244, 63, 94, 0.06)');
                nebulaGrad2.addColorStop(0.6, 'rgba(168, 85, 247, 0.02)');
                nebulaGrad2.addColorStop(1, 'rgba(3, 6, 12, 0)');
                ctx.fillStyle = nebulaGrad2;
                ctx.fillRect(0, 0, width, height);

                // Nebula Cloud 3: Intricate Cyan Lane
                const cloud3X = centerX + Math.sin(globalTime * 0.07) * 220;
                const cloud3Y = centerY - Math.cos(globalTime * 0.11) * 120;
                const cloud3Radius = Math.min(width, height) * 0.45;
                const nebulaGrad3 = ctx.createRadialGradient(cloud3X, cloud3Y, 0, cloud3X, cloud3Y, cloud3Radius);
                nebulaGrad3.addColorStop(0, 'rgba(6, 182, 212, 0.04)');
                nebulaGrad3.addColorStop(0.75, 'rgba(30, 41, 59, 0)');
                ctx.fillStyle = nebulaGrad3;
                ctx.fillRect(0, 0, width, height);

                ctx.restore();
            }

            const centerX = width / 2;
            const centerY = height / 2;

            const cam = cameraStateRef.current;

            // FLUID CAMERA INERTIAL DRAGS OR AUTOMATIC GLIDES
            if (!cam.isDragging) {
                if (mX !== -1000) {
                    const normX = (mX - width / 2) / (width / 2);
                    const normY = (mY - height / 2) / (height / 2);
                    cam.targetRotX = -0.32 + (normY * 0.22);
                    cam.targetRotY += 0.0012; // Continuous slow orbital drift
                } else {
                    cam.targetRotX = -0.32 + Math.sin(globalTime * 0.25) * 0.04;
                    cam.targetRotY = globalTime * 0.022; // Cinematic spin speed
                }
            }

            cam.rotX += (cam.targetRotX - cam.rotX) * 0.05;
            cam.rotY += (cam.targetRotY - cam.rotY) * 0.05;

            const rotX = cam.rotX;
            const rotY = cam.rotY;

            // Warp compression dynamics
            const loadingRatio = currentProgress / 100;
            const orbitalSpeedIncrement = 1.0 + loadingRatio * 5.0;

            if (activeExploding) {
                warpProgress = Math.min(1.0, warpProgress + timeDelta * 0.54); // Accelerated plunge
                const warpEase = Math.pow(warpProgress, 3.4);
                cameraZ = 1380 - warpEase * 1800; // Fly completely past center star
            } else {
                cameraZ = 1380 - (loadingRatio * 200);
            }

            ctx.globalCompositeOperation = 'screen';

            // DRAW HIGH-TECH RADIAL HUDS & FLAT COORDINATE CELLS PLANES (Video matching layout)
            if (!activeExploding) {
                const ringRadii = [140, 280, 440, 580, 720];
                ringRadii.forEach((radius, ringIdx) => {
                    const radiusWarp = radius * (1 - loadingRatio * 0.12);
                    const opacity = (0.045 + Math.sin(globalTime * 0.65 + ringIdx * 8) * 0.015) * (1 - loadingRatio * 0.45);
                    
                    ctx.save();
                    ctx.beginPath();
                    // Render 3D flat grid plane concentric circle
                    for (let a = 0; a <= Math.PI * 2; a += 0.04) {
                        const px = Math.cos(a) * radiusWarp;
                        const pz = Math.sin(a) * radiusWarp;
                        const py = 0; // Fixed flat coordinate surface

                        // 3D rotation transformations
                        const rx1 = px * Math.cos(rotY) - pz * Math.sin(rotY);
                        const rz1 = px * Math.sin(rotY) + pz * Math.cos(rotY);
                        
                        const ry2 = py * Math.cos(rotX) - rz1 * Math.sin(rotX);
                        const rz2 = py * Math.sin(rotX) + rz1 * Math.cos(rotX);

                        const fZ = cameraZ + rz2;
                        if (fZ > 15) {
                            const scale = fov / fZ;
                            const scrX = centerX + rx1 * scale;
                            const scrY = centerY + ry2 * scale;
                            if (a === 0) ctx.moveTo(scrX, scrY);
                            else ctx.lineTo(scrX, scrY);
                        }
                    }
                    ctx.strokeStyle = ringIdx % 2 === 0 ? `rgba(6, 182, 212, ${opacity})` : `rgba(168, 85, 247, ${opacity})`;
                    ctx.lineWidth = 0.55;
                    ctx.stroke();
                    ctx.restore();

                    // Render Radial coordinate spokes (longitudinal degree markings)
                    if (ringIdx === 1) {
                        ctx.save();
                        // 12 division lines crossing coordinates
                        const divisionAngle = Math.PI / 6;
                        for (let d = 0; d < 12; d++) {
                            const theta = d * divisionAngle + globalTime * 0.012;
                            const tX = Math.cos(theta) * radiusWarp * 2.5;
                            const tZ = Math.sin(theta) * radiusWarp * 2.5;

                            ctx.beginPath();
                            // Point 1 (Center) -> Point 2 (Outer radius)
                            const rxCenter = 0;
                            const ryCenter = 0;
                            
                            const rx1_c = rxCenter;
                            const rz1_c = cameraZ;
                            const ry2_c = centerY;

                            const rx1 = tX * Math.cos(rotY) - tZ * Math.sin(rotY);
                            const rz1 = tX * Math.sin(rotY) + tZ * Math.cos(rotY);
                            const ry2 = 0 * Math.cos(rotX) - rz1 * Math.sin(rotX);
                            const rz2 = 0 * Math.sin(rotX) + rz1 * Math.cos(rotX);

                            const fZ = cameraZ + rz2;
                            if (fZ > 15 && cameraZ > 15) {
                                const scaleC = fov / cameraZ;
                                const scrX_c = centerX + rx1_c * scaleC;
                                const scrY_c = centerY + (0 * Math.cos(rotX) - 0 * Math.sin(rotX)) * scaleC;

                                const scaleOuter = fov / fZ;
                                const scrX_o = centerX + rx1 * scaleOuter;
                                const scrY_o = centerY + ry2 * scaleOuter;

                                ctx.moveTo(scrX_c, scrY_c);
                                ctx.lineTo(scrX_o, scrY_o);
                                ctx.strokeStyle = `rgba(34, 211, 238, ${opacity * 0.4})`;
                                ctx.lineWidth = 0.42;
                                ctx.stroke();
                            }
                        }

                        // Coordinates labeling (0°, 90°, 180°, 270° degrees marking)
                        ctx.fillStyle = `rgba(34, 211, 238, ${opacity * 2.6})`;
                        ctx.font = '7px font-mono, JetBrains Mono, monospace';
                        ctx.textAlign = 'center';

                        const degreeMarks = [
                            { text: '0° SOLAR APEX', angle: 0 },
                            { text: '120° STELLAR SECTOR', angle: Math.PI * 0.66 },
                            { text: '180° GALACTIC CENTRE', angle: Math.PI },
                            { text: '250° CYGNUS DRIFT', angle: Math.PI * 1.385 },
                            { text: '270° ORBIT SECTOR', angle: Math.PI * 1.5 },
                            { text: '300° DEEP RANGE REF', angle: Math.PI * 1.66 }
                        ];

                        degreeMarks.forEach((mark) => {
                            const theta = mark.angle + globalTime * 0.012;
                            const tX = Math.cos(theta) * (radiusWarp + 15);
                            const tZ = Math.sin(theta) * (radiusWarp + 15);

                            const rx1 = tX * Math.cos(rotY) - tZ * Math.sin(rotY);
                            const rz1 = tX * Math.sin(rotY) + tZ * Math.cos(rotY);
                            const ry2 = 0 * Math.cos(rotX) - rz1 * Math.sin(rotX);
                            const rz2 = 0 * Math.sin(rotX) + rz1 * Math.cos(rotX);

                            const fZ = cameraZ + rz2;
                            if (fZ > 200) {
                                const scale = fov / fZ;
                                const scrX = centerX + rx1 * scale;
                                const scrY = centerY + ry2 * scale;
                                ctx.fillText(mark.text, scrX, scrY);
                            }
                        });
                        ctx.restore();
                    }
                });
            }

            // PROJECTION RUNTIME OF GLOBULAR CLUSTER & NAMED CONSTELATIONS
            const stars = starsRef.current;
            const compression = activeExploding ? 1.0 : Math.max(0.65, 1.0 - (loadingRatio * 0.28));

            stars.forEach((p) => {
                // Orbital angles
                const currentPhi = p.phi + (globalTime * p.speedMultiplier * orbitalSpeedIncrement);
                const curRadius = p.radius * compression;

                // Cartesian positioning
                const px = Math.cos(currentPhi) * curRadius * Math.sin(p.theta);
                const pz = Math.sin(currentPhi) * curRadius * Math.sin(p.theta);
                const py = Math.cos(p.theta) * curRadius;

                // Rotate around Yaw (Y-axis)
                const rx1 = px * Math.cos(rotY) - pz * Math.sin(rotY);
                const rz1 = px * Math.sin(rotY) + pz * Math.cos(rotY);
                
                // Rotate around Pitch (X-axis)
                const ry2 = py * Math.cos(rotX) - rz1 * Math.sin(rotX);
                const rz2 = py * Math.sin(rotX) + rz1 * Math.cos(rotX);

                const finalZ = cameraZ + rz2;

                if (finalZ <= 6) {
                    p.lastScreenX = null;
                    p.lastScreenY = null;
                    return;
                }

                // Perspective scaling
                const scale = fov / finalZ;
                const sX = centerX + rx1 * scale;
                const sY = centerY + ry2 * scale;

                if (activeExploding) {
                    // Hyperspace speed streaking paths using coordinate distance deltas
                    if (p.lastScreenX !== null && p.lastScreenY !== null) {
                        const streakOffset = 1.0 + warpProgress * 6.5;
                        const prevX = p.lastScreenX;
                        const prevY = p.lastScreenY;

                        const alpha = Math.max(0, p.alpha * (1 - warpProgress * 1.15));

                        ctx.beginPath();
                        ctx.moveTo(prevX, prevY);
                        ctx.lineTo(sX, sY);
                        ctx.strokeStyle = `${p.color}${alpha})`;
                        ctx.lineWidth = p.size * (0.8 + warpProgress * 4.4);
                        ctx.stroke();
                    }
                } else {
                    // Standard ambient exploration mode stars
                    const pulse = 0.82 + Math.sin(globalTime * 3.8 + p.radius) * 0.18;
                    const renderSize = Math.max(0.72, p.size * scale * 0.85) * pulse;
                    const renderAlpha = Math.min(1.0, p.alpha * (0.42 + scale * 0.28));

                    ctx.fillStyle = `${p.color}${renderAlpha})`;
                    ctx.beginPath();
                    ctx.arc(sX, sY, renderSize, 0, Math.PI * 2);
                    ctx.fill();

                    // Render named star and drop alt lines (Video layout)
                    if (p.name && scale > 0.45) {
                        const infoAlpha = Math.min(1.0, (scale - 0.45) * 1.8) * (1 - loadingRatio * 0.28);
                        
                        ctx.save();
                        // 1. altitude reference line straight down to celestial horizontal plane
                        const ryEquator = 0 * Math.cos(rotX) - rz1 * Math.sin(rotX);
                        const rzEquator = 0 * Math.sin(rotX) + rz1 * Math.cos(rotX);
                        const equatorZ = cameraZ + rzEquator;

                        if (equatorZ > 10) {
                            const eqScale = fov / equatorZ;
                            const eqX = centerX + rx1 * eqScale;
                            const eqY = centerY + ryEquator * eqScale;

                            ctx.beginPath();
                            ctx.moveTo(sX, sY);
                            ctx.lineTo(eqX, eqY);
                            ctx.strokeStyle = `rgba(34, 211, 238, ${infoAlpha * 0.16})`;
                            ctx.lineWidth = 0.6;
                            ctx.setLineDash([2, 2]);
                            ctx.stroke();

                            // Dotted horizontal grid alignment line connection
                            ctx.beginPath();
                            ctx.arc(eqX, eqY, 2.8, 0, Math.PI * 2);
                            ctx.fillStyle = `rgba(34, 211, 238, ${infoAlpha * 0.4})`;
                            ctx.fill();
                        }

                        // 2. High-tech HUD name tags
                        ctx.font = '8px font-mono, JetBrains Mono, monospace';
                        ctx.fillStyle = `rgba(255, 255, 255, ${infoAlpha * 0.85})`;
                        ctx.textAlign = 'left';

                        // Target crosshairs
                        ctx.beginPath();
                        ctx.arc(sX, sY, renderSize + 4.0, 0, Math.PI * 2);
                        ctx.strokeStyle = `rgba(34, 211, 238, ${infoAlpha * 0.45})`;
                        ctx.lineWidth = 0.55;
                        ctx.setLineDash([]);
                        ctx.stroke();

                        // Pointer connector lines
                        ctx.beginPath();
                        ctx.moveTo(sX + renderSize + 4.0, sY);
                        ctx.lineTo(sX + renderSize + 15.0, sY);
                        ctx.strokeStyle = `rgba(34, 211, 238, ${infoAlpha * 0.45})`;
                        ctx.stroke();

                        ctx.fillText(p.name, sX + renderSize + 19.5, sY + 3);
                        ctx.restore();
                    }
                }

                p.lastScreenX = sX;
                p.lastScreenY = sY;
            });

            // DRAW CENTRAL SOLAR CORE (HIGH VALUE VIDEO COMPACTION)
            if (cameraZ > -100) {
                const coreScale = fov / Math.max(15, cameraZ);
                const sunRadius = 16 + Math.sin(globalTime * 4.8) * 1.5 + (loadingRatio * 32);
                const renderSunRadius = sunRadius * coreScale * 0.16;

                if (renderSunRadius > 0.4) {
                    ctx.save();
                    // Multi-layer glowing corona with stellar color thermal shades
                    const corona = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, renderSunRadius * 2.8);
                    corona.addColorStop(0, `rgba(255, 255, 255, ${0.98 + loadingRatio * 0.02})`);
                    corona.addColorStop(0.15, `rgba(253, 224, 71, ${0.85 + loadingRatio * 0.15})`); // Photo-sphere
                    corona.addColorStop(0.48, `rgba(244, 63, 94, ${0.45 + loadingRatio * 0.25})`);  // Chrome star orange
                    corona.addColorStop(0.85, `rgba(139, 92, 246, ${0.15 + loadingRatio * 0.1})`);  // Helium violet flame
                    corona.addColorStop(1.0, 'rgba(3, 6, 12, 0)');

                    ctx.fillStyle = corona;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, renderSunRadius * 3.0, 0, Math.PI * 2);
                    ctx.fill();

                    // Rotating dynamic flare loops
                    ctx.translate(centerX, centerY);
                    ctx.rotate(globalTime * 0.08);
                    const flareRays = 8;
                    for (let r = 0; r < flareRays; r++) {
                        const rayAngle = (r / flareRays) * Math.PI * 2;
                        const pulsateLength = renderSunRadius * (2.4 + Math.sin(globalTime * 2.2 + r) * 0.4);
                        
                        const rayGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, pulsateLength);
                        rayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
                        rayGrad.addColorStop(0.3, 'rgba(253, 224, 71, 0.25)');
                        rayGrad.addColorStop(0.6, 'rgba(244, 63, 94, 0.08)');
                        rayGrad.addColorStop(1.0, 'rgba(3, 6, 12, 0)');

                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(Math.cos(rayAngle - 0.15) * pulsateLength, Math.sin(rayAngle - 0.15) * pulsateLength);
                        ctx.lineTo(Math.cos(rayAngle + 0.15) * pulsateLength, Math.sin(rayAngle + 0.15) * pulsateLength);
                        ctx.closePath();
                        ctx.fillStyle = rayGrad;
                        ctx.fill();
                    }
                    ctx.restore();
                }
            }

            // CINEMATIC FADE TO MAIN CONTENT OVERLAY (SUPERNOVA SOLAR FLARE WHITE-OUT)
            if (activeExploding) {
                const fadeThreshold = 0.55; 
                if (warpProgress >= fadeThreshold) {
                    const fadeStrength = (warpProgress - fadeThreshold) / (1 - fadeThreshold);
                    
                    const flashOverlay = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.85);
                    flashOverlay.addColorStop(0, `rgba(255, 255, 255, ${fadeStrength})`);
                    flashOverlay.addColorStop(0.32, `rgba(254, 243, 199, ${fadeStrength * 0.95})`);  // Warming yellow flare
                    flashOverlay.addColorStop(0.68, `rgba(251, 113, 133, ${fadeStrength * 0.8})`);   // Glowing envelope
                    flashOverlay.addColorStop(0.9, `rgba(3, 6, 12, ${fadeStrength})`);
                    flashOverlay.addColorStop(1.0, `rgba(3, 6, 12, 1.0)`);

                    ctx.globalCompositeOperation = 'source-over';
                    ctx.fillStyle = flashOverlay;
                    ctx.fillRect(0, 0, width, height);
                }

                if (warpProgress >= 0.99) {
                    onExplosionComplete();
                    return; // Prevent further frame scheduling
                }
            }

            ctx.globalCompositeOperation = 'source-over';
            animationFrameId = requestAnimationFrame(renderFrame);
        };

        animationFrameId = requestAnimationFrame(renderFrame);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full z-0 block pointer-events-auto cursor-grab active:cursor-grabbing font-bold animate-fade-in"
            style={{ mixBlendMode: 'screen' }}
        />
    );
};
