/**
 * BootScene — primeira cena carregada.
 * Seta configurações globais e inicia o PreloadScene.
 */
import Phaser from 'phaser'
import PermanentState from '../systems/PermanentState'
import { SCENES } from '../utils/constants'

class BootScene extends Phaser.Scene {
  constructor() { super(SCENES.BOOT) }

  preload() {
    // Load only the loading bar assets here (very small)
    this.load.image('logo', 'assets/ui/logo.png')
  }

  create() {
    // Bootstrap persistent state
    PermanentState.load()

    // Set global pixel art scaling
    this.cameras.main.setBackgroundColor('#0a0a0c')

    this.scene.start(SCENES.PRELOAD)
  }
}

export default BootScene
