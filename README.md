## Flame Jumper

<img src="./src/assets/images/fj.gif">

**Game Description:**

Welcome to a thrilling browser game, you control a brave person, trying to escape the apocalypse.

Your mission is to flee from the end of the world by jumping over fiery meteors that fall from the sky like the wrath of heaven itself and collect points. Each jump is a step towards salvation, each obstacle a test of your agility and reaction.

**🎮 Game Features:**
- **Unique Design:** Inspired by the famous dino from Google Chrome's offline mode, but with a new, apocalyptic twist.
- **Dynamic Obstacles:** Small, wide, tall and double meteors on the ground, plus low and high flying meteors. Duck under the low ones and never jump under the high ones.
- **Smooth Difficulty:** The world speeds up with every point, and the scenery changes as you reach new milestones.
- **Game Feel:** Squash and stretch animation, dust and sparks, screen shake and hit-stop on impact, parallax layers.
- **Daily Challenge:** Every day has its own seeded obstacle course shared by all players, with a separate daily best.
- **Achievements:** Nine awards from the first run to ducking under five meteors in a single run.
- **Survival Challenge:** How long can you last in this blazing world?

**🛠 Technologies:**
- **HTML5**
- **CSS3**
- **JavaScript (ES modules)**
- **Canvas API**
- **Web Audio API** for synthesized sound effects
- **Vite** for dev server and build, **Vitest** for tests, **ESLint** for linting
- **PWA:** installable, works offline through a service worker
- **GitHub Actions** for CI and deployment to GitHub Pages

**🚀 Functionality:**

- ✅ Endless runner with frame-rate independent physics
- ✅ Variable jump height: tap for a short hop, hold for a high jump
- ✅ Ducking and fast fall
- ✅ Six obstacle types with fair hitboxes
- ✅ Four visual levels with crossfade backgrounds and procedural parallax
- ✅ Three playable characters
- ✅ Particles, screen shake, hit-stop, floating score and level flashes
- ✅ Pause, including automatic pause when the tab is hidden
- ✅ Best score, daily best, recent runs and achievements saved in localStorage
- ✅ Sound effects with mute toggle
- ✅ Respects `prefers-reduced-motion`
- ✅ Works on touch devices: the canvas scales to the screen, tap to jump, swipe down to duck

**🕹️ Controls:**
- **Space / ↑ / W / Tap** - jump (hold for a higher jump)
- **↓ / S / Swipe down** - duck, or fast fall while in the air
- **Enter** - start / restart
- **↑ ↓** - navigate menus, **Esc** - back
- **Esc / P** - pause
- **M** - mute sound
- **S** - stats, **A** - achievements, **C** - change character (on the game over screen)

**💻 Development:**

```bash
npm install
npm run dev      # dev server
npm test         # unit tests
npm run lint     # eslint
npm run build    # production build in dist/
```

Pushes to `main` run lint, tests and build in GitHub Actions and deploy `dist/` to GitHub Pages. For the deploy job to work, set the repository's Pages source to **GitHub Actions** (Settings → Pages → Build and deployment). The `npm run deploy` script still publishes manually through the `gh-pages` branch if you prefer that.

Play to find out how far you can run from the flames of doomsday. Courage, reflexes, and a bit of luck are what you need for salvation!

*Let's start this fiery adventure!*

---

## 📜 Author

👨‍💻 **Developer:** Dimitri Jmukhadze
📩 **Contact:** [jmukhadze.dimitri@gmail.com](mailto:jmukhadze.dimitri@gmail.com)
🚀 **Portfolio:** [DJprojects](https://practicum-react-portfolio.netlify.app)
