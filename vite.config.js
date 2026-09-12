import { defineConfig } from 'vite';

export default defineConfig({
  base: '/game-jumper/',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
