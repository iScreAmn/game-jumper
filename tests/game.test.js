import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game.js';
import { Player } from '../src/game/player.js';
import { ObstacleManager } from '../src/game/obstacles.js';
import { LevelBackground } from '../src/game/levels.js';
import { LEVEL_THRESHOLDS } from '../src/game/config.js';

const silentAudio = { playJump() {}, playHit() {}, playLevelUp() {} };

function createGame(random = () => 0.5) {
  const player = new Player();
  const obstacles = new ObstacleManager(random);
  const background = new LevelBackground();
  const game = new Game({ player, obstacles, background, audio: silentAudio });
  game.start();
  return { game, player, obstacles, background };
}

/**
 * Скриптовый игрок: прыгает в полную силу, когда ближайшее препятствие
 * оказывается на дистанции jumpDistance перед ним.
 */
function playWithBot(game, { seconds, jumpDistance, step = 1 / 60 }) {
  const frames = Math.round(seconds / step);
  for (let i = 0; i < frames && !game.isOver; i++) {
    const playerFront = game.player.x + game.player.width;
    const ahead = game.obstacles.obstacles
      .map((o) => o.x - playerFront)
      .filter((d) => d > 0);
    if (ahead.length && Math.min(...ahead) <= jumpDistance) game.jump();
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
    playWithBot(game, { seconds: 60, jumpDistance: 70 });
    expect(game.isOver).toBe(false);
    expect(game.score).toBeGreaterThan(20);
  });

  it('random obstacle mix stays passable at high difficulty', () => {
    let seed = 42;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const { game } = createGame(random);
    playWithBot(game, { seconds: 120, jumpDistance: 80 });
    expect(game.isOver).toBe(false);
    expect(game.score).toBeGreaterThan(50);
  });

  it('a player who never jumps loses on the first obstacle', () => {
    const { game } = createGame();
    for (let i = 0; i < 60 * 10 && !game.isOver; i++) game.update(1 / 60);
    expect(game.isOver).toBe(true);
    expect(game.score).toBe(0);
  });

  it('switches background levels as the score grows', () => {
    const { game, background } = createGame();
    playWithBot(game, { seconds: 60, jumpDistance: 70 });
    expect(game.score).toBeGreaterThanOrEqual(LEVEL_THRESHOLDS[1]);
    expect(background.levelIndex).toBeGreaterThanOrEqual(1);
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
});
