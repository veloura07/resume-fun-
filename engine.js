/**
 * THE LIVING DIGITAL ECOSYSTEM — Canvas Animation Engine (engine.js)
 * Pixel-art theme rendering loop with interactive click regions (bench reflection), 
 * falling leaf sways, dynamic night skyline lights, winding path tracers, 
 * and day/night/weather shaders.
 */

class LivingEcosystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        // Settings & State
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        this.scrollPercent = 0;
        this.activeBiome = 'forest'; // forest, river, mountain, sky, universe, cosmos
        this.timeOfDay = 0.25; // 0.0 to 1.0 (0.25 = Morning, 0.5 = Noon, 0.75 = Sunset, 0.0/1.0 = Night)
        this.targetTimeOfDay = 0.25;
        this.weather = 'clear'; // clear, rain, snow, fog, storm
        this.wind = 1.2;
        this.targetWind = 1.2;
        
        // Mouse Coordinates
        this.mouseX = this.width / 2;
        this.mouseY = this.height / 2;
        this.targetMouseX = this.width / 2;
        this.targetMouseY = this.height / 2;
        this.mouseActive = false;
        
        // Load Pixel Art Base Image (assets/naruto_nature.png)
        this.bgImage = new Image();
        this.bgImage.src = 'assets/naruto_nature.png';
        this.bgLoaded = false;
        this.bgImage.onload = () => {
            this.bgLoaded = true;
        };
        
        // Entity Pools
        this.clouds = [];
        this.stars = [];
        this.birds = [];
        this.butterflies = [];
        this.rainDrops = [];
        this.snowFlakes = [];
        this.leaves = [];
        this.fireflies = [];
        this.glowTrail = [];
        this.pathTracers = []; // Traces path to the city
        
        // Bench Coordinates (bounds mapped as ratios of canvas width/height)
        this.benchXMin = 0.05;
        this.benchXMax = 0.28;
        this.benchYMin = 0.65;
        this.benchYMax = 0.88;
        this.benchHovered = false;

        // City Window Coordinates (ratios mapped on the pixel-art skyline)
        this.cityWindows = [
            {x: 0.370, y: 0.590}, {x: 0.385, y: 0.582}, {x: 0.408, y: 0.585},
            {x: 0.432, y: 0.586}, {x: 0.448, y: 0.575}, {x: 0.456, y: 0.590},
            {x: 0.482, y: 0.580}, {x: 0.505, y: 0.582}, {x: 0.521, y: 0.570},
            {x: 0.536, y: 0.588}, {x: 0.554, y: 0.580}, {x: 0.562, y: 0.590},
            {x: 0.588, y: 0.582}, {x: 0.602, y: 0.588}, {x: 0.622, y: 0.580},
            {x: 0.638, y: 0.585}
        ];

        // Path Bezier Control Points (Winding path to city)
        this.pathPoints = {
            p0: {x: 0.90, y: 0.85}, // Start (Meadow front right)
            p1: {x: 0.70, y: 0.75}, // Control 1
            p2: {x: 0.52, y: 0.66}, // Control 2
            p3: {x: 0.50, y: 0.59}  // End (Skyline base)
        };

        this.init();
        this.bindEvents();
        this.loop();
    }

    init() {
        // Setup initial clouds
        for (let i = 0; i < 4; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.25),
                size: Math.random() * 50 + 30,
                speed: Math.random() * 0.15 + 0.05,
                opacity: Math.random() * 0.12 + 0.04
            });
        }

        // Setup star field
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.6),
                radius: Math.random() * 1.5 + 0.5,
                twinkleSpeed: Math.random() * 0.015 + 0.005,
                phase: Math.random() * Math.PI
            });
        }

        // Setup Boids (Birds flying near skyline)
        for (let i = 0; i < 6; i++) {
            this.birds.push({
                x: Math.random() * this.width,
                y: this.height * 0.3 + (Math.random() - 0.5) * 80,
                vx: Math.random() * 1.2 + 0.8,
                vy: (Math.random() - 0.5) * 0.3,
                wingPhase: Math.random() * Math.PI,
                size: Math.random() * 2 + 1.5
            });
        }

        // Setup Butterflies (meadow region)
        for (let i = 0; i < 5; i++) {
            this.butterflies.push({
                x: this.width * (0.1 + Math.random() * 0.5),
                y: this.height * (0.65 + Math.random() * 0.2),
                vx: (Math.random() - 0.5) * 1.0,
                vy: (Math.random() - 0.5) * 1.0,
                color: `hsl(${Math.random() * 35 + 20}, 90%, 65%)`, // Warm colors matching meadow
                size: Math.random() * 2 + 1.5,
                phase: Math.random() * Math.PI
            });
        }

        // Setup meadow fireflies
        for (let i = 0; i < 15; i++) {
            this.fireflies.push({
                x: Math.random() * this.width,
                y: this.height * (0.6 + Math.random() * 0.35),
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 1.8 + 0.8,
                alpha: Math.random(),
                pulseSpeed: Math.random() * 0.04 + 0.015
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.width = this.canvas.width = window.innerWidth;
            this.height = this.canvas.height = window.innerHeight;
        });

        window.addEventListener('scroll', () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            this.scrollPercent = maxScroll > 0 ? window.scrollY / maxScroll : 0;
            this.updateActiveBiome();
        });

        window.addEventListener('mousemove', (e) => {
            this.targetMouseX = e.clientX;
            this.targetMouseY = e.clientY;
            this.mouseActive = true;
            
            // Check if mouse is hovering over the Wooden Bench
            const mouseXRatio = e.clientX / this.width;
            const mouseYRatio = e.clientY / this.height;
            
            if (mouseXRatio >= this.benchXMin && mouseXRatio <= this.benchXMax &&
                mouseYRatio >= this.benchYMin && mouseYRatio <= this.benchYMax) {
                if (!this.benchHovered) {
                    this.benchHovered = true;
                    document.body.style.cursor = 'pointer';
                }
            } else {
                if (this.benchHovered) {
                    this.benchHovered = false;
                    document.body.style.cursor = 'default';
                }
            }
        });

        window.addEventListener('mouseleave', () => {
            this.mouseActive = false;
            if (this.benchHovered) {
                this.benchHovered = false;
                document.body.style.cursor = 'default';
            }
        });

        // Bench Click Interaction
        window.addEventListener('click', (e) => {
            const mouseXRatio = e.clientX / this.width;
            const mouseYRatio = e.clientY / this.height;
            
            if (mouseXRatio >= this.benchXMin && mouseXRatio <= this.benchXMax &&
                mouseYRatio >= this.benchYMin && mouseYRatio <= this.benchYMax) {
                // Dispatch event that sits the user down on the bench
                window.dispatchEvent(new CustomEvent('sitonbench'));
            }
        });
    }

    updateActiveBiome() {
        const biomes = ['forest', 'river', 'mountain', 'sky', 'universe', 'cosmos'];
        const segment = 1 / biomes.length;
        const index = Math.min(Math.floor(this.scrollPercent / segment), biomes.length - 1);
        const nextBiome = biomes[index];
        
        if (nextBiome !== this.activeBiome) {
            this.activeBiome = nextBiome;
            window.dispatchEvent(new CustomEvent('biomechange', { detail: { biome: nextBiome } }));
            
            // Sync environment state based on active biome
            if (nextBiome === 'universe') {
                this.targetTimeOfDay = 0.0; // Night
                this.targetWind = 0.4;
            } else if (nextBiome === 'river') {
                this.targetTimeOfDay = 0.5; // Noon
                this.targetWind = 0.8;
            } else if (nextBiome === 'cosmos') {
                this.targetTimeOfDay = 0.05; // Night/Constellation twilight
                this.targetWind = 1.6;
            } else if (nextBiome === 'forest') {
                this.targetTimeOfDay = 0.25; // Morning sunrise
                this.targetWind = 1.0;
            } else if (nextBiome === 'mountain') {
                this.targetTimeOfDay = 0.75; // Sunset
                this.targetWind = 2.4;
            }
        }
    }

    // Adjust environment settings manually via HUD
    setTimeOfDay(timeVal) {
        this.targetTimeOfDay = timeVal;
    }

    setWeather(weatherName) {
        this.weather = weatherName;
    }

    update() {
        // Smoothly interpolate time and wind values
        this.timeOfDay += (this.targetTimeOfDay - this.timeOfDay) * 0.04;
        this.wind += (this.targetWind - this.wind) * 0.02;

        // Smooth cursor movement
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.1;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.1;

        // Maintain cursor light fairy trail
        if (this.mouseActive) {
            this.glowTrail.push({ x: this.mouseX, y: this.mouseY, life: 1.0 });
        }
        this.glowTrail.forEach(t => t.life -= 0.035);
        this.glowTrail = this.glowTrail.filter(t => t.life > 0);

        // Update clouds
        this.clouds.forEach(c => {
            c.x += c.speed * this.wind;
            if (c.x > this.width + 100) {
                c.x = -100;
                c.y = Math.random() * (this.height * 0.25);
            }
        });

        // Update birds
        this.birds.forEach(b => {
            b.x += b.vx * (this.wind * 0.4 + 0.6);
            b.y += b.vy + Math.sin(b.wingPhase) * 0.15;
            b.wingPhase += 0.15;
            if (b.x > this.width + 50) {
                b.x = -50;
                b.y = this.height * 0.3 + (Math.random() - 0.5) * 80;
            }
        });

        // Update butterflies
        this.butterflies.forEach(bf => {
            bf.phase += 0.07;
            bf.x += bf.vx + Math.sin(bf.phase) * 0.3;
            bf.y += bf.vy + Math.cos(bf.phase) * 0.3;

            if (this.mouseActive) {
                const dx = this.mouseX - bf.x;
                const dy = this.mouseY - bf.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 80) {
                    bf.vx -= (dx / dist) * 0.12;
                    bf.vy -= (dy / dist) * 0.12;
                } else if (dist < 250) {
                    bf.vx += (dx / dist) * 0.03;
                    bf.vy += (dy / dist) * 0.03;
                }
            }

            bf.vx = Math.max(Math.min(bf.vx, 1.2), -1.2);
            bf.vy = Math.max(Math.min(bf.vy, 1.2), -1.2);

            // Container bounds
            if (bf.x < 20) bf.vx += 0.08;
            if (bf.x > this.width - 20) bf.vx -= 0.08;
            if (bf.y < this.height * 0.6) bf.vy += 0.08;
            if (bf.y > this.height - 20) bf.vy -= 0.08;
        });

        // Update fireflies
        this.fireflies.forEach(ff => {
            ff.x += ff.vx;
            ff.y += ff.vy;
            ff.alpha += ff.pulseSpeed;
            if (ff.x < 0 || ff.x > this.width) ff.vx *= -1;
            if (ff.y < this.height * 0.5 || ff.y > this.height) ff.vy *= -1;
        });

        // Spawn falling leaves from the Oak Tree on the right (X: 70-95%, Y: 40-60%)
        if (Math.random() < 0.02 * this.wind && this.activeBiome === 'forest') {
            this.leaves.push({
                x: this.width * (0.68 + Math.random() * 0.28),
                y: this.height * (0.42 + Math.random() * 0.18),
                size: Math.random() * 3 + 2,
                speedY: Math.random() * 0.8 + 0.6,
                oscSpeed: Math.random() * 0.04 + 0.015,
                phase: Math.random() * Math.PI,
                color: Math.random() < 0.25 ? '#ff8a50' : '#4caf50' // Mostly green, some orange leaves
            });
        }
        this.leaves.forEach(lf => {
            lf.y += lf.speedY;
            lf.x -= (0.4 + Math.sin(lf.phase) * 0.7 + this.wind * 0.25);
            lf.phase += lf.oscSpeed;
        });
        this.leaves = this.leaves.filter(lf => lf.y < this.height && lf.x > 0);

        // Spawn winding path light tracers
        if (Math.random() < 0.015) {
            this.pathTracers.push({
                t: 0.0,
                speed: Math.random() * 0.002 + 0.0015,
                size: Math.random() * 1.5 + 1.0,
                alpha: 1.0
            });
        }
        this.pathTracers.forEach(tr => {
            tr.t += tr.speed;
            tr.alpha = 1.0 - tr.t; // Fade out as it nears the city skyline
        });
        this.pathTracers = this.pathTracers.filter(tr => tr.t <= 1.0);

        this.updateWeather();
    }

    updateWeather() {
        if (this.weather === 'rain' || this.weather === 'storm') {
            if (this.rainDrops.length < 100) {
                this.rainDrops.push({
                    x: Math.random() * this.width,
                    y: -20,
                    length: Math.random() * 15 + 10,
                    speed: Math.random() * 7 + 10
                });
            }
        }
        this.rainDrops.forEach(rd => {
            rd.y += rd.speed;
            rd.x += (this.wind * 0.6);
            if (rd.y > this.height) {
                rd.y = -20;
                rd.x = Math.random() * this.width;
            }
        });

        if (this.weather === 'snow') {
            if (this.snowFlakes.length < 60) {
                this.snowFlakes.push({
                    x: Math.random() * this.width,
                    y: -10,
                    radius: Math.random() * 1.8 + 0.8,
                    speed: Math.random() * 0.8 + 0.6,
                    drift: Math.random() * 0.4 - 0.2
                });
            }
        }
        this.snowFlakes.forEach(sf => {
            sf.y += sf.speed;
            sf.x += sf.drift + (this.wind * 0.1);
            if (sf.y > this.height) {
                sf.y = -10;
                sf.x = Math.random() * this.width;
            }
        });
    }

    // Bezier curve calculations for path tracing
    getBezierPoint(p0, p1, p2, p3, t) {
        const cx = 3 * (p1.x - p0.x);
        const bx = 3 * (p2.x - p1.x) - cx;
        const ax = p3.x - p0.x - cx - bx;

        const cy = 3 * (p1.y - p0.y);
        const by = 3 * (p2.y - p1.y) - cy;
        const ay = p3.y - p0.y - cy - by;

        const x = (ax * Math.pow(t, 3)) + (bx * Math.pow(t, 2)) + (cx * t) + p0.x;
        const y = (ay * Math.pow(t, 3)) + (by * Math.pow(t, 2)) + (cy * t) + p0.y;

        return { x: x * this.width, y: y * this.height };
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Draw base pixel-art nature image backplane
        if (this.bgLoaded) {
            // Apply parallax scroll panning
            const yShift = this.scrollPercent * 80;
            this.ctx.drawImage(this.bgImage, 0, -yShift, this.width, this.height + 80);
        } else {
            // Fallback sky fill if image is loading
            this.ctx.fillStyle = '#1e88e5';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // 2. Night Twilight Shader & Stars Overlay
        if (this.timeOfDay < 0.25 || this.timeOfDay > 0.75) {
            let opacity = 0;
            if (this.timeOfDay < 0.15 || this.timeOfDay > 0.85) opacity = 0.55;
            else if (this.timeOfDay < 0.25) opacity = (0.25 - this.timeOfDay) / 0.1 * 0.55;
            else opacity = (this.timeOfDay - 0.75) / 0.1 * 0.55;

            // Apply blue-black twilight filter
            this.ctx.fillStyle = `rgba(8, 8, 20, ${opacity})`;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Draw twinkling stars
            this.ctx.save();
            this.ctx.globalAlpha = opacity * 1.5;
            this.stars.forEach(st => {
                const twinkleVal = Math.sin(Date.now() * st.twinkleSpeed + st.phase) * 0.4 + 0.6;
                this.ctx.beginPath();
                this.ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${twinkleVal})`;
                this.ctx.fill();
            });
            this.ctx.restore();
        }

        // 3. Draw City Window Lights (Blinking at night)
        if (this.timeOfDay < 0.22 || this.timeOfDay > 0.78) {
            let lightsAlpha = 0;
            if (this.timeOfDay < 0.15 || this.timeOfDay > 0.85) lightsAlpha = 1.0;
            else if (this.timeOfDay < 0.22) lightsAlpha = (0.22 - this.timeOfDay) / 0.07;
            else lightsAlpha = (this.timeOfDay - 0.78) / 0.07;

            this.ctx.save();
            this.ctx.globalAlpha = lightsAlpha;
            this.cityWindows.forEach(win => {
                const blink = Math.random() < 0.02 ? Math.random() * 0.4 + 0.2 : 0.95;
                this.ctx.fillStyle = `rgba(255, 235, 120, ${blink})`;
                // Compensate skyline shift for scroll parallax
                const yShift = this.scrollPercent * 80 * 0.5; 
                this.ctx.fillRect(win.x * this.width, win.y * this.height - yShift, 2, 2);
            });
            this.ctx.restore();
        }

        // 4. Draw bench highlight ring (if hovered)
        if (this.benchHovered) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([4, 4]);
            
            // Draw bounds ellipse around bench location
            const bx = this.width * (this.benchXMin + this.benchXMax) / 2;
            const by = this.height * (this.benchYMin + this.benchYMax) / 2 - (this.scrollPercent * 80);
            const rx = this.width * (this.benchXMax - this.benchXMin) / 2;
            const ry = this.height * (this.benchYMax - this.benchYMin) / 3;

            this.ctx.beginPath();
            this.ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }

        // 5. Draw drifting Clouds
        this.ctx.save();
        this.clouds.forEach(c => {
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            this.ctx.arc(c.x + c.size * 0.6, c.y - c.size * 0.2, c.size * 0.8, 0, Math.PI * 2);
            this.ctx.arc(c.x - c.size * 0.5, c.y + c.size * 0.1, c.size * 0.7, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(240, 244, 255, ${c.opacity})`;
            this.ctx.fill();
        });
        this.ctx.restore();

        // 6. Draw path glow tracers
        this.ctx.save();
        this.pathTracers.forEach(tr => {
            const p = this.getBezierPoint(this.pathPoints.p0, this.pathPoints.p1, this.pathPoints.p2, this.pathPoints.p3, tr.t);
            // Draw small pixelated fairy light
            const yShift = this.scrollPercent * 80;
            
            const radial = this.ctx.createRadialGradient(p.x, p.y - yShift, 0, p.x, p.y - yShift, tr.size * 4);
            radial.addColorStop(0, `rgba(16, 185, 129, ${tr.alpha})`);
            radial.addColorStop(1, 'rgba(16, 185, 129, 0)');
            
            this.ctx.fillStyle = radial;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y - yShift, tr.size * 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();

        // 7. Draw Fauna & Particles (Birds, butterflies, fireflies, and leaves)
        this.drawFaunaAndParticles();

        // 8. Draw Weather layers (Rain, snow, fog)
        this.drawWeatherEffects();

        // 9. Draw cursor glow trail
        this.drawCursorTrail();
    }

    drawFaunaAndParticles() {
        const yShift = this.scrollPercent * 80;

        // Draw Birds
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(25, 40, 30, 0.4)';
        this.ctx.lineWidth = 1.2;
        this.birds.forEach(b => {
            const wingH = Math.sin(b.wingPhase) * b.size;
            this.ctx.beginPath();
            this.ctx.moveTo(b.x - b.size * 2, b.y - wingH - yShift * 0.7);
            this.ctx.lineTo(b.x, b.y - yShift * 0.7);
            this.ctx.lineTo(b.x + b.size * 2, b.y - wingH - yShift * 0.7);
            this.ctx.stroke();
        });
        this.ctx.restore();

        // Draw Butterflies
        this.ctx.save();
        this.butterflies.forEach(bf => {
            this.ctx.fillStyle = bf.color;
            this.ctx.save();
            this.ctx.translate(bf.x, bf.y - yShift);
            
            const wingScale = Math.abs(Math.sin(bf.phase * 2)) * 0.8 + 0.2;
            
            this.ctx.beginPath();
            this.ctx.ellipse(-2, 0, bf.size, bf.size * 1.3 * wingScale, -Math.PI/6, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.ellipse(2, 0, bf.size, bf.size * 1.3 * wingScale, Math.PI/6, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
        this.ctx.restore();

        // Draw Fireflies
        this.ctx.save();
        this.fireflies.forEach(ff => {
            const alpha = Math.abs(Math.sin(ff.alpha)) * 0.5 + 0.1;
            const radial = this.ctx.createRadialGradient(ff.x, ff.y - yShift, 0, ff.x, ff.y - yShift, ff.radius * 4);
            radial.addColorStop(0, `rgba(255, 220, 100, ${alpha})`);
            radial.addColorStop(1, 'rgba(255, 220, 100, 0)');
            
            this.ctx.fillStyle = radial;
            this.ctx.beginPath();
            this.ctx.arc(ff.x, ff.y - yShift, ff.radius * 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();

        // Draw Falling Leaves
        this.ctx.save();
        this.leaves.forEach(lf => {
            this.ctx.fillStyle = lf.color;
            // Draw tiny rectangular pixelated leaves
            this.ctx.fillRect(lf.x, lf.y - yShift, lf.size, lf.size);
        });
        this.ctx.restore();
    }

    drawWeatherEffects() {
        this.ctx.save();
        
        if (this.weather === 'rain' || this.weather === 'storm') {
            this.ctx.strokeStyle = 'rgba(174, 207, 238, 0.35)';
            this.ctx.lineWidth = 1.0;
            this.rainDrops.forEach(rd => {
                this.ctx.beginPath();
                this.ctx.moveTo(rd.x, rd.y);
                this.ctx.lineTo(rd.x + (this.wind * 0.25), rd.y + rd.length);
                this.ctx.stroke();
            });

            if (this.weather === 'storm' && Math.random() < 0.004) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.fillRect(0, 0, this.width, this.height);
                window.dispatchEvent(new CustomEvent('lightning'));
            }
        }

        if (this.weather === 'snow') {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.snowFlakes.forEach(sf => {
                this.ctx.beginPath();
                this.ctx.arc(sf.x, sf.y, sf.radius, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        if (this.weather === 'fog') {
            const fog = this.ctx.createLinearGradient(0, this.height * 0.4, 0, this.height);
            fog.addColorStop(0, 'rgba(240, 242, 250, 0)');
            fog.addColorStop(1, 'rgba(220, 222, 235, 0.4)');
            this.ctx.fillStyle = fog;
            this.ctx.fillRect(0, this.height * 0.4, this.width, this.height * 0.6);
        }

        this.ctx.restore();
    }

    drawCursorTrail() {
        if (this.glowTrail.length < 2) return;
        this.ctx.save();
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.glowTrail[0].x, this.glowTrail[0].y);
        for (let i = 1; i < this.glowTrail.length; i++) {
            const xc = (this.glowTrail[i].x + this.glowTrail[i-1].x) / 2;
            const yc = (this.glowTrail[i].y + this.glowTrail[i-1].y) / 2;
            this.ctx.quadraticCurveTo(this.glowTrail[i-1].x, this.glowTrail[i-1].y, xc, yc);
        }

        const trailGrad = this.ctx.createLinearGradient(this.mouseX, this.mouseY, this.glowTrail[0].x, this.glowTrail[0].y);
        trailGrad.addColorStop(0, 'rgba(16, 185, 129, 0.7)'); // green trail
        trailGrad.addColorStop(1, 'rgba(255, 107, 53, 0)');  // fades to warm orange
        
        this.ctx.strokeStyle = trailGrad;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        // Cursor head glow
        const glow = this.ctx.createRadialGradient(this.mouseX, this.mouseY, 0, this.mouseX, this.mouseY, 12);
        glow.addColorStop(0, '#fff');
        glow.addColorStop(0.3, 'rgba(16, 185, 129, 0.8)');
        glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(this.mouseX, this.mouseY, 12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// Instantiate ecosystem when DOM loads
window.addEventListener('DOMContentLoaded', () => {
    window.ecosystem = new LivingEcosystem('ambient-canvas');
});
