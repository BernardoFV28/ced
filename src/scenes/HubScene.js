/**
 * HubScene — área segura entre runs.
 * Permite gastar Ecos, ver upgrades e iniciar nova run.
 */
import Phaser from 'phaser'
import EventBus       from '../systems/EventBus'
import RunState       from '../systems/RunState'
import PermanentState from '../systems/PermanentState'
import ProceduralGen  from '../systems/ProceduralGen'
import { EV, SCENES } from '../utils/constants'

class HubScene extends Phaser.Scene {
  constructor() { super(SCENES.HUB) }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a0c')

    this._buildMap()
    this._buildUI()
    this._spawnPlayer()
    this._setupInteractions()

    // Launch UI overlay
    if (!this.scene.isActive(SCENES.UI)) {
      this.scene.launch(SCENES.UI)
    }

    // Play hub bgm
    if (!this.sound.get('bgm_hub')?.isPlaying) {
      this.sound.play('bgm_hub', { loop: true, volume: 0.4 })
    }
  }

  _buildMap() {
    const map     = this.make.tilemap({ key: 'map_hub' })
    const tileset = map.addTilesetImage('tileset', 'tileset_ruins')

    map.createLayer('Background', tileset, 0, 0)
    this.platforms = map.createLayer('Platforms', tileset, 0, 0)
    this.platforms.setCollisionByExclusion([-1])
    map.createLayer('Foreground', tileset, 0, 0)

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
  }

  _spawnPlayer() {
    // Re-use Player from entities
    const Player = require('../entities/Player').default
    this.player = new Player(this, 120, 80)
    this.player.create()
    this.physics.add.collider(this.player.sprite, this.platforms)
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)
  }

  _buildUI() {
    const perm = PermanentState.get()

    // Run counter
    this.add.text(8, 8, `runs: ${perm.totalRuns}  ecos: ${perm.echos}Ξ  melhor: profundidade ${perm.bestDepth}`, {
      fontFamily: 'monospace', fontSize: '6px', color: '#445566',
    })

    // "START RUN" prompt near the portal
    this.startText = this.add.text(200, 60, '[ E ] iniciar run', {
      fontFamily: 'monospace', fontSize: '8px', color: '#c8a87a',
    }).setOrigin(0.5).setAlpha(0)
  }

  _setupInteractions() {
    // Portal interaction zone
    this.portalZone = this.add.zone(200, 80, 40, 40)
    this.physics.world.enable(this.portalZone)
    this.portalZone.body.setAllowGravity(false)

    this.input.keyboard.on('keydown-E', () => {
      if (this._nearPortal()) this._startRun()
    })
  }

  _nearPortal() {
    if (!this.player) return false
    return Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      200, 80,
    ) < 50
  }

  _startRun() {
    const seed   = Date.now() % 0xFFFFFF
    const gen    = new ProceduralGen(seed)
    const mapData = gen.generate()

    RunState.reset(seed)
    RunState.setMap(mapData)

    this.cameras.main.fade(400, 0, 0, 0)
    this.time.delayedCall(400, () => {
      this.sound.stopByKey('bgm_hub')
      this.scene.start(SCENES.ROOM, {
        roomData: mapData.startRoom,
        mapData,
        seed,
      })
    })
  }

  update(_, delta) {
    this.player?.update(delta)

    // Show/hide portal prompt
    if (this._nearPortal()) {
      this.tweens.add({ targets: this.startText, alpha: 1, duration: 200 })
    } else {
      this.tweens.add({ targets: this.startText, alpha: 0, duration: 200 })
    }
  }
}

export default HubScene
