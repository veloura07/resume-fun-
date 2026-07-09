document.addEventListener('DOMContentLoaded', () => {
    // 1. Header Scroll Transition
    const header = document.querySelector('.site-header');
    
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run once in case user loads page already scrolled

    // 2. Parallax Camera Effect on Scroll
    const heroBg = document.querySelector('.hero-parallax-bg');
    
    window.addEventListener('scroll', () => {
        if (!heroBg) return;
        const scrolled = window.scrollY;
        // Limit parallax range to hero section
        if (scrolled < window.innerHeight) {
            const translateY = scrolled * 0.35;
            const scale = 1 + (scrolled * 0.0002);
            heroBg.style.transform = `translateY(${translateY}px) scale(${scale})`;
        }
    });

    // 3. 3D Card Hover Tilt Effect
    const notifContainer = document.querySelector('.hero-notif-container');
    const notifStack = document.querySelector('.hero-notif-stack');
    
    if (notifContainer && notifStack) {
        window.addEventListener('mousemove', (e) => {
            const x = e.clientX;
            const y = e.clientY;
            
            // Normalize coordinates (-1 to 1)
            const normX = (x / window.innerWidth) * 2 - 1;
            const normY = (y / window.innerHeight) * 2 - 1;
            
            // Adjust angles for perspective tilt
            const rotateY = -18 + (normX * 8); // Base rotation -18deg, offset by mouse
            const rotateX = 4 - (normY * 6);   // Base rotation 4deg, offset by mouse
            const rotateZ = 3 + (normX * 2);   // Base rotation 3deg, offset by mouse
            
            notifStack.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(0.92)`;
        });
    }

    // 4. Mobile Navigation Drawer
    const mobileMenuBtn = document.querySelector('.mobile-menu-toggle');
    const mobileDrawer = document.querySelector('.mobile-drawer-menu');
    const drawerOverlay = document.querySelector('.drawer-overlay');
    const drawerLinks = document.querySelectorAll('.drawer-link');
    
    if (mobileMenuBtn && mobileDrawer) {
        const toggleDrawer = () => {
            const isOpen = mobileDrawer.classList.toggle('active');
            mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            
            // Toggle lines transition
            const lines = mobileMenuBtn.querySelectorAll('span > span');
            if (isOpen) {
                lines[0].style.transform = 'translateY(5.5px) rotate(45deg)';
                lines[1].style.opacity = '0';
                lines[2].style.transform = 'translateY(-5.5px) rotate(-45deg)';
            } else {
                lines[0].style.transform = 'none';
                lines[1].style.opacity = '1';
                lines[2].style.transform = 'none';
            }
        };
        
        mobileMenuBtn.addEventListener('click', toggleDrawer);
        if (drawerOverlay) drawerOverlay.addEventListener('click', toggleDrawer);
        
        drawerLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileDrawer.classList.remove('active');
                const lines = mobileMenuBtn.querySelectorAll('span > span');
                lines[0].style.transform = 'none';
                lines[1].style.opacity = '1';
                lines[2].style.transform = 'none';
            });
        });
    }

    // 5. Living Notebook Navigation
    const pages = document.querySelectorAll('.notebook-page');
    const prevBtn = document.querySelector('.notebook-btn.prev');
    const nextBtn = document.querySelector('.notebook-btn.next');
    const indicator = document.querySelector('.notebook-page-indicator');
    let currentPageIndex = 0;
    
    const updateNotebook = () => {
        pages.forEach((p, idx) => {
            p.classList.remove('active');
            if (idx === currentPageIndex) p.classList.add('active');
        });
        if (indicator) {
            indicator.innerText = `${currentPageIndex + 1} / ${pages.length}`;
        }
    };
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentPageIndex = (currentPageIndex - 1 + pages.length) % pages.length;
            updateNotebook();
        });
        
        nextBtn.addEventListener('click', () => {
            currentPageIndex = (currentPageIndex + 1) % pages.length;
            updateNotebook();
        });
    }

    // 6. Interactive Command Terminal Shell
    const terminalCommands = {
        help: 'Available commands:\n  - about     Sreeshanth\'s engineering vision\n  - skills    Tools & languages in focus\n  - projects  Active production builds\n  - contact   How to reach out\n  - clear     Clear the screen',
        about: 'I\'m a Computer Science student and software engineer focusing on AI Systems engineering, distributed computing, and intelligent infrastructure from first principles. I aim to design developer tools that enable autonomous systems to scale safely.',
        skills: 'Programming: Python, TypeScript, C, C++, SQL, HTML, CSS. Currently learning Go and Rust.\nFrameworks: FastAPI, Node.js, Express, React, Next.js, Framer Motion.\nAI Systems: PyTorch, Transformers, LangGraph, CrewAI, Model Context Protocol (MCP).\nCloud/Infrastructure: Docker, Git, GitHub Actions, Redis, PostgreSQL, SQLite.',
        projects: 'Active Projects:\n  - VERI: AI runtime intelligence & policy enforcement platform.\n  - Project S: Multimodal collaboration interfaces.\n  - Solomon X: Local conversational workspace.\n  - Cognitive Desk Companion: Edge voice assistant hardware.',
        contact: 'Reach out to coordinate engineering projects:\n  - Email: sreeshanth.namireddy@outlook.com\n  - Location: Fire Country, Hidden Leaf (or local workstation)\n  - Github: github.com/sreeshanth-reddy'
    };

    // Card Terminal
    const terminalInput = document.getElementById('terminal-input-element');
    const terminalOutputContainer = document.querySelector('.terminal-output-container');
    const terminalBody = document.getElementById('workbench-terminal-body');

    if (terminalInput && terminalOutputContainer) {
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = terminalInput.value.trim().toLowerCase();
                terminalInput.value = '';

                // Create command line
                const cmdLine = document.createElement('div');
                cmdLine.innerHTML = `<span class="terminal-prompt">$</span> <span>${query}</span>`;
                terminalOutputContainer.appendChild(cmdLine);

                // Create result line
                const resLine = document.createElement('div');
                resLine.style.marginTop = '4px';
                resLine.style.marginBottom = '12px';
                resLine.style.whiteSpace = 'pre-wrap';

                if (query === 'clear') {
                    terminalOutputContainer.innerHTML = '';
                } else if (terminalCommands[query]) {
                    resLine.innerText = terminalCommands[query];
                    terminalOutputContainer.appendChild(resLine);
                } else if (query !== '') {
                    resLine.innerText = `Command not recognized: '${query}'. Type 'help' for options.`;
                    terminalOutputContainer.appendChild(resLine);
                }

                // Scroll to bottom
                if (terminalBody) {
                    terminalBody.scrollTop = terminalBody.scrollHeight;
                }
            }
        });
    }

    // Bottom Standalone Terminal
    const bottomInput = document.querySelector('.standalone-terminal-input');
    const bottomResult = document.querySelector('.standalone-terminal-result');
    const tags = document.querySelectorAll('.tag-cmd');

    const handleBottomCommand = (command) => {
        const query = command.trim().toLowerCase();
        if (query === 'clear') {
            bottomResult.innerText = '';
        } else if (terminalCommands[query]) {
            bottomResult.innerText = terminalCommands[query];
        } else if (query !== '') {
            bottomResult.innerText = `Command not recognized: '${query}'. Try 'projects', 'about', or 'contact'.`;
        }
    };

    if (bottomInput && bottomResult) {
        bottomInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleBottomCommand(bottomInput.value);
                bottomInput.value = '';
            }
        });
    }

    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            const cmd = tag.innerText.trim().toLowerCase();
            handleBottomCommand(cmd);
        });
    });
});
