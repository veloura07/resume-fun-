/**
 * THE LIVING DIGITAL ECOSYSTEM — Interactivity & Audio Synthesis Engine (script.js)
 * Implements Anime.js scroll/click animations, Web Audio API sound generator, 
 * compass needle tracking, and terminal console interpreters.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Anime.js Preloader Sequence
    const preloader = document.getElementById('preloader');
    if (preloader) {
        const tl = anime.timeline({
            easing: 'easeInOutQuad',
            complete: () => {
                preloader.style.display = 'none';
            }
        });

        tl.add({
            targets: '.logo-animation .bracket',
            opacity: [0, 1],
            translateX: [-20, 0],
            duration: 800,
            delay: anime.stagger(150)
        })
        .add({
            targets: '.logo-animation .dot',
            scale: [0, 1.2, 1],
            opacity: [0, 1],
            duration: 500
        }, '-=300')
        .add({
            targets: '.loader-text',
            opacity: [0, 1],
            letterSpacing: ['0.05em', '0.15em'],
            duration: 1000
        }, '-=200')
        .add({
            targets: '#preloader',
            translateY: '-100vh',
            duration: 800,
            easing: 'easeInQuart',
            delay: 400
        });
    }

    // 2. Web Audio API Procedural Synthesizer (Zero asset dependency wind, rain & storm sounds)
    let audioCtx = null;
    let masterGain = null;
    let windNode = null;
    let rainNode = null;
    let insectNode = null;
    let isMuted = true;

    const initAudioEngine = () => {
        if (audioCtx) return;
        
        // Setup Audio Context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        
        // Master volume control
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(isMuted ? 0 : 0.4, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);

        // A. Synthesize wind (filtered white noise)
        windNode = createWindGenerator();
        if (windNode) windNode.connect(masterGain);

        // B. Synthesize rain / water (bandpass noise)
        rainNode = createRainGenerator();
        if (rainNode) rainNode.connect(masterGain);

        // C. Synthesize night insects (high oscillators)
        insectNode = createInsectGenerator();
        if (insectNode) insectNode.connect(masterGain);
    };

    // Helper to generate white noise buffer
    const createNoiseBuffer = () => {
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return noiseBuffer;
    };

    const createWindGenerator = () => {
        const noise = audioCtx.createBufferSource();
        noise.buffer = createNoiseBuffer();
        noise.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, audioCtx.currentTime);
        filter.Q.setValueAtTime(3.0, audioCtx.currentTime);

        const osc = audioCtx.createOscillator();
        osc.frequency.setValueAtTime(0.08, audioCtx.currentTime); // slow gust cycle
        
        const oscGain = audioCtx.createGain();
        oscGain.gain.setValueAtTime(180, audioCtx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(filter.frequency);
        noise.connect(filter);

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        filter.connect(gainNode);

        noise.start(0);
        osc.start(0);

        return gainNode;
    };

    const createRainGenerator = () => {
        const noise = audioCtx.createBufferSource();
        noise.buffer = createNoiseBuffer();
        noise.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
        filter.Q.setValueAtTime(1.0, audioCtx.currentTime);

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        
        noise.connect(filter);
        filter.connect(gainNode);
        
        noise.start(0);
        return gainNode;
    };

    const createInsectGenerator = () => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(6000, audioCtx.currentTime);

        const mod = audioCtx.createOscillator();
        mod.frequency.setValueAtTime(8, audioCtx.currentTime); // 8Hz chirp pulses

        const modGain = audioCtx.createGain();
        modGain.gain.setValueAtTime(15, audioCtx.currentTime);

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);

        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(gainNode);

        osc.start(0);
        mod.start(0);

        return gainNode;
    };

    // Synthesis of Thunder during lightning
    const triggerThunder = () => {
        if (!audioCtx || isMuted) return;
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = createNoiseBuffer();

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(80, audioCtx.currentTime); // deep rumble

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 3.0);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(masterGain);

        noise.start(0);
        noise.stop(audioCtx.currentTime + 3.2);
    };

    window.addEventListener('lightning', () => {
        triggerThunder();
    });

    // 3. HUD Controls Interaction handlers
    const weatherButtons = document.querySelectorAll('#weather-widget button');
    const timeSlider = document.getElementById('time-slider');
    const muteToggle = document.getElementById('mute-toggle');
    const volumeSlider = document.getElementById('volume-slider');

    weatherButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            initAudioEngine();
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            weatherButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const weatherMode = btn.getAttribute('data-weather');
            if (window.ecosystem) {
                window.ecosystem.setWeather(weatherMode);
            }

            // Adjust synthetic audio levels based on weather
            if (rainNode) {
                if (weatherMode === 'rain') {
                    rainNode.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 1.5);
                } else if (weatherMode === 'storm') {
                    rainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 1.0);
                } else {
                    rainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2.0);
                }
            }
        });
    });

    if (timeSlider) {
        timeSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (window.ecosystem) {
                window.ecosystem.setTimeOfDay(val);
            }
            
            if (insectNode) {
                const isNight = val < 0.2 || val > 0.8;
                const targetVolume = isNight ? 0.015 : 0;
                insectNode.gain.linearRampToValueAtTime(targetVolume, audioCtx.currentTime + 1.5);
            }
        });
    }

    if (muteToggle) {
        muteToggle.addEventListener('click', () => {
            initAudioEngine();
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            isMuted = !isMuted;
            if (isMuted) {
                muteToggle.innerText = '🔇';
                if (masterGain) masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
            } else {
                muteToggle.innerText = '🔊';
                const vol = volumeSlider ? parseFloat(volumeSlider.value) : 0.5;
                if (masterGain) masterGain.gain.linearRampToValueAtTime(vol * 0.5, audioCtx.currentTime + 0.3);
            }
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            initAudioEngine();
            const vol = parseFloat(e.target.value);
            if (!isMuted && masterGain) {
                masterGain.gain.linearRampToValueAtTime(vol * 0.5, audioCtx.currentTime + 0.1);
            }
        });
    }

    // 4. Sitting Park Bench Reflection (Anime.js card reveals)
    const dialogCard = document.getElementById('bench-dialog-card');
    const closeDialogBtn = document.getElementById('close-bench-dialog');

    window.addEventListener('sitonbench', () => {
        if (!dialogCard) return;
        
        // Show dialogue card with Anime.js bounce transition
        dialogCard.classList.add('visible');
        anime.remove(dialogCard);
        
        anime({
            targets: dialogCard,
            translateY: [30, 0],
            opacity: [0, 1],
            scale: [0.95, 1],
            duration: 800,
            easing: 'easeOutElastic(1, .6)'
        });
    });

    if (closeDialogBtn && dialogCard) {
        closeDialogBtn.addEventListener('click', () => {
            anime.remove(dialogCard);
            anime({
                targets: dialogCard,
                translateY: 30,
                opacity: 0,
                scale: 0.95,
                duration: 400,
                easing: 'easeInQuad',
                complete: () => {
                    dialogCard.classList.remove('visible');
                }
            });
        });
    }

    // 5. Curiosity Compass Navigation Rotation using Anime.js
    const compass = document.getElementById('curiosity-compass');
    const compassLabels = document.querySelectorAll('.compass-label');
    const pointer = document.querySelector('.compass-pointer');
    const biomeSections = document.querySelectorAll('.biome-section');
    let lastAngle = 0;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            compass.classList.add('visible');
        } else {
            compass.classList.remove('visible');
        }

        let currentBiome = 'hero';
        biomeSections.forEach(section => {
            const top = section.offsetTop;
            if (window.scrollY >= (top - 260)) {
                currentBiome = section.getAttribute('id');
            }
        });

        let targetAngle = 0;
        if (currentBiome === 'hero' || currentBiome === 'river') {
            targetAngle = 0;
        } else if (currentBiome === 'mountain') {
            targetAngle = 90;
        } else if (currentBiome === 'cosmos') {
            targetAngle = 180;
        } else if (currentBiome === 'sky' || currentBiome === 'universe') {
            targetAngle = 270;
        }

        if (targetAngle !== lastAngle) {
            lastAngle = targetAngle;
            anime.remove(pointer);
            anime({
                targets: pointer,
                rotate: targetAngle,
                duration: 1200,
                easing: 'easeOutElastic(1, .7)'
            });
        }
    });

    // Compass navigation click events
    compassLabels.forEach(label => {
        label.addEventListener('click', () => {
            const targetId = label.getAttribute('data-target');
            const targetSec = document.getElementById(targetId);
            if (targetSec) {
                window.scrollTo({
                    top: targetSec.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 6. Interactive Ecosystem Terminal Interpreter (Staggered Typewriter Reveal)
    const terminalInput = document.querySelector('.standalone-terminal-input');
    const terminalResult = document.querySelector('.standalone-terminal-result');
    const cmdTags = document.querySelectorAll('.tag-cmd');

    const coreCommands = {
        help: 'Coordinates:\n  - about     Explore Sreeshanth\'s systems engineering vision\n  - skills    Review programming stacks & infrastructures\n  - projects  Peak projects (VERI, Project S, Solomon X, CDC)\n  - contact   Social coordinates & email\n  - clear     Wipe screen',
        about: 'I am a Computer Science student and Systems Engineer focused on understanding and building intelligent AI infrastructure from first principles.\nInterests: AI Systems, Microservices, Distributed Systems, Compiler internals, and Kernel schedulers.',
        skills: 'Programming: Python, TypeScript, C, C++, SQL. Currently learning Go and Rust.\nAI/Runtimes: PyTorch, Transformers, LangGraph, Vector Databases, Model Context Protocol (MCP).\nInfrastructure: Docker, Git, CI/CD pipelines, Linux systems administration, Redis.',
        projects: 'Active Peaks:\n  - VERI: AI runtime governance and execution tracing platform.\n  - Project S: Multimodal adaptive memory workspace interaction platform.\n  - Solomon X: Local conversational workstation file system manager.\n  - Cognitive Desk Companion: Edge voice assistant hardware.',
        contact: 'Email: sreeshanth.namireddy@outlook.com\nGithub: github.com/sreeshanth-reddy\nTitle: AI Systems Engineer & Infrastructure Explorer'
    };

    const processTerminalCommand = (text) => {
        const query = text.trim().toLowerCase();
        if (query === 'clear') {
            terminalResult.innerHTML = '';
        } else if (coreCommands[query]) {
            typewriterStagger(coreCommands[query]);
        } else if (query !== '') {
            typewriterStagger(`Command not recognized: '${query}'. Type 'help' to review coordinates.`);
        }
    };

    // Stagger character animations using Anime.js
    const typewriterStagger = (outputString) => {
        terminalResult.innerHTML = '';
        const lines = outputString.split('\n');
        
        lines.forEach((line, lineIdx) => {
            const lineDiv = document.createElement('div');
            lineDiv.style.minHeight = '1.2rem';
            
            // Wrap each char in span for anime stagger target
            line.split('').forEach(char => {
                const charSpan = document.createElement('span');
                charSpan.style.opacity = '0';
                charSpan.innerText = char;
                lineDiv.appendChild(charSpan);
            });
            
            terminalResult.appendChild(lineDiv);
            
            anime({
                targets: lineDiv.querySelectorAll('span'),
                opacity: [0, 1],
                duration: 200,
                delay: anime.stagger(15),
                easing: 'easeOutQuad'
            });
        });
    };

    if (terminalInput) {
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                processTerminalCommand(terminalInput.value);
                terminalInput.value = '';
            }
        });
    }

    if (cmdTags) {
        cmdTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const cmd = tag.innerText.trim().toLowerCase();
                processTerminalCommand(cmd);
            });
        });
    }

    // 7. Scroll Reveal Animation Triggers (Staggered Obsidian Card reveals)
    const animElements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
                
                // If it is mountain card, stagger slide in the tech badges!
                if (entry.target.classList.contains('peak-card')) {
                    anime({
                        targets: entry.target.querySelectorAll('.peak-tech span'),
                        opacity: [0, 1],
                        translateY: [10, 0],
                        duration: 600,
                        delay: anime.stagger(80),
                        easing: 'easeOutQuad'
                    });
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    animElements.forEach(el => observer.observe(el));
});
