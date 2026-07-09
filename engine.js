/**
 * THE LIVING DIGITAL ECOSYSTEM — Canvas Animation Engine (engine.js)
 * High-performance 2D Canvas rendering loop with multi-layer parallax, 
 * flocking algorithms, custom particle dynamics, weather generators, 
 * and scroll-driven camera panning.
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
        
        // Mouse Coordinate tracking
        this.mouseX = this.width / 2;
        this.mouseY = this.height / 2;
        this.targetMouseX = this.width / 2;
        this.targetMouseY = this.height / 2;
        this.mouseActive = false;
        
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
        this.ripples = [];
        
        // Landscape Profiles (height multipliers for mountain ranges)
        this.parallaxLayers = [
            { distance: 0.9, color: '', draw: (ctx, offset) => this.drawFarMountains(ctx, offset) },
            { distance: 0.7, color: '', draw: (ctx, offset) => this.drawMidHills(ctx, offset) },
            { distance: 0.5, color: '', draw: (ctx, offset) => this.drawNearForest(ctx, offset) },
            { distance: 0.3, color: '', draw: (ctx, offset) => this.drawRiverBase(ctx, offset) }
        ];

        // Init
        this.init();
        this.bindEvents();
        this.loop();
    }

    init() {
        // Setup initial clouds
        for (let i = 0; i < 6; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.4),
                size: Math.random() * 80 + 50,
                speed: Math.random() * 0.3 + 0.1,
                opacity: Math.random() * 0.15 + 0.05
            });
        }

        // Setup star field
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 1.2 + 0.4,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                phase: Math.random() * Math.PI
            });
        }

        // Setup Boids (Birds)
        for (let i = 0; i < 12; i++) {
            this.birds.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.4),
                vx: Math.random() * 1.5 + 1.0,
                vy: (Math.random() - 0.5) * 0.5,
                wingPhase: Math.random() * Math.PI,
                size: Math.random() * 3 + 2
            });
        }

        // Setup Butterflies
        for (let i = 0; i < 6; i++) {
            this.butterflies.push({
                x: Math.random() * this.width,
                y: this.height - 150 - Math.random() * 100,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2,
                color: `hsl(${Math.random() * 40 + 190}, 85%, 65%)`,
                size: Math.random() * 2 + 2,
                phase: Math.random() * Math.PI
            });
        }

        // Setup pollen / fireflies
        for (let i = 0; i < 20; i++) {
            this.fireflies.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                radius: Math.random() * 2 + 1,
                alpha: Math.random(),
                pulseSpeed: Math.random() * 0.05 + 0.02
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
            
            // Add a ripple in river biome
            if (this.activeBiome === 'river' && Math.random() < 0.1) {
                this.createRipple(e.clientX, e.clientY);
            }
        });

        window.addEventListener('mouseleave', () => {
            this.mouseActive = false;
        });
    }

    updateActiveBiome() {
        const biomes = ['forest', 'river', 'mountain', 'sky', 'universe', 'cosmos'];
        const segment = 1 / biomes.length;
        const index = Math.min(Math.floor(this.scrollPercent / segment), biomes.length - 1);
        const nextBiome = biomes[index];
        
        if (nextBiome !== this.activeBiome) {
            this.activeBiome = nextBiome;
            
            // Dispatch biome change event for script.js integrations
            window.dispatchEvent(new CustomEvent('biomechange', { detail: { biome: nextBiome } }));
            
            // Auto adjust targets based on biomes
            if (nextBiome === 'universe') {
                this.targetTimeOfDay = 0.0; // Night for universe
                this.targetWind = 0.5;
            } else if (nextBiome === 'river') {
                this.targetTimeOfDay = 0.5; // Noon daylight for river
                this.targetWind = 0.8;
            } else if (nextBiome === 'cosmos') {
                this.targetTimeOfDay = 0.05; // Deep starry twilight
                this.targetWind = 1.5;
            } else if (nextBiome === 'forest') {
                this.targetTimeOfDay = 0.25; // Morning sunrise
                this.targetWind = 1.2;
            } else if (nextBiome === 'mountain') {
                this.targetTimeOfDay = 0.75; // Sunset Golden hour
                this.targetWind = 2.5; // Blustery peak wind
            }
        }
    }

    createRipple(x, y) {
        if (this.ripples.length > 10) this.ripples.shift();
        this.ripples.push({
            x,
            y,
            radius: 2,
            maxRadius: Math.random() * 60 + 30,
            opacity: 0.5,
            speed: Math.random() * 1.5 + 0.8
        });
    }

    // Set time of day manually
    setTimeOfDay(timeVal) {
        this.targetTimeOfDay = timeVal;
    }

    // Set weather manually
    setWeather(weatherName) {
        this.weather = weatherName;
    }

    // Smoothly interpolate sky colors depending on time of day
    getSkyColors() {
        const t = this.timeOfDay;
        let skyTop = '#080810';
        let skyBottom = '#05050c';

        if (t >= 0.15 && t < 0.35) { // Morning transition
            const ratio = (t - 0.15) / 0.2;
            skyTop = this.lerpColor('#090c1f', '#2a5a9e', ratio);
            skyBottom = this.lerpColor('#05050c', '#e28f6b', ratio);
        } else if (t >= 0.35 && t < 0.65) { // Noon daylight
            const ratio = (t - 0.35) / 0.3;
            skyTop = this.lerpColor('#2a5a9e', '#1976d2', ratio);
            skyBottom = this.lerpColor('#e28f6b', '#82b1ff', ratio);
        } else if (t >= 0.65 && t < 0.85) { // Sunset golden hour
            const ratio = (t - 0.65) / 0.2;
            skyTop = this.lerpColor('#1976d2', '#21183c', ratio);
            skyBottom = this.lerpColor('#82b1ff', '#e65100', ratio);
        } else { // Nighttime
            let ratio = 0;
            if (t >= 0.85) ratio = (t - 0.85) / 0.15;
            else ratio = t / 0.15;
            skyTop = this.lerpColor('#21183c', '#080810', ratio);
            skyBottom = this.lerpColor('#e65100', '#05050c', ratio);
        }

        return { top: skyTop, bottom: skyBottom };
    }

    lerpColor(c1, c2, r) {
        // Simple hex color interpolator
        const parseHex = (c) => {
            const h = c.replace('#', '');
            return {
                r: parseInt(h.substring(0, 2), 16),
                g: parseInt(h.substring(2, 4), 16),
                b: parseInt(h.substring(4, 6), 16)
            };
        };
        const rgb1 = parseHex(c1);
        const rgb2 = parseHex(c2);
        const resR = Math.round(rgb1.r + (rgb2.r - rgb1.r) * r);
        const resG = Math.round(rgb1.g + (rgb2.g - rgb1.g) * r);
        const resB = Math.round(rgb1.b + (rgb2.b - rgb1.b) * r);
        return `rgb(${resR}, ${resG}, ${resB})`;
    }

    update() {
        // Interpolate time of day and wind
        this.timeOfDay += (this.targetTimeOfDay - this.timeOfDay) * 0.05;
        this.wind += (this.targetWind - this.wind) * 0.02;

        // Smooth cursor follow
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.1;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.1;

        // Update cursor glow trail
        if (this.mouseActive) {
            this.glowTrail.push({ x: this.mouseX, y: this.mouseY, life: 1.0 });
        }
        this.glowTrail.forEach(t => t.life -= 0.04);
        this.glowTrail = this.glowTrail.filter(t => t.life > 0);

        // Update clouds
        this.clouds.forEach(c => {
            c.x += c.speed * this.wind;
            if (c.x > this.width + 200) {
                c.x = -200;
                c.y = Math.random() * (this.height * 0.4);
            }
        });

        // Update Boids (Birds)
        this.birds.forEach(b => {
            b.x += b.vx * (this.wind * 0.5 + 0.5);
            b.y += b.vy + Math.sin(b.wingPhase) * 0.2;
            b.wingPhase += 0.18;
            if (b.x > this.width + 50) {
                b.x = -50;
                b.y = Math.random() * (this.height * 0.4);
            }
        });

        // Update butterflies
        this.butterflies.forEach(bf => {
            bf.phase += 0.08;
            bf.x += bf.vx + Math.sin(bf.phase) * 0.4;
            bf.y += bf.vy + Math.cos(bf.phase) * 0.4;

            // Simple cursor flocking
            if (this.mouseActive) {
                const dx = this.mouseX - bf.x;
                const dy = this.mouseY - bf.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    // Flee from cursor if too close
                    bf.vx -= (dx / dist) * 0.15;
                    bf.vy -= (dy / dist) * 0.15;
                } else if (dist < 300) {
                    // Attract to cursor
                    bf.vx += (dx / dist) * 0.05;
                    bf.vy += (dy / dist) * 0.05;
                }
            }

            // Cap velocities
            bf.vx = Math.max(Math.min(bf.vx, 1.5), -1.5);
            bf.vy = Math.max(Math.min(bf.vy, 1.5), -1.5);

            // Bounds containment
            if (bf.x < 50) bf.vx += 0.1;
            if (bf.x > this.width - 50) bf.vx -= 0.1;
            if (bf.y < this.height * 0.5) bf.vy += 0.1;
            if (bf.y > this.height - 50) bf.vy -= 0.1;
        });

        // Update fireflies
        this.fireflies.forEach(ff => {
            ff.x += ff.vx;
            ff.y += ff.vy;
            ff.alpha += ff.pulseSpeed;
            if (ff.x < 0 || ff.x > this.width) ff.vx *= -1;
            if (ff.y < 0 || ff.y > this.height) ff.vy *= -1;
        });

        // Update ripples
        this.ripples.forEach(rp => {
            rp.radius += rp.speed;
            rp.opacity = (1 - rp.radius / rp.maxRadius) * 0.5;
        });
        this.ripples = this.ripples.filter(rp => rp.radius < rp.maxRadius);

        // Update weather elements
        this.updateWeather();
    }

    updateWeather() {
        if (this.weather === 'rain' || this.weather === 'storm') {
            if (this.rainDrops.length < 120) {
                this.rainDrops.push({
                    x: Math.random() * this.width,
                    y: -20,
                    length: Math.random() * 20 + 15,
                    speed: Math.random() * 8 + 12
                });
            }
        }
        this.rainDrops.forEach(rd => {
            rd.y += rd.speed;
            rd.x += (this.wind * 0.8);
            if (rd.y > this.height) {
                rd.y = -20;
                rd.x = Math.random() * this.width;
            }
        });

        if (this.weather === 'snow') {
            if (this.snowFlakes.length < 80) {
                this.snowFlakes.push({
                    x: Math.random() * this.width,
                    y: -10,
                    radius: Math.random() * 2 + 1,
                    speed: Math.random() * 1 + 0.8,
                    drift: Math.random() * 0.5 - 0.25
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

    draw() {
        // 1. Draw dynamic sky background
        const skyColors = this.getSkyColors();
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, skyColors.top);
        grad.addColorStop(1, skyColors.bottom);
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 2. Draw starry night layer (if dark enough)
        if (this.timeOfDay < 0.25 || this.timeOfDay > 0.75) {
            const alpha = this.timeOfDay < 0.15 || this.timeOfDay > 0.85 ? 1.0 : 0.5;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.stars.forEach(st => {
                const twinkleVal = Math.sin(Date.now() * st.twinkleSpeed + st.phase) * 0.35 + 0.65;
                this.ctx.beginPath();
                this.ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${twinkleVal})`;
                this.ctx.fill();
            });
            this.ctx.restore();
        }

        // 3. Draw Celestial bodies
        this.drawCelestialBodies();

        // 4. Draw clouds
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

        // 5. Render parallax layers with scroll camera offsets
        // Universe biome pans the view straight up to the sky
        let verticalOffset = 0;
        if (this.activeBiome === 'universe') {
            verticalOffset = this.height * 0.45;
        } else if (this.activeBiome === 'cosmos') {
            verticalOffset = this.height * 0.2;
        } else if (this.activeBiome === 'sky') {
            verticalOffset = this.height * 0.3;
        } else if (this.activeBiome === 'river') {
            verticalOffset = -this.height * 0.08;
        }

        this.parallaxLayers.forEach(layer => {
            const scrollShift = this.scrollPercent * 180 * layer.distance;
            this.ctx.save();
            layer.draw(this.ctx, scrollShift + verticalOffset);
            this.ctx.restore();
        });

        // 6. Draw Fauna (flocking birds & butterflies)
        this.drawFauna();

        // 7. Draw Weather Effects overlay
        this.drawWeatherEffects();

        // 8. Draw Cursor firefly trail
        this.drawCursorTrail();
    }

    drawCelestialBodies() {
        const t = this.timeOfDay;
        this.ctx.save();

        if (t > 0.2 && t < 0.8) { // Sun is up
            const sunY = this.height * 0.5 - Math.sin((t - 0.2) / 0.6 * Math.PI) * (this.height * 0.35);
            const sunX = this.width * 0.3 + (t - 0.2) * (this.width * 0.4);

            // Sun glow rings
            const radialGrad = this.ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 90);
            radialGrad.addColorStop(0, 'rgba(255, 255, 230, 0.95)');
            radialGrad.addColorStop(0.2, 'rgba(255, 220, 100, 0.45)');
            radialGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');

            this.ctx.fillStyle = radialGrad;
            this.ctx.beginPath();
            this.ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
            this.ctx.fill();
        } else { // Moon is up
            // Normalized moon phase timing
            let ratio = 0;
            if (t >= 0.8) ratio = (t - 0.8) / 0.4;
            else ratio = (t + 0.2) / 0.4;

            const moonY = this.height * 0.45 - Math.sin(ratio * Math.PI) * (this.height * 0.3);
            const moonX = this.width * 0.7 - ratio * (this.width * 0.3);

            // Moon halo
            const radialGrad = this.ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 70);
            radialGrad.addColorStop(0, 'rgba(235, 245, 255, 0.9)');
            radialGrad.addColorStop(0.3, 'rgba(150, 200, 255, 0.25)');
            radialGrad.addColorStop(1, 'rgba(100, 150, 255, 0)');

            this.ctx.fillStyle = radialGrad;
            this.ctx.beginPath();
            this.ctx.arc(moonX, moonY, 70, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawFarMountains(ctx, offset) {
        // Far mountain silhouettes
        const fillStyle = this.activeBiome === 'universe' ? 'rgba(5, 5, 12, 0.9)' : 'rgba(15, 15, 28, 0.8)';
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        
        const baseHeight = this.height * 0.6 + offset;
        ctx.lineTo(0, baseHeight);
        ctx.bezierCurveTo(this.width * 0.2, baseHeight - 90, this.width * 0.4, baseHeight + 50, this.width * 0.5, baseHeight - 30);
        ctx.bezierCurveTo(this.width * 0.65, baseHeight - 90, this.width * 0.8, baseHeight - 10, this.width, baseHeight - 60);
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        ctx.fill();
    }

    drawMidHills(ctx, offset) {
        const fillStyle = this.activeBiome === 'universe' ? 'rgba(8, 8, 18, 0.95)' : 'rgba(25, 30, 48, 0.85)';
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        
        const baseHeight = this.height * 0.7 + offset;
        ctx.lineTo(0, baseHeight);
        ctx.bezierCurveTo(this.width * 0.25, baseHeight - 60, this.width * 0.5, baseHeight + 30, this.width * 0.65, baseHeight - 40);
        ctx.bezierCurveTo(this.width * 0.8, baseHeight - 80, this.width * 0.9, baseHeight - 20, this.width, baseHeight - 50);
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        ctx.fill();
    }

    drawNearForest(ctx, offset) {
        // Render tree cluster outlines on hills
        const fillStyle = this.activeBiome === 'universe' ? 'rgba(10, 10, 22, 1)' : 'rgba(15, 25, 20, 0.95)';
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        
        const baseHeight = this.height * 0.8 + offset;
        ctx.lineTo(0, baseHeight);
        
        // Loop to create jagged forest canopy look
        for (let x = 0; x <= this.width; x += 40) {
            const sway = Math.sin(Date.now() * 0.001 + x) * 2;
            const h = baseHeight - 30 - Math.sin(x * 0.01) * 35 + sway;
            ctx.lineTo(x, h);
            ctx.lineTo(x + 20, h - 10 + sway);
        }
        
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        ctx.fill();
    }

    drawRiverBase(ctx, offset) {
        // River biome water level
        const baseHeight = this.height * 0.88 + offset;
        
        // Water surface
        const grad = ctx.createLinearGradient(0, baseHeight, 0, this.height);
        if (this.activeBiome === 'universe') {
            grad.addColorStop(0, 'rgba(5, 10, 22, 0.95)');
            grad.addColorStop(1, '#020204');
        } else {
            grad.addColorStop(0, 'rgba(25, 45, 75, 0.8)');
            grad.addColorStop(1, 'rgba(10, 20, 40, 0.95)');
        }
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        ctx.lineTo(0, baseHeight);
        
        // Swaying water surface wave
        const wavePhase = Date.now() * 0.0012;
        for (let x = 0; x <= this.width; x += 50) {
            const y = baseHeight + Math.sin(x * 0.005 + wavePhase) * 4;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        ctx.fill();

        // Render water ripples
        this.ripples.forEach(rp => {
            ctx.beginPath();
            ctx.ellipse(rp.x, rp.y + offset * 0.1, rp.radius, rp.radius * 0.25, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(200, 230, 255, ${rp.opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }

    drawFauna() {
        this.ctx.save();
        
        // Draw birds as standard dynamic V vector shapes
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.lineWidth = 1.5;
        this.birds.forEach(b => {
            const hShift = Math.sin(b.wingPhase) * b.size;
            this.ctx.beginPath();
            this.ctx.moveTo(b.x - b.size * 2, b.y - hShift);
            this.ctx.lineTo(b.x, b.y);
            this.ctx.lineTo(b.x + b.size * 2, b.y - hShift);
            this.ctx.stroke();
        });

        // Draw butterflies
        this.butterflies.forEach(bf => {
            this.ctx.fillStyle = bf.color;
            this.ctx.save();
            this.ctx.translate(bf.x, bf.y);
            
            // Flutter wing scale
            const wingScale = Math.abs(Math.sin(bf.phase * 2)) * 0.8 + 0.2;
            
            // Left wing
            this.ctx.beginPath();
            this.ctx.ellipse(-3, 0, bf.size, bf.size * 1.5 * wingScale, -Math.PI/6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Right wing
            this.ctx.beginPath();
            this.ctx.ellipse(3, 0, bf.size, bf.size * 1.5 * wingScale, Math.PI/6, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });

        // Draw ambient fireflies / pollen
        this.fireflies.forEach(ff => {
            const alpha = Math.abs(Math.sin(ff.alpha)) * 0.6 + 0.1;
            const glow = this.ctx.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, ff.radius * 4);
            glow.addColorStop(0, `rgba(255, 230, 120, ${alpha})`);
            glow.addColorStop(1, 'rgba(255, 230, 120, 0)');
            
            this.ctx.fillStyle = glow;
            this.ctx.beginPath();
            this.ctx.arc(ff.x, ff.y, ff.radius * 4, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.restore();
    }

    drawWeatherEffects() {
        this.ctx.save();
        
        if (this.weather === 'rain' || this.weather === 'storm') {
            this.ctx.strokeStyle = 'rgba(156, 180, 204, 0.4)';
            this.ctx.lineWidth = 1.0;
            this.rainDrops.forEach(rd => {
                this.ctx.beginPath();
                this.ctx.moveTo(rd.x, rd.y);
                this.ctx.lineTo(rd.x + (this.wind * 0.3), rd.y + rd.length);
                this.ctx.stroke();
            });

            // Random lightning flash in storm mode
            if (this.weather === 'storm' && Math.random() < 0.005) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.fillRect(0, 0, this.width, this.height);
                
                // Dispatch thunder event for script.js Web Audio integration
                window.dispatchEvent(new CustomEvent('lightning'));
            }
        }

        if (this.weather === 'snow') {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
            this.snowFlakes.forEach(sf => {
                this.ctx.beginPath();
                this.ctx.arc(sf.x, sf.y, sf.radius, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        if (this.weather === 'fog') {
            const fogGrad = this.ctx.createLinearGradient(0, this.height * 0.4, 0, this.height);
            fogGrad.addColorStop(0, 'rgba(250, 250, 252, 0)');
            fogGrad.addColorStop(1, 'rgba(230, 232, 240, 0.45)');
            this.ctx.fillStyle = fogGrad;
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

        // Color trail blue-pink neon gradient
        const trailGrad = this.ctx.createLinearGradient(this.mouseX, this.mouseY, this.glowTrail[0].x, this.glowTrail[0].y);
        trailGrad.addColorStop(0, 'rgba(0, 240, 255, 0.8)');
        trailGrad.addColorStop(1, 'rgba(255, 0, 127, 0)');
        
        this.ctx.strokeStyle = trailGrad;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        // Draw light fairy head
        const glow = this.ctx.createRadialGradient(this.mouseX, this.mouseY, 0, this.mouseX, this.mouseY, 15);
        glow.addColorStop(0, '#fff');
        glow.addColorStop(0.3, 'rgba(0, 240, 255, 0.8)');
        glow.addColorStop(1, 'rgba(0, 240, 255, 0)');
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(this.mouseX, this.mouseY, 15, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// Instantiate engine when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.ecosystem = new LivingEcosystem('ambient-canvas');
});
