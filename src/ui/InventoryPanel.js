/**
 * InventoryPanel — exibe relíquias equipadas e informações da run atual.
 */
import EventBus from '../systems/EventBus'
import { EV, RELIC_TYPES } from '../utils/constants'

class InventoryPanel {
  constructor(scene) {
    this.scene   = scene
    this._objects = []
    this.active  = false
  }

  open(runState) {
    this.active = true
    const scene = this.scene
    const W = scene.scale.width
    const H = scene.scale.height

    // Backdrop
    const bg = scene.add.rectangle(W/2, H/2, W - 20, H - 20, 0x050508, 0.96)
    bg.setStrokeStyle(0.5, 0x332211)
    this._track(bg)

    // Title
    this._track(scene.add.text(W/2, 14, 'IMPLANTES & RELÍQUIAS', {
      fontFamily: 'monospace', fontSize: '7px', color: '#aa8855',
    }).setOrigin(0.5))

    // Stats row
    const stats = [
      `profundidade: ${runState.runDepth}`,
      `abates: ${runState.kills}`,
      `scrap: ${runState.scrap}`,
      `hp: ${runState.hp}/${runState.maxHp}`,
    ]
    stats.forEach((s, i) => {
      this._track(scene.add.text(12 + i * (W / 4 - 4), 28, s, {
        fontFamily: 'monospace', fontSize: '6px', color: '#666677',
      }))
    })

    // Relics grid
    this._track(scene.add.text(12, 44, 'EQUIPADOS:', {
      fontFamily: 'monospace', fontSize: '6px', color: '#553322',
    }))

    if (runState.relics.length === 0) {
      this._track(scene.add.text(W/2, 65, 'nenhum implante coletado ainda.', {
        fontFamily: 'monospace', fontSize: '6px', color: '#333344',
      }).setOrigin(0.5))
    } else {
      runState.relics.forEach((relic, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const rx  = 14 + col * 110
        const ry  = 56 + row * 48

        const typeColor = {
          [RELIC_TYPES.IMPLANT]:  0x223355,
          [RELIC_TYPES.DOCTRINE]: 0x553322,
          [RELIC_TYPES.EFFIGY]:   0x440011,
        }[relic.type] ?? 0x222233

        const card = scene.add.rectangle(rx + 50, ry + 18, 105, 40, typeColor, 0.8)
        card.setStrokeStyle(0.5, 0x445566)
        this._track(card)

        this._track(scene.add.text(rx + 4, ry + 6, relic.name, {
          fontFamily: 'monospace', fontSize: '6px', color: '#ccbbaa',
        }))
        this._track(scene.add.text(rx + 4, ry + 16, relic.description, {
          fontFamily: 'monospace', fontSize: '5px', color: '#777788',
          wordWrap: { width: 98 },
        }))
      })
    }

    // Active buffs
    const buffs = Object.entries(runState.buffs)
    if (buffs.length > 0) {
      this._track(scene.add.text(12, H - 42, 'BUFFS ATIVOS:', {
        fontFamily: 'monospace', fontSize: '6px', color: '#335522',
      }))
      buffs.forEach(([key, val], i) => {
        this._track(scene.add.text(14 + i * 90, H - 32, key, {
          fontFamily: 'monospace', fontSize: '5px', color: '#447733',
        }))
      })
    }

    // Close handler
    this._track(scene.add.text(W/2, H - 12, 'ESC / I para fechar', {
      fontFamily: 'monospace', fontSize: '5px', color: '#334455',
    }).setOrigin(0.5))

    const closeHandler = (e) => {
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC ||
          e.keyCode === Phaser.Input.Keyboard.KeyCodes.I) {
        this.close()
        EventBus.emit(EV.UI_CLOSE_INVENTORY)
        scene.input.keyboard.off('keydown', closeHandler)
      }
    }
    scene.input.keyboard.on('keydown', closeHandler)
  }

  close() {
    this.active = false
    this._objects.forEach(o => o?.destroy())
    this._objects = []
  }

  _track(obj) { this._objects.push(obj); return obj }
}

export default InventoryPanel
