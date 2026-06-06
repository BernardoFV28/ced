/**
 * GameOverScene — tela de morte. Salva stats, converte Scrap→Echos e retorna ao Hub.
 */
import Phaser from 'phaser'
import RunState       from '../systems/RunState'
import PermanentState from '../systems/PermanentState'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, ECHO_PER_RUN_MIN, ECHO_PER_RUN_MAX } from '../utils/constants'

class GameOverScene extends Phaser.Scene {
  constructor() { super(SCENES.GAME_OVER) }

  create() {
    this.cameras.main.setBackgroundColor('#000000')
    this.cameras.main.fadeIn(600, 0, 0, 0)

    const run = RunState.get()

    // Calculate echo reward
    const echoGain = Math.floor(
      ECHO_PER_RUN_MIN + (run.kills * 0.5) + (run.roomsCleared * 2)
    )

    // Record in permanent state
    PermanentState.recordRunEnd({
      kills:    run.kills,
      depth:    run.runDepth,
      echoGain,
    })

    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2

    this.add.text(cx, cy - 50, 'VERME CAIU', {
      fontFamily: 'monospace', fontSize: '16px', color: '#880000', letterSpacing: 6,
    }).setOrigin(0.5)

    this.add.text(cx, cy - 20, 'a doutrina persiste', {
      fontFamily: 'monospace', fontSize: '7px', color: '#441111',
    }).setOrigin(0.5)

    // Stats
    const lines = [
      `salas concluídas: ${run.roomsCleared}`,
      `inimigos eliminados: ${run.kills}`,
      `scrap acumulado: ${run.scrap}`,
      `ecos ganhos: +${echoGain}Ξ`,
    ]

    lines.forEach((line, i) => {
      this.add.text(cx, cy + 8 + i * 12, line, {
        fontFamily: 'monospace', fontSize: '7px', color: '#666677',
      }).setOrigin(0.5)
    })

    // Return prompt
    const prompt = this.add.text(cx, cy + 72, '[ ENTER / ESPAÇO ] retornar ao hub', {
      fontFamily: 'monospace', fontSize: '7px', color: '#4455aa',
    }).setOrigin(0.5)

    this.tweens.add({
      targets: prompt, alpha: { from: 0.3, to: 1 }, duration: 800, yoyo: true, repeat: -1,
    })

    this.input.keyboard.once('keydown-ENTER', () => this._returnToHub())
    this.input.keyboard.once('keydown-SPACE', () => this._returnToHub())
    this.input.on('pointerdown', () => this._returnToHub())
  }

  _returnToHub() {
    this.cameras.main.fade(400, 0, 0, 0)
    this.time.delayedCall(400, () => {
      // Stop UIScene so it restarts fresh
      this.scene.stop(SCENES.UI)
      this.scene.start(SCENES.HUB)
    })
  }
}

export default GameOverScene
