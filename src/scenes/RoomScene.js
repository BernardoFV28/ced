/**
 * RoomScene — cena de sala individual.
 * Recebe `roomData` via scene.start(SCENES.ROOM, { roomData, mapData })
 * Gerencia tilemap, player, inimigos, colisões e transição entre salas.
 */
import Phaser from 'phaser'
import EventBus     from '../systems/EventBus'
import RunState     from '../systems/RunState'
import Player       from '../entities/Player'
import Enemy        from '../entities/Enemy'
import { EV, SCENES, TILE_SIZE } from '../utils/constants'

class RoomScene extends Phaser.Scene {
  constructor() { super(SCENES.ROOM) }

  init(data) {
    this.roomData = data.roomData
    this.mapData  = data.mapData     // full run graph
    this.seed     = data.seed ?? 0
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a0c')
    this.enemies = []
    this.cleared = false

    this._buildTilemap()
    this._spawnPlayer()
    this._spawnEnemies()
    this._setupCollisions()
    this._setupCamera()
    this._bindEvents()

    // Launch UI in parallel (idempotent — ignored if already running)
    if (!this.scene.isActive(SCENES.UI)) {
      this.scene.launch(SCENES.UI)
    }

    RunState.enterRoom(this.roomData.id)

    // Mark room cleared immediately for non-combat rooms
    if (!['combat', 'elite', 'boss'].includes(this.roomData.type)) {
      this._onRoomCleared()
    }
  }

  update(time, delta) {
    if (!this.player) return

    this.player.update(delta)

    this.enemies.forEach(e => {
      if (!e.isDead()) e.update(delta, this.player)
    })

    this._checkRoomClear()
  }

  // ── TILEMAP ──────────────────────────────────────────────────

  _buildTilemap() {
    const key = this.roomData.templateKey ?? 'room_combat_1'
    const map  = this.make.tilemap({ key })

    // Choose correct tileset based on room type
    const tilesetImg = this._getTilesetForRoom()
    const tileset    = map.addTilesetImage('tileset', tilesetImg)

    // Layers — Tiled layers must be named exactly:
    //   Background, Platforms, Foreground, SpawnPoints
    this.layerBg       = map.createLayer('Background',  tileset, 0, 0)
    this.layerPlatforms = map.createLayer('Platforms',  tileset, 0, 0)
    this.layerFg       = map.createLayer('Foreground',  tileset, 0, 0)

    this.layerPlatforms.setCollisionByExclusion([-1])

    // Object layers (spawn points)
    this.spawnLayer = map.getObjectLayer('SpawnPoints')
    this.mapWidth   = map.widthInPixels
    this.mapHeight  = map.heightInPixels

    // World bounds
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight)
  }

  _getTilesetForRoom() {
    const typeMap = {
      combat:  'tileset_ruins',
      elite:   'tileset_church',
      boss:    'tileset_server',
      rest:    'tileset_ruins',
      forge:   'tileset_server',
      lore:    'tileset_church',
      transit: 'tileset_ruins',
    }
    return typeMap[this.roomData.type] ?? 'tileset_ruins'
  }

  // ── SPAWNING ─────────────────────────────────────────────────

  _spawnPlayer() {
    const spawnObj = this.spawnLayer?.objects.find(o => o.name === 'PlayerSpawn')
    const x = spawnObj?.x ?? 60
    const y = spawnObj?.y ?? 100

    this.player = new Player(this, x, y)
    this.player.create()
  }

  _spawnEnemies() {
    if (!this.spawnLayer) return

    this.spawnLayer.objects
      .filter(o => o.name === 'EnemySpawn')
      .forEach(spawn => {
        const type = spawn.properties?.find(p => p.name === 'type')?.value ?? 'grunt'
        const enemy = this._createEnemy(type, spawn.x, spawn.y)
        this.enemies.push(enemy)
      })
  }

  _createEnemy(type, x, y) {
    const configs = {
      grunt: { key: 'enemy_grunt', maxHp: 40, damage: 12, speed: 55 },
      prophet: { key: 'enemy_prophet', maxHp: 65, damage: 18, speed: 40 },
    }
    const config = configs[type] ?? configs.grunt
    const enemy  = new Enemy(this, x, y, config)
    return enemy.create()
  }

  // ── COLLISIONS ───────────────────────────────────────────────

  _setupCollisions() {
    // Player ↔ platforms
    this.physics.add.collider(this.player.sprite, this.layerPlatforms)

    // Enemies ↔ platforms
    this.enemies.forEach(e => {
      this.physics.add.collider(e.sprite, this.layerPlatforms)
    })

    // Player attack box ↔ enemies
    this.enemies.forEach(enemy => {
      this.physics.add.overlap(
        this.player.attackBox,
        enemy.sprite,
        () => this._onPlayerHitEnemy(enemy),
        null,
        this,
      )
    })
  }

  _onPlayerHitEnemy(enemy) {
    if (!this.player.attackBox.active || enemy.isDead()) return
    const dmg    = this.player.getAttackDamage()
    const isCrit = Math.random() < 0.1  // 10% base crit — relics can modify
    enemy.takeDamage(dmg, isCrit)

    // Disable hitbox briefly to prevent multi-hit in same swing
    this.player.attackBox.setActive(false)
    this.time.delayedCall(80, () => {
      if (this.player.isAttacking) this.player.attackBox.setActive(true)
    })
  }

  // ── ROOM CLEAR ───────────────────────────────────────────────

  _checkRoomClear() {
    if (this.cleared) return
    if (this.enemies.length > 0 && this.enemies.every(e => e.state === 'dead')) {
      this._onRoomCleared()
    }
  }

  _onRoomCleared() {
    if (this.cleared) return
    this.cleared = true
    RunState.clearRoom()

    // Open exit doors / show reward
    this.time.delayedCall(600, () => {
      this._showExitOptions()
    })
  }

  _showExitOptions() {
    const exits = this.mapData?.edges
      .filter(([a, b]) => a === this.roomData.id || b === this.roomData.id)
      .map(([a, b]) => a === this.roomData.id ? b : a)
      .filter(id => !RunState.get().visitedRooms.has(id))
      ?? []

    if (exits.length === 0) {
      // No more exits — this was the last room (or boss)
      this._endRun()
      return
    }

    // Transition to next room selection or directly to next room
    this.scene.start(SCENES.TRANSITION, {
      exitRoomIds: exits,
      mapData:     this.mapData,
      seed:        this.seed,
    })
  }

  _endRun() {
    // Victory — back to hub
    this.scene.start(SCENES.HUB)
  }

  // ── CAMERA ───────────────────────────────────────────────────

  _setupCamera() {
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight)
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)
  }

  // ── EVENTS ───────────────────────────────────────────────────

  _bindEvents() {
    // Enemy attacks the player
    EventBus.on('enemy:attack', ({ damage, sourceX }) => {
      this.player.takeDamage(damage, sourceX)
    }, this)

    // Player death
    EventBus.on(EV.PLAYER_DEATH, () => {
      this.time.delayedCall(800, () => {
        this.scene.start(SCENES.GAME_OVER)
      })
    }, this)

    // Enemy death — collect scrap
    EventBus.on(EV.ENEMY_DEATH, ({ scrap }) => {
      RunState.addScrap(scrap)
      RunState.addKill()
    }, this)
  }

  // Clean up listeners when scene sleeps/shuts down
  shutdown() {
    EventBus.off('enemy:attack', null, this)
    EventBus.off(EV.PLAYER_DEATH, null, this)
    EventBus.off(EV.ENEMY_DEATH,  null, this)
  }
}

export default RoomScene
