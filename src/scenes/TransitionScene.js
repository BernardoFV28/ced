/**
 * TransitionScene — entre salas. Mostra escolha de próxima sala + recompensa da sala anterior.
 */
import Phaser from 'phaser'
import RunState from '../systems/RunState'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, ROOM_TYPES } from '../utils/constants'

const ROOM_COLORS = {
  [ROOM_TYPES.COMBAT]:  0x882222,
  [ROOM_TYPES.ELITE]:   0xaa4400,
  [ROOM_TYPES.BOSS]:    0x660033,
  [ROOM_TYPES.REST]:    0x226633,
  [ROOM_TYPES.FORGE]:   0x334488,
  [ROOM_TYPES.LORE]:    0x553388,
  [ROOM_TYPES.TRANSIT]: 0x333344,
}

const ROOM_LABELS = {
  [ROOM_TYPES.COMBAT]:  'SALA DE COMBATE',
  [ROOM_TYPES.ELITE]:   'GUARDA DE ELITE',
  [ROOM_TYPES.BOSS]:    '⚠ NÚCLEO',
  [ROOM_TYPES.REST]:    'CÂMARA DE REPOUSO',
  [ROOM_TYPES.FORGE]:   'FORJA DE IMPLANTES',
  [ROOM_TYPES.LORE]:    'FRAGMENTO DE MEMÓRIA',
  [ROOM_TYPES.TRANSIT]: 'CORREDOR',
}

class TransitionScene extends Phaser.Scene {
  constructor() { super(SCENES.TRANSITION) }

  init(data) {
    this.exitRoomIds = data.exitRoomIds
    this.mapData     = data.mapData
    this.seed        = data.seed
  }

  create() {
    this.cameras.main.setBackgroundColor('#050508')
    this.cameras.main.fadeIn(300, 0, 0, 0)

    const cx = GAME_WIDTH / 2

    this.add.text(cx, 14, 'escolha o próximo setor', {
      fontFamily: 'monospace', fontSize: '7px', color: '#334455',
    }).setOrigin(0.5)

    const exits = this.exitRoomIds.map(id => this.mapData.rooms.find(r => r.id === id)).filter(Boolean)

    const totalW = exits.length * 100 + (exits.length - 1) * 16
    const startX = cx - totalW / 2

    exits.forEach((room, i) => {
      const x = startX + i * 116
      const y = GAME_HEIGHT / 2 - 20

      const color = ROOM_COLORS[room.type] ?? 0x333344
      const label = ROOM_LABELS[room.type] ?? room.type.toUpperCase()

      const btn = this.add.rectangle(x, y, 100, 60, color, 0.8)
        .setOrigin(0, 0.5)
        .setInteractive()

      this.add.text(x + 50, y - 12, label, {
        fontFamily: 'monospace', fontSize: '6px', color: '#ccccdd', wordWrap: { width: 90 },
      }).setOrigin(0.5)

      this.add.text(x + 50, y + 4, `profundidade ${room.depth}`, {
        fontFamily: 'monospace', fontSize: '5px', color: '#777788',
      }).setOrigin(0.5)

      // Keyboard shortcut
      const keyLabel = ['1','2','3'][i]
      this.add.text(x + 50, y + 18, `[${keyLabel}]`, {
        fontFamily: 'monospace', fontSize: '6px', color: '#445566',
      }).setOrigin(0.5)

      btn.on('pointerdown', () => this._goToRoom(room))
      btn.on('pointerover', () => btn.setAlpha(1))
      btn.on('pointerout',  () => btn.setAlpha(0.8))

      this.input.keyboard.on(`keydown-${keyLabel}`, () => this._goToRoom(room))
    })

    // Relic choice hint (if room was a combat room and we have relics to show)
    this.add.text(cx, GAME_HEIGHT - 12, 'ESC — ver mapa', {
      fontFamily: 'monospace', fontSize: '5px', color: '#222233',
    }).setOrigin(0.5)

    this.input.keyboard.on('keydown-ESC', () => {
      const { EV } = require('../utils/constants')
      const EventBus = require('../systems/EventBus').default
      EventBus.emit(EV.UI_OPEN_MAP)
    })
  }

  _goToRoom(room) {
    this.cameras.main.fade(250, 0, 0, 0)
    this.time.delayedCall(250, () => {
      this.scene.start(SCENES.ROOM, {
        roomData: room,
        mapData:  this.mapData,
        seed:     this.seed,
      })
    })
  }
}

export default TransitionScene
