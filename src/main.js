/**
 * main.js — entry point do Phaser 3 + Vite.
 * Configura o game e registra todas as Scenes.
 */
import Phaser from 'phaser'

import BootScene       from './scenes/BootScene'
import PreloadScene    from './scenes/PreloadScene'
import HubScene        from './scenes/HubScene'
import RoomScene       from './scenes/RoomScene'
import UIScene         from './scenes/UIScene'
import GameOverScene   from './scenes/GameOverScene'
import TransitionScene from './scenes/TransitionScene'

import { GAME_WIDTH, GAME_HEIGHT, SCALE } from './utils/constants'

const config = {
  type: Phaser.AUTO,

  width:  GAME_WIDTH,
  height: GAME_HEIGHT,

  zoom: SCALE,   // pixel-art scaling: renders 480×270 at 1440×810

  backgroundColor: '#0a0a0c',

  parent: 'game-container',

  pixelArt: true,   // disables anti-aliasing on sprites and canvas

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },  // per-body gravity set in entities
      debug: import.meta.env.DEV,
    },
  },

  audio: {
    disableWebAudio: false,
  },

  input: {
    keyboard: true,
    gamepad:  true,
  },

  scene: [
    BootScene,
    PreloadScene,
    HubScene,
    RoomScene,
    UIScene,
    GameOverScene,
    TransitionScene,
  ],
}

// Create game instance
const game = new Phaser.Game(config)

// Dev: expose game globally for debugging
if (import.meta.env.DEV) {
  window.__GAME__ = game
  window.__RUN__  = () => import('./systems/RunState').then(m => console.log(m.default.get()))
  window.__PERM__ = () => import('./systems/PermanentState').then(m => console.log(m.default.get()))
  console.info('%c🩸 CARNE & DOUTRINA — DEV MODE', 'color:#8b3c3c;font-weight:bold')
  console.info('window.__GAME__  — Phaser instance')
  console.info('window.__RUN__() — RunState snapshot')
  console.info('window.__PERM__() — PermanentState snapshot')
}

export default game
