/**
 * upgrades.js — árvore de upgrades permanentes do Hub.
 * Cada nó tem um custo em Ecos, pré-requisitos e efeito aplicado ao iniciar run.
 */

export const UPGRADE_TREE = [
  // ── TIER 1 — sempre disponível ──────────────────────────────
  {
    id:       'hp_base_1',
    name:     'Carne Reforçada I',
    desc:     '+15 HP máximo base.',
    tier:     1,
    cost:     20,
    requires: [],
    apply(RunState) {
      RunState.setMaxHp(RunState.get().maxHp + 15)
    },
  },
  {
    id:       'scrap_gain_1',
    name:     'Extração Eficiente',
    desc:     '+2 scrap por inimigo morto.',
    tier:     1,
    cost:     15,
    requires: [],
    apply() {
      // Handled in RoomScene kill event via PermanentState flag
    },
  },
  {
    id:       'dash_cd_1',
    name:     'Reflexo Subdermal',
    desc:     'Cooldown do dash -100ms.',
    tier:     1,
    cost:     25,
    requires: [],
    apply() { /* constants overridden at run start */ },
  },

  // ── TIER 2 ───────────────────────────────────────────────────
  {
    id:       'hp_base_2',
    name:     'Carne Reforçada II',
    desc:     '+20 HP máximo base.',
    tier:     2,
    cost:     40,
    requires: ['hp_base_1'],
    apply(RunState) {
      RunState.setMaxHp(RunState.get().maxHp + 20)
    },
  },
  {
    id:       'parry_window_1',
    name:     'Olho Cibernético',
    desc:     'Janela de parry +60ms.',
    tier:     2,
    cost:     35,
    requires: ['dash_cd_1'],
    apply(RunState) {
      RunState.addBuff('parryWindowBonus', { value: 60 })
    },
  },
  {
    id:       'start_relic',
    name:     'Implante Vestígial',
    desc:     'Começa cada run com uma relíquia aleatória comum.',
    tier:     2,
    cost:     50,
    requires: ['scrap_gain_1'],
    apply(RunState) {
      const { getRandomRelics } = require('./relics')
      const [relic] = getRandomRelics(1)
      if (relic) RunState.addRelic(relic)
    },
  },

  // ── TIER 3 ───────────────────────────────────────────────────
  {
    id:       'execution_heal',
    name:     'Ritual de Extração',
    desc:     'Execuções curam 8 HP.',
    tier:     3,
    cost:     70,
    requires: ['parry_window_1', 'hp_base_2'],
    apply(RunState) {
      RunState.addBuff('executionHeal', { value: 8 })
    },
  },
  {
    id:       'echo_conversion',
    name:     'Conversor de Ecos',
    desc:     'Ao fim da run, converte metade do scrap restante em Ecos.',
    tier:     3,
    cost:     60,
    requires: ['scrap_gain_1'],
    apply() { /* handled in GameOverScene */ },
  },
]

// Apply all unlocked upgrades at the start of a run
export function applyPermanentUpgrades(RunState, PermanentState) {
  UPGRADE_TREE.forEach(node => {
    const level = PermanentState.getNodeLevel(node.id)
    if (level > 0 && node.apply) {
      // Apply once per unlock level
      for (let i = 0; i < level; i++) {
        node.apply(RunState)
      }
    }
  })
}
