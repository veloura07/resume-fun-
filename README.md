# 🍥 Ichiraku Ramen — Immersive Naruto Landing Page

An interactive, high-fidelity landing page for a Naruto-themed ramen shop featuring a dynamic nature landscape hero background, custom animations, stats counters, 3D cursor-tracking card hover, and responsive design.

## 🚀 Features

- **Animated Hero Section**: Integrates your custom generated nature background with a smooth Ken Burns pan-and-zoom animation, twinkling stars, fireflies, and a glowing moon.
- **Ramen Shop Gallery**: Includes your exact Naruto ramen shop interior image wrapped in custom-designed corner accents and cyberpunk scanning animations with 3D cursor tilt effects.
- **Floating Sakura Particles**: Programmatic falling cherry blossom petals drift across the screen.
- **Auto-Counter Stats**: Counts up serving numbers dynamically as you scroll down.
- **Reservation Submission**: Special celebration animations when the booking form is successfully filled.
- **Deploy Ready**: Configured with a fallback asset loader so it works natively on local preview and GitHub Pages.

---

## 🛠️ Setup & Local Hosting

### 1. Copy Image Assets Locally
To make this repository fully self-contained, open the Jupyter Notebook [run_server.ipynb](run_server.ipynb) and run the Python cell. This automatically copies the images from the workspace cache to the local `assets/` folder.

> **Note**: Even if you don't run the script, the website has built-in JavaScript fallbacks that will automatically display the correct images in your browser from local absolute caches!

### 2. View Locally
Double-click `index.html` to open it in your browser.

---

## 🌐 Deploy to GitHub Pages

This repository is pre-configured with a GitHub Actions workflow to publish automatically:

1. **Initialize Git and Commit**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Ichiraku Ramen page"
   ```

2. **Push to GitHub**:
   Create a repository on GitHub and link it:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repository settings on GitHub.
   - Go to the **Pages** tab.
   - Under **Build and deployment > Source**, select **GitHub Actions** (the workflow will deploy automatically on every push to `main`!).
