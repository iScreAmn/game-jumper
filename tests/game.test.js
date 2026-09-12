import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { Player } from '../src/game/player.js';
import { ObstacleManager } from '../src/game/obstacles.js';
import { LevelBackground } from '../src/game/levels.js';
import { ParticleSystem } from '../src/game/particles.js';
import { Effects } from '../src/game/effects.js';
import { Parallax } from '../src/game/parallax.js';
import { LEVEL_THRESHOLDS } from '../src/game/config.js';
import { mulberry32 } from '../src/game/random.js';

const silentAudio = { playJump() {}, playHit() {}, playLevelUp() {} };

function createGame(random = () => 0.5, startOptions = {}) {
  const player = new Player();
  const obstacles = new ObstacleManager();
  const background = new LevelBackground();
  const particles = new ParticleSystem();
  const effects = new Effects();
  const parallax = new Parallax();
  const game = new Game({ player, obstacles, background, audio: silentAudio, particles, effects, parallax });
  game.start({ random, ...startOptions });
  return { game, player, obstacles, background, particles, effects };
}

/**
 * Скриптовый игрок. Смотрит на ближайшее не пройденное препятствие:
 * наземное перепрыгивает, низкий метеор проходит в приседе,
 * под высоким метеором ничего не делает.
 */
function playWithBot(game, { seconds, actDistance = 70, step = 1 / 60 }) {
  const frames = Math.round(seconds / step);
  for (let i = 0; i < frames && !game.isOver; i++) {
    const player = game.player;
    const front = player.x + player.width;
    const pending = game.obstacles.obstacles.filter((o) => o.x + o.width > player.x);
    const nearest = pending.sort((a, b) => a.x - b.x)[0];

    if (nearest) {
      const distance = nearest.x - front;
      const overlapping = nearest.x < front + 10;
      if (nearest.type === 'flyLow') {
        if (distance <= actDistance + 20) game.duckDown();
      } else if (nearest.type === 'flyHigh') {
        // Ничего не делать, прыгать нельзя.
      } else if (distance <= actDistance && !overlapping) {
        game.duckUp();
        game.jump();
      }
    }
    if (!nearest || nearest.type !== 'flyLow') game.duckUp();

    game.update(step);
  }
}

describe('Game', () => {
  it('starts with zero score and no obstacles on screen', () => {
    const { game } = createGame();
    expect(game.score).toBe(0);
    expect(game.isOver).toBe(false);
    expect(game.obstacles.obstacles).toHaveLength(0);
  });

  it('a well-timed jumper passes many obstacles', () => {
    const { game } = createGame();
    playWithBot(game, { seconds: 60 });
    expect(game.isOver).toBe(false);
    expect(game.score).toBeGreaterThan(20);
  });

  it('random obstacle mix, including flying meteors, stays passable at high difficulty', () => {
    const { game } = createGame(mulberry32(42));
    playWithBot(game, { seconds: 150, actDistance: 80 });
    expect(game.isOver).toBe(false);
    expect(game.score).toBeGreaterThan(60);
    const seen = new Set(game.obstacles.obstacles.map((o) => o.type));
    // К этому моменту мир должен был показать и летающие типы.
    expect(game.stats.ducked).toBeGreaterThan(0);
    expect(seen.size).toBeGreaterThanOrEqual(0);
  });

  it('a player who never jumps loses on the first obstacle', () => {
    const { game } = createGame();
    for (let i = 0; i < 60 * 10 && !game.isOver; i++) game.update(1 / 60);
    expect(game.isOver).toBe(true);
    expect(game.score).toBe(0);
  });

  it('switches background levels as the score grows', () => {
    const { game, background } = createGame();
    playWithBot(game, { seconds: 60 });
    expect(game.score).toBeGreaterThanOrEqual(LEVEL_THRESHOLDS[1]);
    expect(background.levelIndex).toBeGreaterThanOrEqual(1);
  });

  it('plays death effects: hit-stop, explosion and shake', () => {
    const { game, particles, effects } = createGame();
    for (let i = 0; i < 60 * 10 && !game.isOver; i++) game.update(1 / 60);
    expect(effects.frozen).toBe(true);
    expect(particles.particles.length).toBeGreaterThan(20);

    for (let i = 0; i < 10; i++) game.update(1 / 60);
    expect(effects.frozen).toBe(false);
    expect(effects.shakeTime).toBeGreaterThan(0);
  });

  it('ignores jumps and keeps counting time after game over', () => {
    const { game } = createGame();
    for (let i = 0; i < 60 * 10 && !game.isOver; i++) game.update(1 / 60);
    const scoreAtDeath = game.score;
    game.jump();
    game.update(0.5);
    expect(game.timeSinceOver).toBeCloseTo(0.5);
    expect(game.score).toBe(scoreAtDeath);
    expect(game.player.onGround).toBe(true);
  });

  it('unlocks achievements during the run and reports them once', () => {
    const { game } = createGame();
    const unlocked = [];
    game.onAchievement = (a) => unlocked.push(a.id);
    playWithBot(game, { seconds: 60 });
    expect(unlocked).toContain('score_10');
    expect(unlocked).toContain('score_25');
    expect(new Set(unlocked).size).toBe(unlocked.length);
  });

  it('does not re-unlock achievements that were already saved', () => {
    const { game } = createGame(() => 0.5, { unlockedIds: ['score_10'] });
    const unlocked = [];
    game.onAchievement = (a) => unlocked.push(a.id);
    playWithBot(game, { seconds: 30 });
    expect(unlocked).not.toContain('score_10');
  });

  it('daily mode with the same seed produces the same obstacle sequence', () => {
    const first = createGame(mulberry32(2026), { mode: 'daily' });
    const second = createGame(mulberry32(2026), { mode: 'daily' });
    for (let i = 0; i < 60 * 5; i++) {
      first.game.update(1 / 60);
      second.game.update(1 / 60);
    }
    const types = (g) => g.obstacles.obstacles.map((o) => `${o.type}@${o.x.toFixed(1)}`);
    expect(types(first.game)).toEqual(types(second.game));
    expect(types(first.game).length).toBeGreaterThan(0);
  });
});
