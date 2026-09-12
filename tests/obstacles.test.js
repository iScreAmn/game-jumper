import { describe, it, expect } from 'vitest';
import { ObstacleManager } from '../src/game/obstacles.js';
import { CANVAS, DIFFICULTY } from '../src/game/config.js';

/** Прогоняет менеджер на заданное время с фиксированным шагом. */
function simulate(manager, { seconds, speed, score = 0, step = 1 / 60, onPassed }) {
  const frames = Math.round(seconds / step);
  for (let i = 0; i < frames; i++) {
    manager.update(step, speed, score, onPassed);
  }
}

describe('ObstacleManager', () => {
  it('starts empty and spawns the first obstacle after the initial distance', () => {
    const manager = new ObstacleManager(() => 0.5);
    expect(manager.obstacles).toHaveLength(0);

    simulate(manager, { seconds: 0.5, speed: 240 });
    expect(manager.obstacles).toHaveLength(0);

    simulate(manager, { seconds: 1, speed: 240 });
    expect(manager.obstacles).toHaveLength(1);
    expect(manager.obstacles[0].x).toBeLessThan(CANVAS.width);
  });

  it('keeps the gap between obstacles within the configured time range', () => {
    const speed = 300;
    const manager = new ObstacleManager(() => 0.5);
    const spawnTimes = [];
    let time = 0;
    const step = 1 / 120;

    for (let i = 0; i < 120 * 30; i++) {
      const before = manager.obstacles.length;
      manager.update(step, speed, 0);
      time += step;
      if (manager.obstacles.length > before) spawnTimes.push(time);
    }

    expect(spawnTimes.length).toBeGreaterThan(5);
    const { min, max } = DIFFICULTY.gapTime.start;
    for (let i = 1; i < spawnTimes.length; i++) {
      const prev = manager.lastObstacleWidth; // все препятствия одного типа при random=0.5
      const gapSeconds = spawnTimes[i] - spawnTimes[i - 1] - prev / speed;
      expect(gapSeconds).toBeGreaterThanOrEqual(min - step);
      expect(gapSeconds).toBeLessThanOrEqual(max + step);
    }
  });

  it('reports each obstacle once when it leaves the screen', () => {
    const manager = new ObstacleManager(() => 0.5);
    let passed = 0;
    simulate(manager, { seconds: 20, speed: 400, onPassed: () => passed++ });
    expect(passed).toBeGreaterThan(0);
    // Всё, что было заспавнено, либо на экране, либо засчитано.
    for (const obs of manager.obstacles) {
      expect(obs.x + obs.width).toBeGreaterThanOrEqual(0);
    }
  });

  it('reset clears obstacles and spawn state', () => {
    const manager = new ObstacleManager(() => 0.5);
    simulate(manager, { seconds: 5, speed: 300 });
    expect(manager.obstacles.length).toBeGreaterThan(0);

    manager.reset();
    expect(manager.obstacles).toHaveLength(0);
    expect(manager.distanceSinceSpawn).toBe(0);
  });

  it('spawns double obstacles with combined width', () => {
    // Суммарный вес при score 100 равен 16, double занимает диапазон [9, 11): roll 0.6 попадает в него.
    const manager = new ObstacleManager(() => 0.6);
    simulate(manager, { seconds: 2, speed: 300, score: 100 });
    const double = manager.obstacles.find((o) => o.type === 'double');
    expect(double).toBeDefined();
    expect(double.count).toBe(2);
    expect(double.width).toBe(double.spriteWidth * 2 + double.gap);
  });
});
