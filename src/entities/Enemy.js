/**
 * Enemy — base class para todos os inimigos.
 * Cada variante estende esta classe e sobrescreve _aiUpdate() e _getPattern().
 */
import Phaser from 'phaser'
import EventBus from '../systems/EventBus'
import { EV, SCRAP_PER_ENEMY } from '../utils/constants'

export const ENEMY_STATE = {
  IDLE:       'idle',
  PATROL:     'patrol',
  CHASE:      'chase',
  TELEGRAPH:  'telegraph',  // wind-up before attack
  ATTACK:     'attack',
  HURT:       'hurt',
  DEAD:       'dead',
}

class Enemy {
  constructor(scene, x, y, config = {}) {
    this.scene  = scene
    this.startX = x
    this.startY = y

    // Stats from config (overridden by subclasses)
    this.maxHp        = config.maxHp     ?? 40
    this.hp           = this.maxHp
    this.speed        = config.speed     ?? 60
    this.attackDamage = config.damage    ?? 15
    this.scrapDrop    = config.scrapDrop ?? SCRAP_PER_ENEMY
    this.key          = config.key       ?? 'enemy_grunt'
    this.aggroRange   = config.aggroRange ?? 140
    this.attackRange  = config.attackRange ?? 36

    this.state     = ENEMY_STATE.IDLE
    this.facingRight = true
    this.sprite    = null

    // Timers
    this._stateTimer     = 0
    this._attackCooldown = 0
  }

  // ── LIFECYCLE ────────────────────────────────────────────────

  create() {
    this.sprite = this.scene.physics.add.sprite(this.startX, this.startY, this.key)
    this.sprite.setCollideWorldBounds(true)
    this.sprite.setSize(12, 22)
    this.sprite.setOffset(10, 10)
    this.sprite.body.setAllowGravity(true)

    // HP bar (drawn as graphics above sprite)
    this.hpBar = this.scene.add.graphics()
    this._drawHpBar()

    return this
  }

  update(delta, player) {
    if (this.state === ENEMY_STATE.DEAD) return

    this._updateTimers(delta)
    this._aiUpdate(delta, player)
    this._updateHpBarPosition()
  }

  destroy() {
    this.sprite?.destroy()
    this.hpBar?.destroy()
  }

  // ── AI — override in subclasses ──────────────────────────────

  _aiUpdate(delta, player) {
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, player.x, player.y)

    switch (this.state) {
      case ENEMY_STATE.IDLE:
      case ENEMY_STATE.PATROL:
        if (dist < this.aggroRange) this._setState(ENEMY_STATE.CHASE)
        break

      case ENEMY_STATE.CHASE:
        if (dist > this.aggroRange * 1.4) { this._setState(ENEMY_STATE.PATROL); break }
        if (dist < this.attackRange && this._attackCooldown <= 0) {
          this._setState(ENEMY_STATE.TELEGRAPH)
          break
        }
        this._moveToward(player)
        break

      case ENEMY_STATE.TELEGRAPH:
        // Stand still, then attack
        this.sprite.setVelocityX(0)
        if (this._stateTimer <= 0) this._setState(ENEMY_STATE.ATTACK)
        break

      case ENEMY_STATE.ATTACK:
        this._doAttack(player)
        this._attackCooldown = 1200
        this._setState(ENEMY_STATE.CHASE)
        break

      case ENEMY_STATE.HURT:
        if (this._stateTimer <= 0) this._setState(ENEMY_STATE.CHASE)
        break
    }
  }

  // ── COMBAT ───────────────────────────────────────────────────

  takeDamage(amount, isCrit = false) {
    const finalAmount = isCrit ? amount * 1.5 : amount
    this.hp = Math.max(0, this.hp - finalAmount)
    this._drawHpBar()

    EventBus.emit(EV.ENEMY_HIT, { enemy: this, amount: finalAmount, isCrit })

    if (this.hp <= 0) {
      this._die()
    } else {
      this._setState(ENEMY_STATE.HURT)
      this._stateTimer = 200
    }

    return finalAmount
  }

  _doAttack(player) {
    // Emit an attack event — CombatSystem checks for parry, applies damage
    EventBus.emit('enemy:attack', {
      enemy:    this,
      damage:   this.attackDamage,
      sourceX:  this.sprite.x,
    })
  }

  _die() {
    this.state = ENEMY_STATE.DEAD
    this.sprite.setVelocityX(0)

    EventBus.emit(EV.ENEMY_DEATH, { enemy: this, scrap: this.scrapDrop })

    // Death animation then destroy
    this.scene.time.delayedCall(400, () => this.destroy())
  }

  // ── MOVEMENT ─────────────────────────────────────────────────

  _moveToward(target) {
    const dx = target.x - this.sprite.x
    this.facingRight = dx > 0
    this.sprite.setFlipX(!this.facingRight)
    this.sprite.setVelocityX(this.speed * Math.sign(dx))
  }

  // ── STATE MACHINE ─────────────────────────────────────────────

  _setState(newState, duration = 600) {
    this.state       = newState
    this._stateTimer = duration
  }

  // ── HELPERS ──────────────────────────────────────────────────

  _updateTimers(delta) {
    if (this._stateTimer     > 0) this._stateTimer     -= delta
    if (this._attackCooldown > 0) this._attackCooldown -= delta
  }

  _drawHpBar() {
    if (!this.hpBar) return
    this.hpBar.clear()
    const w   = 28
    const pct = this.hp / this.maxHp
    // Background
    this.hpBar.fillStyle(0x1a1a1a, 0.8)
    this.hpBar.fillRect(-w / 2, -20, w, 4)
    // Fill — green→red based on HP
    const color = pct > 0.5 ? 0x44cc55 : pct > 0.25 ? 0xeeaa22 : 0xcc3333
    this.hpBar.fillStyle(color, 1)
    this.hpBar.fillRect(-w / 2, -20, w * pct, 4)
  }

  _updateHpBarPosition() {
    if (!this.hpBar || !this.sprite) return
    this.hpBar.setPosition(this.sprite.x, this.sprite.y)
  }

  // Accessors
  get x() { return this.sprite.x }
  get y() { return this.sprite.y }
  isDead() { return this.state === ENEMY_STATE.DEAD }
}

export default Enemy
