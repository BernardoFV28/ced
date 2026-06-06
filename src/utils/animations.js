/**
 * animations.js — tweens e efeitos de câmera reutilizáveis.
 */

/**
 * Tween de flash de cor em um sprite (hit flash branco).
 */
export function hitFlash(scene, sprite, duration = 100) {
  scene.tweens.add({
    targets:  sprite,
    tintFill: true,
    alpha:    { from: 1, to: 0.6 },
    duration: duration / 2,
    yoyo:     true,
    onStart:  () => sprite.setTintFill(0xffffff),
    onComplete: () => {
      sprite.clearTint()
      sprite.setAlpha(1)
    },
  })
}

/**
 * Tween de "popping" ao pegar relíquia.
 */
export function popIn(scene, obj) {
  obj.setScale(0)
  scene.tweens.add({
    targets:  obj,
    scaleX:   { from: 0, to: 1 },
    scaleY:   { from: 0, to: 1 },
    ease:     'Back.easeOut',
    duration: 250,
  })
}

/**
 * Fade-in de texto.
 */
export function fadeIn(scene, obj, duration = 300, delay = 0) {
  obj.setAlpha(0)
  scene.tweens.add({ targets: obj, alpha: 1, duration, delay })
}

/**
 * Shake horizontal (como ao receber dano).
 */
export function shakeHorizontal(scene, obj, intensity = 4, duration = 200) {
  scene.tweens.add({
    targets:  obj,
    x:        `+=${intensity}`,
    duration: duration / 6,
    yoyo:     true,
    repeat:   5,
    ease:     'Sine.easeInOut',
  })
}
