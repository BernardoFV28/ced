/**
 * RunState — estado volátil da run atual.
 * Destruído ao morrer. Nunca persiste no localStorage.
 *
 * Acesso: import RunState from '../systems/RunState'
 *         RunState.reset()          // início de run
 *         RunState.get()            // lê snapshot
 *         RunState.addRelic(relic)  // pickup de relíquia
 */
import EventBus from './EventBus'
import { EV, PLAYER_MAX_HP } from '../utils/constants'

const _default = () => ({
  hp:           PLAYER_MAX_HP,
  maxHp:        PLAYER_MAX_HP,
  scrap:        0,          // moeda da run (perde ao morrer)
  relics:       [],         // relíquias coletadas
  implants:     [],         // implantes equipados
  runDepth:     0,          // quantas salas concluídas
  roomsCleared: 0,
  bossesKilled: 0,
  kills:        0,
  seed:         null,       // seed da geração procedural
  mapData:      null,       // grafo de salas gerado
  currentRoom:  null,
  visitedRooms: new Set(),
  startedAt:    null,
  buffs:        {},         // efeitos temporários ativos
})

let _state = _default()

const RunState = {
  reset (seed = null) {
    _state = _default()
    _state.seed = seed ?? Math.floor(Math.random() * 0xFFFFFF)
    _state.startedAt = Date.now()
    EventBus.emit(EV.RUN_START, _state)
    return _state
  },

  get () { return { ..._state, relics: [..._state.relics], implants: [..._state.implants] } },

  // ── HP ──────────────────────────────────────────────────────
  takeDamage (amount) {
    _state.hp = Math.max(0, _state.hp - amount)
    EventBus.emit(EV.PLAYER_HIT, { hp: _state.hp, amount })
    if (_state.hp <= 0) EventBus.emit(EV.PLAYER_DEATH)
    return _state.hp
  },

  heal (amount) {
    _state.hp = Math.min(_state.maxHp, _state.hp + amount)
    EventBus.emit(EV.PLAYER_HEAL, { hp: _state.hp, amount })
    return _state.hp
  },

  setMaxHp (value) {
    const prev = _state.maxHp
    _state.maxHp = value
    if (value > prev) _state.hp += (value - prev)   // auto-heal on max increase
  },

  // ── SCRAP ────────────────────────────────────────────────────
  addScrap (amount) {
    _state.scrap += amount
    EventBus.emit(EV.SCRAP_CHANGE, _state.scrap)
  },

  spendScrap (amount) {
    if (_state.scrap < amount) return false
    _state.scrap -= amount
    EventBus.emit(EV.SCRAP_CHANGE, _state.scrap)
    return true
  },

  // ── RELICS ───────────────────────────────────────────────────
  addRelic (relic) {
    _state.relics.push(relic)
    EventBus.emit(EV.RELIC_PICKUP, relic)
    // Apply immediate passive effects
    if (relic.onPickup) relic.onPickup(RunState, _state)
  },

  hasRelic (id) { return _state.relics.some(r => r.id === id) },

  // ── BUFFS ────────────────────────────────────────────────────
  addBuff (key, data) { _state.buffs[key] = data },
  getBuff (key)       { return _state.buffs[key] ?? null },
  removeBuff (key)    { delete _state.buffs[key] },

  // ── ROOM TRACKING ────────────────────────────────────────────
  setMap (mapData) { _state.mapData = mapData },

  enterRoom (roomId) {
    _state.currentRoom = roomId
    _state.visitedRooms.add(roomId)
    EventBus.emit(EV.ROOM_ENTER, roomId)
  },

  clearRoom () {
    _state.roomsCleared++
    _state.runDepth++
    EventBus.emit(EV.ROOM_CLEARED, _state.currentRoom)
  },

  addKill () {
    _state.kills++
  },
}

export default RunState
