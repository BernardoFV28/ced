/**
 * relics.js — catálogo de todas as relíquias/implantes da run.
 * Cada relíquia é um objeto com id, name, type, description, e hooks de efeito.
 *
 * Hooks disponíveis:
 *   onPickup(RunState, state)   — efeito imediato ao pegar
 *   onAttack(state, enemy)      — chamado a cada ataque do player
 *   onParry(state)              — chamado em cada parry bem-sucedido
 *   onKill(state, enemy)        — chamado ao matar inimigo
 *   onRoomClear(state)          — chamado ao limpar sala
 *   onHit(state, damage)        — chamado ao tomar dano
 */
import { RELIC_TYPES } from '../utils/constants'

const RELICS = [
  // ── IMPLANTS (passivos) ─────────────────────────────────────

  {
    id:          'iron_nerve',
    name:        'Nervo de Ferro',
    type:        RELIC_TYPES.IMPLANT,
    description: 'A janela de parry aumenta em 80ms.',
    rarity:      'common',
    onPickup(RunState) {
      RunState.addBuff('parryWindowBonus', { value: 80 })
    },
  },

  {
    id:          'scrap_marrow',
    name:        'Tutano de Ferro-Velho',
    type:        RELIC_TYPES.IMPLANT,
    description: 'Ganha +3 scrap a cada inimigo morto.',
    rarity:      'common',
    onKill(state, enemy) {
      const RunState = require('../systems/RunState').default
      RunState.addScrap(3)
    },
  },

  {
    id:          'blood_firmware',
    name:        'Firmware Sanguíneo',
    type:        RELIC_TYPES.IMPLANT,
    description: 'Cada parry bem-sucedido cura 4 HP.',
    rarity:      'uncommon',
    onParry(state) {
      const RunState = require('../systems/RunState').default
      RunState.heal(4)
    },
  },

  {
    id:          'overclock',
    name:        'Sobrecarga',
    type:        RELIC_TYPES.IMPLANT,
    description: 'Dano +40%. HP máximo -20%.',
    rarity:      'rare',
    onPickup(RunState, state) {
      RunState.addBuff('dmgMult', { value: 1.4 })
      RunState.setMaxHp(Math.floor(state.maxHp * 0.8))
    },
  },

  {
    id:          'phantom_limb',
    name:        'Membro Fantasma',
    type:        RELIC_TYPES.IMPLANT,
    description: 'Após um dash, próximo ataque causa dano duplo.',
    rarity:      'uncommon',
    // handled in CombatSystem via buff flag
    onPickup(RunState) {
      RunState.addBuff('phantomLimb', { active: true, ready: false })
    },
  },

  {
    id:          'dogma_shard',
    name:        'Estilhaço de Dogma',
    type:        RELIC_TYPES.IMPLANT,
    description: 'A cada 5 inimigos mortos, recupera 10 HP.',
    rarity:      'uncommon',
    _killCounter: 0,
    onKill(state) {
      this._killCounter++
      if (this._killCounter >= 5) {
        this._killCounter = 0
        const RunState = require('../systems/RunState').default
        RunState.heal(10)
      }
    },
  },

  // ── DOCTRINES (ativo — substitui segundo ataque) ─────────────

  {
    id:          'doctrine_wrath',
    name:        'Doutrina da Ira',
    type:        RELIC_TYPES.DOCTRINE,
    description: 'Ativa: lança um projétil explosivo de plasma corrosivo.',
    rarity:      'uncommon',
    // Activation handled in Player._doAttack() when comboStep=1 and doctrine equipped
    activationCooldown: 3000,
  },

  {
    id:          'doctrine_silence',
    name:        'Doutrina do Silêncio',
    type:        RELIC_TYPES.DOCTRINE,
    description: 'Ativa: teleporte curto que deixa uma marca de explosão temporal.',
    rarity:      'rare',
    activationCooldown: 4500,
  },

  // ── EFFIGIES (poder com maldição) ────────────────────────────

  {
    id:          'effigy_martyr',
    name:        'Efígie do Mártir',
    type:        RELIC_TYPES.EFFIGY,
    description: 'Dano +80%. Você não pode curar HP.',
    rarity:      'cursed',
    onPickup(RunState) {
      RunState.addBuff('dmgMult',    { value: 1.8 })
      RunState.addBuff('noHealing', { value: true })
    },
  },

  {
    id:          'effigy_void',
    name:        'Efígie do Vazio',
    type:        RELIC_TYPES.EFFIGY,
    description: 'Inimigos mortos explodem, causando 20 de dano em área. Seu HP máximo é 1.',
    rarity:      'cursed',
    onPickup(RunState) {
      RunState.setMaxHp(1)
      RunState.addBuff('deathExplosion', { damage: 20, radius: 80 })
    },
  },
]

export default RELICS

// Helper: get relic by ID
export function getRelicById(id) {
  return RELICS.find(r => r.id === id)
}

// Helper: random set of N relics for room reward
export function getRandomRelics(count = 3, rng = Math.random) {
  const shuffled = [...RELICS].sort(() => rng() - 0.5)
  return shuffled.slice(0, count)
}
