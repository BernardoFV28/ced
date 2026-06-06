/**
 * ProceduralGen — geração procedural de mapas via BSP (Binary Space Partition)
 * com seed determinística. Mesma seed = mesmo mapa.
 *
 * Uso:
 *   const gen = new ProceduralGen(seed)
 *   const map = gen.generate()
 *   // map.rooms: Array<Room>
 *   // map.edges: Array<[roomA.id, roomB.id]>
 *   // map.startRoom, map.bossRoom
 */
import { ROOM_TYPES, ROOMS_PER_RUN } from '../utils/constants'

// Seeded PRNG — Mulberry32
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

class ProceduralGen {
  constructor(seed) {
    this.seed  = seed
    this.rng   = mulberry32(seed)
    this.rooms = []
    this.edges = []
  }

  // ── PUBLIC ──────────────────────────────────────────────────
  generate() {
    const count = this._randi(ROOMS_PER_RUN.min, ROOMS_PER_RUN.max)
    this._buildGraph(count)
    this._assignTypes()
    return {
      rooms:     this.rooms,
      edges:     this.edges,
      startRoom: this.rooms.find(r => r.type === ROOM_TYPES.TRANSIT),
      bossRoom:  this.rooms.find(r => r.type === ROOM_TYPES.BOSS),
    }
  }

  // ── PRIVATE ─────────────────────────────────────────────────
  _buildGraph(count) {
    // Create rooms as nodes in a roughly linear path with branches
    for (let i = 0; i < count; i++) {
      this.rooms.push({
        id:      i,
        type:    null,
        cleared: false,
        depth:   i,          // rough depth for difficulty scaling
        x:       0,          // map position (set later for MapPanel rendering)
        y:       0,
        templateKey: null,   // assigned based on type
      })
    }

    // Build main path: 0 → 1 → 2 … → count-1
    for (let i = 0; i < count - 1; i++) {
      this.edges.push([i, i + 1])
    }

    // Add 1-2 branch shortcuts if enough rooms
    const branches = this._randi(1, 2)
    for (let b = 0; b < branches; b++) {
      const from = this._randi(1, count - 3)
      const to   = this._randi(from + 2, count - 1)
      const exists = this.edges.some(([a, z]) => (a === from && z === to) || (a === to && z === from))
      if (!exists) this.edges.push([from, to])
    }

    // Assign grid positions for the MapPanel UI
    this._layoutPositions()
  }

  _assignTypes() {
    const rooms = this.rooms
    const last  = rooms.length - 1

    rooms[0].type      = ROOM_TYPES.TRANSIT  // always start safe
    rooms[last].type   = ROOM_TYPES.BOSS

    // Sprinkle room types through remaining rooms
    const pool = [
      ROOM_TYPES.COMBAT, ROOM_TYPES.COMBAT, ROOM_TYPES.COMBAT,
      ROOM_TYPES.ELITE,  ROOM_TYPES.ELITE,
      ROOM_TYPES.REST,
      ROOM_TYPES.FORGE,
      ROOM_TYPES.LORE,
      ROOM_TYPES.TRANSIT,
    ]

    for (let i = 1; i < last; i++) {
      const idx   = this._randi(0, pool.length - 1)
      rooms[i].type = pool[idx]
      rooms[i].templateKey = `room_${rooms[i].type}_${this._randi(1, 3)}`
    }

    rooms[last].templateKey = `room_boss_${this._randi(1, 2)}`
  }

  _layoutPositions() {
    // Simple left-to-right wave layout for the map panel
    const cols = Math.ceil(this.rooms.length / 3)
    this.rooms.forEach((r, i) => {
      r.x = (i % cols) * 80 + 40
      r.y = Math.floor(i / cols) * 70 + 40 + (i % 2) * 20
    })
  }

  _randi(min, max) {
    return Math.floor(this.rng() * (max - min + 1)) + min
  }
}

export default ProceduralGen
