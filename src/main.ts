import Phaser from 'phaser';
import { gameConfig } from './config/GameConfig';

const game = new Phaser.Game(gameConfig);

type DebugScene = {
  getDebugState?: () => unknown;
  debugSetPacManTile?: (col: number, row: number) => void;
  debugSetGhostTile?: (name: string, col: number, row: number) => void;
  debugSetScoreState?: (score: number, lives: number, level: number) => void;
  debugSetMode?: (mode: string) => void;
  debugSetFruitVisible?: (visible: boolean) => void;
};

declare global {
  interface Window {
    __PACMAN_GAME__?: Phaser.Game;
    __PACMAN_DEBUG__?: {
      currentScene: () => string | null;
      menuState: () => unknown;
      gameState: () => unknown;
      gameOverState: () => unknown;
      setPacManTile: (col: number, row: number) => void;
      setGhostTile: (name: string, col: number, row: number) => void;
      setScoreState: (score: number, lives: number, level: number) => void;
      setMode: (mode: string) => void;
      setFruitVisible: (visible: boolean) => void;
    };
  }
}

const getScene = (key: string): DebugScene | null => {
  const scene = game.scene.getScene(key) as DebugScene | undefined;
  return scene ?? null;
};

window.__PACMAN_GAME__ = game;
window.__PACMAN_DEBUG__ = {
  currentScene: () => game.scene.getScenes(true)[0]?.scene.key ?? null,
  menuState: () => getScene('MenuScene')?.getDebugState?.() ?? null,
  gameState: () => getScene('GameScene')?.getDebugState?.() ?? null,
  gameOverState: () => getScene('GameOverScene')?.getDebugState?.() ?? null,
  setPacManTile: (col, row) => getScene('GameScene')?.debugSetPacManTile?.(col, row),
  setGhostTile: (name, col, row) => getScene('GameScene')?.debugSetGhostTile?.(name, col, row),
  setScoreState: (score, lives, level) => getScene('GameScene')?.debugSetScoreState?.(score, lives, level),
  setMode: (mode) => getScene('GameScene')?.debugSetMode?.(mode),
  setFruitVisible: (visible) => getScene('GameScene')?.debugSetFruitVisible?.(visible),
};
