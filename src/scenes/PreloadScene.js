/**
 * PreloadScene — carrega todos os assets do jogo com barra de progresso.
 */
import Phaser from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants'

class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENES.PRELOAD) }

  preload() {
    this._createLoadingBar()

    // ── SPRITES ──────────────────────────────────────────────
    this.load.spritesheet('player', 'assets/sprites/player.png',     { frameWidth: 32, frameHeight: 32 })
    this.load.spritesheet('enemy_grunt', 'assets/sprites/enemy_grunt.png', { frameWidth: 24, frameHeight: 24 })
    this.load.spritesheet('enemy_prophet', 'assets/sprites/enemy_prophet.png', { frameWidth: 32, frameHeight: 32 })
    this.load.spritesheet('boss_syndesis', 'assets/sprites/boss_syndesis.png', { frameWidth: 64, frameHeight: 64 })

    // ── TILESETS ─────────────────────────────────────────────
    this.load.image('tileset_hub',    'assets/tiles/hub.png')
    this.load.image('tileset_ruins',  'assets/tiles/ruins.png')
    this.load.image('tileset_church', 'assets/tiles/church.png')
    this.load.image('tileset_server', 'assets/tiles/server.png')

    // ── TILEMAPS ─────────────────────────────────────────────
    this.load.tilemapTiledJSON('map_hub',         'assets/maps/hub.json')
    this.load.tilemapTiledJSON('room_combat_1',   'assets/maps/rooms/combat_1.json')
    this.load.tilemapTiledJSON('room_combat_2',   'assets/maps/rooms/combat_2.json')
    this.load.tilemapTiledJSON('room_combat_3',   'assets/maps/rooms/combat_3.json')
    this.load.tilemapTiledJSON('room_elite_1',    'assets/maps/rooms/elite_1.json')
    this.load.tilemapTiledJSON('room_elite_2',    'assets/maps/rooms/elite_2.json')
    this.load.tilemapTiledJSON('room_rest_1',     'assets/maps/rooms/rest_1.json')
    this.load.tilemapTiledJSON('room_boss_1',     'assets/maps/rooms/boss_1.json')
    this.load.tilemapTiledJSON('room_boss_2',     'assets/maps/rooms/boss_2.json')
    this.load.tilemapTiledJSON('room_forge_1',    'assets/maps/rooms/forge_1.json')
    this.load.tilemapTiledJSON('room_lore_1',     'assets/maps/rooms/lore_1.json')
    this.load.tilemapTiledJSON('room_transit_1',  'assets/maps/rooms/transit_1.json')

    // ── UI ────────────────────────────────────────────────────
    this.load.image('ui_heart',       'assets/ui/heart.png')
    this.load.image('ui_heart_empty', 'assets/ui/heart_empty.png')
    this.load.image('ui_scrap',       'assets/ui/scrap.png')
    this.load.image('ui_echo',        'assets/ui/echo.png')
    this.load.image('ui_relic_frame', 'assets/ui/relic_frame.png')
    this.load.atlas('relics',         'assets/ui/relics.png', 'assets/ui/relics.json')

    // ── AUDIO ─────────────────────────────────────────────────
    this.load.audio('sfx_attack',    'assets/audio/sfx/attack.ogg')
    this.load.audio('sfx_parry',     'assets/audio/sfx/parry.ogg')
    this.load.audio('sfx_dash',      'assets/audio/sfx/dash.ogg')
    this.load.audio('sfx_hurt',      'assets/audio/sfx/hurt.ogg')
    this.load.audio('sfx_death',     'assets/audio/sfx/death.ogg')
    this.load.audio('sfx_relic',     'assets/audio/sfx/relic.ogg')
    this.load.audio('bgm_hub',       'assets/audio/bgm/hub.ogg')
    this.load.audio('bgm_run',       'assets/audio/bgm/run.ogg')
    this.load.audio('bgm_boss',      'assets/audio/bgm/boss.ogg')
  }

  create() {
    // Small delay for dramatic effect
    this.time.delayedCall(500, () => {
      this.scene.start(SCENES.HUB)
    })
  }

  _createLoadingBar() {
    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2

    this.cameras.main.setBackgroundColor('#0a0a0c')

    // Title
    this.add.text(cx, cy - 40, 'CARNE & DOUTRINA', {
      fontFamily: 'monospace',
      fontSize:   '14px',
      color:      '#c8a87a',
      letterSpacing: 4,
    }).setOrigin(0.5)

    // Loading bar background
    const barBg = this.add.rectangle(cx, cy + 10, 200, 8, 0x1e1e22).setOrigin(0.5)

    // Loading bar fill
    const barFill = this.add.rectangle(cx - 100, cy + 10, 0, 8, 0x8b3c3c).setOrigin(0, 0.5)

    // Loading text
    const loadingText = this.add.text(cx, cy + 28, 'carregando...', {
      fontFamily: 'monospace',
      fontSize:   '8px',
      color:      '#555555',
    }).setOrigin(0.5)

    this.load.on('progress', (value) => {
      barFill.setSize(200 * value, 8)
      loadingText.setText(`carregando... ${Math.floor(value * 100)}%`)
    })

    this.load.on('complete', () => {
      loadingText.setText('pronto')
    })
  }
}

export default PreloadScene
