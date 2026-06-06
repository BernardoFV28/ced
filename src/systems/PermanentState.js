/**
 * PermanentState — meta-progressão persistida no localStorage.
 * Sobrevive à morte. Gerencia Ecos (moeda permanente) e upgrades do Hub.
 */
import EventBus from './EventBus'
import { EV } from '../utils/constants'

const STORAGE_KEY = 'cd_permanent_v1'

const _defaultData = () => ({
  echos:          0,
  totalRuns:      0,
  totalKills:     0,
  bestDepth:      0,
  unlockedNodes:  [],   // IDs dos nós da árvore de upgrades desbloqueados
  hubUpgrades:    {},   // { nodeId: level }
  loreFragments:  [],   // fragmentos de lore encontrados
  firstRun:       true,
})

let _data = _defaultData()

const PermanentState = {
  load () {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) _data = { ..._defaultData(), ...JSON.parse(raw) }
    } catch (e) {
      console.warn('[PermanentState] Failed to load, using defaults', e)
    }
    return _data
  },

  save () {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_data))
    } catch (e) {
      console.warn('[PermanentState] Failed to save', e)
    }
  },

  get () { return { ..._data, unlockedNodes: [..._data.unlockedNodes] } },

  // ── ECHOS ────────────────────────────────────────────────────
  addEchos (amount) {
    _data.echos += amount
    EventBus.emit(EV.ECHO_CHANGE, _data.echos)
    PermanentState.save()
  },

  spendEchos (amount) {
    if (_data.echos < amount) return false
    _data.echos -= amount
    EventBus.emit(EV.ECHO_CHANGE, _data.echos)
    PermanentState.save()
    return true
  },

  // ── RUN STATS ────────────────────────────────────────────────
  recordRunEnd ({ kills, depth, echoGain }) {
    _data.totalRuns++
    _data.totalKills += kills
    _data.bestDepth   = Math.max(_data.bestDepth, depth)
    _data.firstRun    = false
    if (echoGain > 0) PermanentState.addEchos(echoGain)
    PermanentState.save()
  },

  // ── HUB UPGRADES ─────────────────────────────────────────────
  unlockNode (nodeId) {
    if (!_data.unlockedNodes.includes(nodeId)) {
      _data.unlockedNodes.push(nodeId)
      _data.hubUpgrades[nodeId] = 1
      PermanentState.save()
    }
  },

  upgradeNode (nodeId) {
    const current = _data.hubUpgrades[nodeId] ?? 0
    _data.hubUpgrades[nodeId] = current + 1
    PermanentState.save()
  },

  getNodeLevel (nodeId) { return _data.hubUpgrades[nodeId] ?? 0 },

  isUnlocked (nodeId)   { return _data.unlockedNodes.includes(nodeId) },

  // ── LORE ─────────────────────────────────────────────────────
  collectLore (fragmentId) {
    if (!_data.loreFragments.includes(fragmentId)) {
      _data.loreFragments.push(fragmentId)
      PermanentState.save()
    }
  },

  // ── DEV ──────────────────────────────────────────────────────
  reset () {
    _data = _defaultData()
    localStorage.removeItem(STORAGE_KEY)
  },
}

export default PermanentState
