/**
 * UIScene — HUD overlay que roda em paralelo com RoomScene/HubScene.
 * Nunca é destruída durante o combate — apenas atualizada via EventBus.
 *
 * scene.launch(SCENES.UI) — inicia em paralelo
 * Escuta eventos do EventBus para atualizar sem referências diretas.
 */
import Phaser from 'phaser'
import EventBus        from '../systems/EventBus'
import RunState        from '../systems/RunState'
import PermanentState  from '../systems/PermanentState'
import { EV, SCENES, PLAYER_MAX_HP, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants'

// Panel import (lazy — criado sob demanda)
import MapPanel       from '../ui/MapPanel'
import InventoryPanel from '../ui/InventoryPanel'
import RelicPanel     from '../ui/RelicPanel'

class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.UI, active: false })
    this._panels = {}
    this._hudElements = {}
  }

  create() {
    this.cameras.main.setBackgroundColor('transparent')

    this._buildHUD()
    this._bindEvents()
  }

  // ── HUD CONSTRUCTION ─────────────────────────────────────────

  _buildHUD() {
    const { add } = this
    const elems   = this._hudElements

    // ─ TOP LEFT: HP bar ────────────────────────────────────────
    elems.hpBar   = this._makeHpBar(8, 8)
    elems.hpText  = add.text(10, 20, '', {
      fontFamily: 'monospace', fontSize: '7px', color: '#cc4444',
    })

    // ─ TOP LEFT: Scrap (run currency) ──────────────────────────
    elems.scrapIcon = add.image(8, 34, 'ui_scrap').setOrigin(0).setScale(0.7)
    elems.scrapText = add.text(20, 32, '0', {
      fontFamily: 'monospace', fontSize: '8px', color: '#c8a87a',
    })

    // ─ TOP RIGHT: Echos (meta currency) ────────────────────────
    elems.echoIcon = add.image(GAME_WIDTH - 8, 8, 'ui_echo').setOrigin(1, 0).setScale(0.7)
    elems.echoText = add.text(GAME_WIDTH - 20, 8, '0Ξ', {
      fontFamily: 'monospace', fontSize: '8px', color: '#6688cc',
    }).setOrigin(1, 0)

    // ─ BOTTOM RIGHT: Relic slots ───────────────────────────────
    elems.relicSlots = this._makeRelicSlots()

    // ─ BOTTOM: Controls hint (shows briefly at run start) ──────
    elems.hint = add.text(GAME_WIDTH / 2, GAME_HEIGHT - 8, 'Z ATACAR  X APARAR  C DASH  M MAPA  I ITENS', {
      fontFamily: 'monospace', fontSize: '5px', color: '#333344', align: 'center',
    }).setOrigin(0.5, 1)

    this._refreshAll()
  }

  _makeHpBar(x, y) {
    const g = this.add.graphics()
    this._hpBarGraphics = g
    this._hpBarX = x
    this._hpBarY = y
    return g
  }

  _drawHpBar(hp, maxHp) {
    const g   = this._hpBarGraphics
    const x   = this._hpBarX
    const y   = this._hpBarY
    const w   = 80
    const h   = 7
    const pct = hp / maxHp

    g.clear()
    g.fillStyle(0x1a0a0a, 0.9)
    g.fillRect(x, y, w, h)
    const color = pct > 0.5 ? 0xaa3333 : pct > 0.25 ? 0xcc6622 : 0xee2222
    g.fillStyle(color)
    g.fillRect(x + 1, y + 1, (w - 2) * pct, h - 2)
    g.lineStyle(0.5, 0x550000)
    g.strokeRect(x, y, w, h)
  }

  _makeRelicSlots() {
    const slots = []
    for (let i = 0; i < 6; i++) {
      const x = GAME_WIDTH - 8 - i * 18
      const slot = this.add.image(x, GAME_HEIGHT - 8, 'ui_relic_frame').setOrigin(1, 1).setScale(1)
      slots.push(slot)
    }
    return slots
  }

  // ── REFRESH HELPERS ───────────────────────────────────────────

  _refreshAll() {
    const state = RunState.get()
    const perm  = PermanentState.get()
    this._drawHpBar(state.hp, state.maxHp)
    this._hudElements.hpText.setText(`${state.hp}/${state.maxHp}`)
    this._hudElements.scrapText.setText(`${state.scrap}`)
    this._hudElements.echoText.setText(`${perm.echos}Ξ`)
  }

  // ── EVENT BINDINGS ────────────────────────────────────────────

  _bindEvents() {
    EventBus.on(EV.PLAYER_HIT,   ({ hp }) => {
      const state = RunState.get()
      this._drawHpBar(hp, state.maxHp)
      this._hudElements.hpText.setText(`${hp}/${state.maxHp}`)
      this._flashHpBar()
    }, this)

    EventBus.on(EV.PLAYER_HEAL,  ({ hp }) => {
      const state = RunState.get()
      this._drawHpBar(hp, state.maxHp)
      this._hudElements.hpText.setText(`${hp}/${state.maxHp}`)
    }, this)

    EventBus.on(EV.SCRAP_CHANGE, (scrap) => {
      this._hudElements.scrapText.setText(`${scrap}`)
    }, this)

    EventBus.on(EV.ECHO_CHANGE, (echos) => {
      this._hudElements.echoText.setText(`${echos}Ξ`)
    }, this)

    EventBus.on(EV.RELIC_PICKUP, (relic) => {
      this._refreshRelics()
    }, this)

    EventBus.on(EV.UI_OPEN_MAP, () => {
      this._openPanel('map')
    }, this)

    EventBus.on(EV.UI_OPEN_INVENTORY, () => {
      this._openPanel('inventory')
    }, this)

    EventBus.on(EV.UI_CLOSE_MAP, () => {
      this._closePanel('map')
    }, this)

    EventBus.on(EV.UI_CLOSE_INVENTORY, () => {
      this._closePanel('inventory')
    }, this)

    EventBus.on(EV.RUN_START, () => {
      this._refreshAll()
      this._showHint()
    }, this)
  }

  // ── PANELS ───────────────────────────────────────────────────

  _openPanel(name) {
    if (this._panels[name]?.active) return
    this._pauseGameScene()

    switch (name) {
      case 'map':
        this._panels.map = new MapPanel(this)
        this._panels.map.open(RunState.get().mapData)
        break
      case 'inventory':
        this._panels.inventory = new InventoryPanel(this)
        this._panels.inventory.open(RunState.get())
        break
    }
  }

  _closePanel(name) {
    this._panels[name]?.close()
    delete this._panels[name]
    this._resumeGameScene()
  }

  _pauseGameScene() {
    const running = [SCENES.ROOM, SCENES.HUB, SCENES.RUN]
    running.forEach(key => {
      if (this.scene.isActive(key)) this.scene.pause(key)
    })
  }

  _resumeGameScene() {
    const running = [SCENES.ROOM, SCENES.HUB, SCENES.RUN]
    running.forEach(key => {
      if (this.scene.isPaused(key)) this.scene.resume(key)
    })
  }

  // ── FEEDBACK ─────────────────────────────────────────────────

  _flashHpBar() {
    this.tweens.add({
      targets:  this._hpBarGraphics,
      alpha:    { from: 0.4, to: 1 },
      duration: 100,
      yoyo:     true,
      repeat:   2,
    })
  }

  _refreshRelics() {
    const relics = RunState.get().relics
    this._hudElements.relicSlots.forEach((slot, i) => {
      const relic = relics[i]
      if (relic) {
        slot.setTexture('relics', relic.id)
      }
    })
  }

  _showHint() {
    const hint = this._hudElements.hint
    hint.setAlpha(0.6)
    this.time.delayedCall(4000, () => {
      this.tweens.add({ targets: hint, alpha: 0, duration: 1000 })
    })
  }
}

export default UIScene
