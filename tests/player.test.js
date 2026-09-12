import { describe, it, expect } from 'vitest';
import { Player } from '../src/game/player.js';
import { GROUND_Y, PHYSICS, PLAYER } from '../src/game/config.js';

function runUntilGrounded(player, step = 1 / 60, limit = 1000) {
  let minY = player.y;
  for (let i = 0; i < limit; i++) {
    player.update(step);
    minY = Math.min(minY, player.y);
    if (player.onGround) return { frames: i + 1, minY };
  }
  throw new Error('player never landed');
}

describe('Player', () => {
  it('stands on the ground line initially', () => {
    const player = new Player();
    expect(player.y + player.height).toBe(GROUND_Y);
    expect(player.onGround).toBe(true);
  });

  it('cannot double jump', () => {
    const player = new Player();
    expect(player.jump()).toBe(true);
    expect(player.jump()).toBe(false);
  });

  it('reaches the same height regardless of frame rate', () => {
    const at60 = new Player();
    at60.jump();
    const slow = runUntilGrounded(at60, 1 / 60);

    const at144 = new Player();
    at144.jump();
    const fast = runUntilGrounded(at144, 1 / 144);

    const expectedHeight = PHYSICS.jumpVelocity ** 2 / (2 * PHYSICS.gravity);
    const height60 = at60.groundY - slow.minY;
    const height144 = at144.groundY - fast.minY;

    // Полунеявный Эйлер занижает вершину на v*dt/2: около 6 px при 60 fps, 2.6 px при 144 fps.
    expect(Math.abs(height60 - expectedHeight)).toBeLessThan(8);
    expect(Math.abs(height144 - expectedHeight)).toBeLessThan(4);
    expect(Math.abs(height60 - height144)).toBeLessThan(6);
  });

  it('cutJump makes the jump lower and reports the cut once', () => {
    const full = new Player();
    full.jump();
    const fullRun = runUntilGrounded(full);

    const short = new Player();
    short.jump();
    short.update(1 / 60);
    expect(short.cutJump()).toBe(true);
    expect(short.cutJump()).toBe(false);
    const shortRun = runUntilGrounded(short);

    expect(short.groundY - shortRun.minY).toBeLessThan((full.groundY - fullRun.minY) / 2);
  });

  it('cutJump does nothing while falling or on the ground', () => {
    const player = new Player();
    expect(player.cutJump()).toBe(false);
    expect(player.dy).toBe(0);

    player.jump();
    for (let i = 0; i < 30; i++) player.update(1 / 60);
    expect(player.dy).toBeGreaterThan(0); // уже падает
    const before = player.dy;
    expect(player.cutJump()).toBe(false);
    expect(player.dy).toBe(before);
  });

  it('ducking shrinks the hitbox and keeps the feet on the ground', () => {
    const player = new Player();
    player.duckDown();
    expect(player.ducking).toBe(true);
    expect(player.height).toBe(PLAYER.duckHeight);
    expect(player.y + player.height).toBe(GROUND_Y);

    player.duckUp();
    expect(player.ducking).toBe(false);
    expect(player.height).toBe(PLAYER.height);
    expect(player.y + player.height).toBe(GROUND_Y);
  });

  it('pressing down in the air fast-falls and ducks on landing while held', () => {
    const player = new Player();
    player.jump();
    player.update(1 / 60);
    player.duckDown();
    expect(player.ducking).toBe(false);
    expect(player.dy).toBe(PHYSICS.fastFallVelocity);

    runUntilGrounded(player);
    expect(player.ducking).toBe(true);
    player.duckUp();
    expect(player.ducking).toBe(false);
  });

  it('jumping out of a duck stands the player up', () => {
    const player = new Player();
    player.duckDown();
    expect(player.jump()).toBe(true);
    expect(player.ducking).toBe(false);
    expect(player.height).toBe(PLAYER.height);
  });

  it('fires onJump and onLand callbacks', () => {
    const player = new Player();
    let jumps = 0;
    let landings = 0;
    player.onJump = () => jumps++;
    player.onLand = (speed) => {
      landings++;
      expect(speed).toBeGreaterThan(0);
    };
    player.jump();
    runUntilGrounded(player);
    expect(jumps).toBe(1);
    expect(landings).toBe(1);
  });

  it('selectCharacter ignores out of range indexes', () => {
    const player = new Player();
    player.selectCharacter(1);
    player.selectCharacter(99);
    player.selectCharacter(-1);
    expect(player.selectedCharacterIndex).toBe(1);
  });
});
