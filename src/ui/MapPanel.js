/**
 * MapPanel — painel de mapa da run atual.
 * Renderizado dentro da UIScene quando o jogador aperta M.
 */
import { ROOM_TYPES, EV } from '../utils/constants'
import EventBus from '../systems/EventBus'

const ROOM_COLORS = {
  [ROOM_TYPES.COMBAT]:  0x882222,
  [ROOM_TYPES.ELITE]:   0xcc5500,
  [ROOM_TYPES.BOSS]:    0x660033,
  [ROOM_TYPES.REST]:    0x226633,
  [ROOM_TYPES.FORGE]:   0x224488,
  [ROOM_TYPES.LORE]:    0x553388,
  [ROOM_TYPES.TRANSIT]: 0x333344,
}

class MapPanel {
  constructor(scene) {
    this.scene = scene
    this._objects = []
    this.active = false
  }

  open(mapData) {
    if (!mapData) return
    this.active = true
    const { add, GAME_WIDTH: W, GAME_HEIGHT: H } = this._dims()

    // Backdrop
    const bg = this.scene.add.rectangle(W/2, H/2, W - 20, H - 20, 0x050508, 0.95)
    bg.setStrokeStyle(0.5, 0x222244)
    this._track(bg)

    // Title
    this._track(this.scene.add.text(W/2, 14, 'MAPA DA RUN', {
      fontFamily: 'monospace', fontSize: '7px', color: '#aaaacc',
    }).setOrigin(0.5))

    this._track(this.scene.add.text(W/2, 24, 'ESC / M para fechar', {
      fontFamily: 'monospace', fontSize: '5px', color: '#334455',
    }).setOrigin(0.5))

    // Draw edges
    const g = this.scene.add.graphics()
    this._track(g)
    g.lineStyle(0.5, 0x334455, 0.6)
    mapData.edges.forEach(([aId, bId]) => {
      const a = mapData.rooms.find(r => r.id === aId)
      const b = mapData.rooms.find(r => r.id === bId)
      if (!a || !b) return
      g.beginPath()
      g.moveTo(a.x + 30, a.y + 40)
      g.lineTo(b.x + 30, b.y + 40)
      g.strokePath()
    })

    // Draw rooms
    const RunState = require('../systems/RunState').default
    const visited  = RunState.get().visitedRooms
    const current  = RunState.get().currentRoom

    mapData.rooms.forEach(room => {
      const rx   = room.x + 10
      const ry   = room.y + 30
      const color = ROOM_COLORS[room.type] ?? 0x333344
      const alpha = visited.has(room.id) ? 1 : 0.35

      const rect = this.scene.add.rectangle(rx, ry, 40, 28, color, alpha)
      rect.setStrokeStyle(0.5, current === room.id ? 0xffffff : 0x444455)
      this._track(rect)

      // Current room indicator
      if (current === room.id) {
        const dot = this.scene.add.circle(rx, ry - 18, 3, 0xffffff)
        this._track(dot)
      }

      const label = room.type.slice(0, 4).toUpperCase()
      const t = this.scene.add.text(rx, ry, label, {
        fontFamily: 'monospace', fontSize: '5px', color: alpha < 1 ? '#444455' : '#ccccdd',
      }).setOrigin(0.5)
      this._track(t)
    })

    // Close on ESC/M
    const closeHandler = (e) => {
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC ||
          e.keyCode === Phaser.Input.Keyboard.KeyCodes.M) {
        this.close()
        EventBus.emit(EV.UI_CLOSE_MAP)
        this.scene.input.keyboard.off('keydown', closeHandler)
      }
    }
    this.scene.input.keyboard.on('keydown', closeHandler)
  }

  close() {
    this.active = false
    this._objects.forEach(o => o?.destroy())
    this._objects = []
  }

  _track(obj) { this._objects.push(obj); return obj }

  _dims() {
    const { width: W, height: H } = this.scene.scale
    return { add: this.scene.add, GAME_WIDTH: W, GAME_HEIGHT: H }
  }
}

export default MapPanel
