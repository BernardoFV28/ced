/**
 * HUD — helpers para componentes individuais do HUD.
 * A UIScene usa esses helpers para construir elementos reutilizáveis.
 */

/**
 * FloatingText — número de dano flutuante sobre inimigos.
 * Uso: FloatingText.spawn(scene, x, y, text, color)
 */
export class FloatingText {
  static spawn(scene, x, y, text, color = '#ffffff') {
    const t = scene.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color,
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5)

    scene.tweens.add({
      targets:  t,
      y:        y - 22,
      alpha:    { from: 1, to: 0 },
      duration: 600,
      ease:     'Power2',
      onComplete: () => t.destroy(),
    })

    return t
  }

  static spawnDamage(scene, x, y, amount, isCrit = false) {
    const color = isCrit ? '#ffdd00' : '#ff4444'
    const text  = isCrit ? `${amount}!` : `${amount}`
    const fontSize = isCrit ? '11px' : '8px'

    const t = scene.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize,
      color,
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5)

    scene.tweens.add({
      targets:  t,
      y:        y - 28,
      alpha:    { from: 1, to: 0 },
      duration: 700,
      ease:     'Power2',
      onComplete: () => t.destroy(),
    })
  }

  static spawnHeal(scene, x, y, amount) {
    FloatingText.spawn(scene, x, y, `+${amount}`, '#44ee66')
  }
}

/**
 * ScreenFlash — flash breve na câmera (hit feedback)
 */
export function flashCamera(scene, color = 0xff0000, duration = 100) {
  scene.cameras.main.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff)
}

/**
 * ScreenShake — câmera chacoalha (boss hit, death)
 */
export function shakeCamera(scene, intensity = 0.008, duration = 200) {
  scene.cameras.main.shake(duration, intensity)
}
