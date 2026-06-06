/**
 * Player — entidade principal, gerencia movimento, combate e estado de animação.
 * Usa Arcade Physics. Emite eventos no EventBus para desacoplar da UI.
 *
 * Criação:
 *   this.player = new Player(scene, x, y)
 *   this.player.create()
 */
import Phaser from 'phaser'
import EventBus from '../systems/EventBus'
import RunState  from '../systems/RunState'
import {
  EV, GRAVITY, PLAYER_SPEED, PLAYER_JUMP, DASH_SPEED, DASH_DURATION,
  DASH_COOLDOWN, IFRAME_DURATION, PARRY_WINDOW, PARRY_COOLDOWN,
  PLAYER_BASE_DMG, PARRY_DMG_BONUS, EXECUTION_HP_THR,
} from '../utils/constants'

// Animation state machine keys
export const ANIM = {
  IDLE:      'player_idle',
  RUN:       'player_run',
  JUMP:      'player_jump',
  FALL:      'player_fall',
  ATTACK1:   'player_atk1',
  ATTACK2:   'player_atk2',
  DASH:      'player_dash',
  PARRY:     'player_parry',
  PARRY_HIT: 'player_parry_hit',
  HURT:      'player_hurt',
  DEATH:     'player_death',
  EXECUTE:   'player_execute',
}

class Player {
  constructor(scene, x, y) {
    this.scene  = scene
    this.startX = x
    this.startY = y

    // Combat state
    this.isAttacking  = false
    this.isParrying   = false
    this.isDashing    = false
    this.isInvincible = false
    this.isDead       = false
    this.facingRight  = true

    // Timers (ms)
    this._dashCooldownTimer  = 0
    this._parryCooldownTimer = 0
    this._parryWindowTimer   = 0
    this._attackComboTimer   = 0
    this._comboStep          = 0

    // Attack hitbox (created once, enabled per swing)
    this.attackBox = null
    this.sprite    = null
  }

  // ── LIFECYCLE ────────────────────────────────────────────────

  create() {
    const scene = this.scene

    this.sprite = scene.physics.add.sprite(this.startX, this.startY, 'player')
    this.sprite.setGravityY(GRAVITY)
    this.sprite.setCollideWorldBounds(true)
    this.sprite.setSize(10, 20)   // hitbox smaller than sprite
    this.sprite.setOffset(11, 12)

    // Attack hitbox — static rectangle, enabled/disabled per attack
    this.attackBox = scene.add.rectangle(0, 0, 28, 14)
    scene.physics.add.existing(this.attackBox, false)
    this.attackBox.body.setAllowGravity(false)
    this.attackBox.setActive(false).setVisible(false)

    this._registerAnimations()
    this._registerInputs()

    return this
  }

  update(delta) {
    if (this.isDead) return

    this._updateTimers(delta)
    this._handleMovement()
    this._updateAttackBoxPosition()
    this._updateAnimationState()
  }

  destroy() {
    this.sprite?.destroy()
    this.attackBox?.destroy()
  }

  // ── MOVEMENT ─────────────────────────────────────────────────

  _handleMovement() {
    const { cursors, keys } = this.scene.inputKeys
    const body = this.sprite.body

    if (this.isDashing || this.isAttacking) return

    // Horizontal
    if (cursors.left.isDown || keys.A.isDown) {
      this.sprite.setVelocityX(-PLAYER_SPEED)
      this.facingRight = false
      this.sprite.setFlipX(true)
    } else if (cursors.right.isDown || keys.D.isDown) {
      this.sprite.setVelocityX(PLAYER_SPEED)
      this.facingRight = true
      this.sprite.setFlipX(false)
    } else {
      this.sprite.setVelocityX(0)
    }

    // Jump
    if ((cursors.up.isDown || keys.W.isDown || keys.SPACE.isDown) && body.blocked.down) {
      this.sprite.setVelocityY(PLAYER_JUMP)
    }
  }

  _doDash() {
    if (this._dashCooldownTimer > 0 || this.isDashing) return

    this.isDashing    = true
    this.isInvincible = true
    this._dashCooldownTimer = DASH_COOLDOWN

    const dir = this.facingRight ? 1 : -1
    this.sprite.setVelocityX(DASH_SPEED * dir)
    this.sprite.setVelocityY(0)

    EventBus.emit(EV.PLAYER_DASH)

    this.scene.time.delayedCall(DASH_DURATION, () => {
      this.isDashing = false
    })
    this.scene.time.delayedCall(IFRAME_DURATION, () => {
      this.isInvincible = false
    })
  }

  // ── COMBAT ───────────────────────────────────────────────────

  _doAttack() {
    if (this.isAttacking || this.isParrying) return

    this.isAttacking = true
    const isCombo = this._comboStep === 1 && this._attackComboTimer > 0
    const animKey = isCombo ? ANIM.ATTACK2 : ANIM.ATTACK1

    this._comboStep = isCombo ? 0 : 1
    this._attackComboTimer = 400  // ms to keep combo window

    // Enable attack hitbox
    this.attackBox.setActive(true)
    this.attackBox.body.setEnable(true)

    this.sprite.play(animKey, true)
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isAttacking = false
      this.attackBox.setActive(false)
      this.attackBox.body.setEnable(false)
    })
  }

  _doParry() {
    if (this._parryCooldownTimer > 0 || this.isAttacking) return

    this.isParrying          = true
    this._parryWindowTimer   = PARRY_WINDOW
    this._parryCooldownTimer = PARRY_COOLDOWN

    this.sprite.play(ANIM.PARRY, true)
    this.scene.time.delayedCall(PARRY_WINDOW + 80, () => {
      this.isParrying = false
    })
  }

  // Called externally when an enemy attack lands during parry window
  onParrySuccess(attackSource) {
    EventBus.emit(EV.PLAYER_PARRY_OK, attackSource)
    this.sprite.play(ANIM.PARRY_HIT, true)
    // Give a brief counter-attack opening
    this.scene.time.delayedCall(100, () => this._doAttack())
  }

  takeDamage(amount, sourceX) {
    if (this.isInvincible || this.isDead) return

    // Check parry window
    if (this.isParrying && this._parryWindowTimer > 0) {
      this.onParrySuccess({ x: sourceX })
      return
    }

    this.isInvincible = true
    RunState.takeDamage(amount)

    // Knockback
    const dir = this.sprite.x < sourceX ? -1 : 1
    this.sprite.setVelocityX(200 * dir)

    this.sprite.play(ANIM.HURT, true)
    this.scene.time.delayedCall(300, () => {
      this.isInvincible = false
    })
  }

  // ── HELPERS ──────────────────────────────────────────────────

  getAttackDamage() {
    return RunState.getBuff('dmgMult')
      ? PLAYER_BASE_DMG * RunState.getBuff('dmgMult').value
      : PLAYER_BASE_DMG
  }

  get x()  { return this.sprite.x }
  get y()  { return this.sprite.y }
  get body() { return this.sprite.body }

  canExecute(enemy) {
    const state = RunState.get()
    return (state.hp / state.maxHp) > 0.05  // can't execute when almost dead
      && enemy.hp / enemy.maxHp <= EXECUTION_HP_THR
  }

  // ── TIMERS UPDATE ─────────────────────────────────────────────

  _updateTimers(delta) {
    if (this._dashCooldownTimer  > 0) this._dashCooldownTimer  -= delta
    if (this._parryCooldownTimer > 0) this._parryCooldownTimer -= delta
    if (this._parryWindowTimer   > 0) this._parryWindowTimer   -= delta
    if (this._attackComboTimer   > 0) this._attackComboTimer   -= delta
  }

  _updateAttackBoxPosition() {
    if (!this.attackBox.active) return
    const offset = this.facingRight ? 20 : -20
    this.attackBox.setPosition(this.sprite.x + offset, this.sprite.y)
  }

  _updateAnimationState() {
    if (this.isAttacking || this.isParrying || this.isDashing) return

    const body = this.sprite.body
    const vx   = body.velocity.x
    const vy   = body.velocity.y

    if (!body.blocked.down) {
      this.sprite.play(vy < 0 ? ANIM.JUMP : ANIM.FALL, true)
    } else if (Math.abs(vx) > 10) {
      this.sprite.play(ANIM.RUN, true)
    } else {
      this.sprite.play(ANIM.IDLE, true)
    }
  }

  // ── ANIMATION REGISTRATION ────────────────────────────────────

  _registerAnimations() {
    const anims = this.scene.anims

    // Only register if not yet registered
    if (anims.exists(ANIM.IDLE)) return

    const defs = [
      { key: ANIM.IDLE,      frames: { start: 0, end: 5  }, frameRate: 8,  repeat: -1 },
      { key: ANIM.RUN,       frames: { start: 6, end: 13 }, frameRate: 12, repeat: -1 },
      { key: ANIM.JUMP,      frames: { start: 14, end: 15 }, frameRate: 6, repeat: -1 },
      { key: ANIM.FALL,      frames: { start: 16, end: 17 }, frameRate: 6, repeat: -1 },
      { key: ANIM.ATTACK1,   frames: { start: 18, end: 22 }, frameRate: 14, repeat: 0 },
      { key: ANIM.ATTACK2,   frames: { start: 23, end: 28 }, frameRate: 14, repeat: 0 },
      { key: ANIM.DASH,      frames: { start: 29, end: 30 }, frameRate: 10, repeat: 0 },
      { key: ANIM.PARRY,     frames: { start: 31, end: 32 }, frameRate: 10, repeat: 0 },
      { key: ANIM.PARRY_HIT, frames: { start: 33, end: 35 }, frameRate: 12, repeat: 0 },
      { key: ANIM.HURT,      frames: { start: 36, end: 37 }, frameRate: 10, repeat: 0 },
      { key: ANIM.DEATH,     frames: { start: 38, end: 43 }, frameRate: 8,  repeat: 0 },
      { key: ANIM.EXECUTE,   frames: { start: 44, end: 50 }, frameRate: 12, repeat: 0 },
    ]

    defs.forEach(({ key, frames, frameRate, repeat }) => {
      anims.create({
        key,
        frames: anims.generateFrameNumbers('player', frames),
        frameRate,
        repeat,
      })
    })
  }

  _registerInputs() {
    const scene = this.scene
    scene.inputKeys = {
      cursors: scene.input.keyboard.createCursorKeys(),
      keys: scene.input.keyboard.addKeys({
        A: Phaser.Input.Keyboard.KeyCodes.A,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        W: Phaser.Input.Keyboard.KeyCodes.W,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        SPACE:  Phaser.Input.Keyboard.KeyCodes.SPACE,
        ATTACK: Phaser.Input.Keyboard.KeyCodes.Z,
        PARRY:  Phaser.Input.Keyboard.KeyCodes.X,
        DASH:   Phaser.Input.Keyboard.KeyCodes.C,
        MAP:    Phaser.Input.Keyboard.KeyCodes.M,
        INV:    Phaser.Input.Keyboard.KeyCodes.I,
      }),
    }

    // Key down events — single-press actions
    scene.input.keyboard.on('keydown-Z', () => this._doAttack())
    scene.input.keyboard.on('keydown-X', () => this._doParry())
    scene.input.keyboard.on('keydown-C', () => this._doDash())
    scene.input.keyboard.on('keydown-M', () => EventBus.emit(EV.UI_OPEN_MAP))
    scene.input.keyboard.on('keydown-I', () => EventBus.emit(EV.UI_OPEN_INVENTORY))
  }
}

export default Player
