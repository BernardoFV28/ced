// ─── GAME DIMENSIONS ────────────────────────────────────────────────────────
export const GAME_WIDTH  = 480
export const GAME_HEIGHT = 270
export const SCALE       = 3   // rendered at 1440x810

// ─── PHYSICS ────────────────────────────────────────────────────────────────
export const GRAVITY        = 900
export const PLAYER_SPEED   = 160
export const PLAYER_JUMP    = -420
export const DASH_SPEED     = 480
export const DASH_DURATION  = 140  // ms
export const DASH_COOLDOWN  = 600  // ms
export const IFRAME_DURATION = 300 // ms on dash
export const PARRY_WINDOW    = 180 // ms — window to parry after triggering
export const PARRY_COOLDOWN  = 800 // ms

// ─── COMBAT ────────────────────────────────────────────────────────────────
export const PLAYER_MAX_HP    = 100
export const PLAYER_BASE_DMG  = 22
export const PARRY_DMG_BONUS  = 1.8  // multiplier on parried counter
export const EXECUTION_HP_THR = 0.2  // below 20% HP triggers execution prompt

// ─── ROOMS ──────────────────────────────────────────────────────────────────
export const ROOM_COLS   = 3   // BSP columns
export const ROOM_ROWS   = 3   // BSP rows
export const ROOMS_PER_RUN = { min: 7, max: 12 }
export const TILE_SIZE   = 16

// ─── META-PROGRESSION ───────────────────────────────────────────────────────
export const SCRAP_PER_ENEMY  = 5
export const SCRAP_PER_BOSS   = 120
export const ECHO_PER_RUN_MIN = 10
export const ECHO_PER_RUN_MAX = 40

// ─── SCENE KEYS ─────────────────────────────────────────────────────────────
export const SCENES = {
  BOOT:       'BootScene',
  PRELOAD:    'PreloadScene',
  HUB:        'HubScene',
  RUN:        'RunScene',
  ROOM:       'RoomScene',
  UI:         'UIScene',
  GAME_OVER:  'GameOverScene',
  TRANSITION: 'TransitionScene',
}

// ─── EVENTS ─────────────────────────────────────────────────────────────────
export const EV = {
  // Player
  PLAYER_HIT:       'player:hit',
  PLAYER_DEATH:     'player:death',
  PLAYER_HEAL:      'player:heal',
  PLAYER_PARRY_OK:  'player:parry_ok',
  PLAYER_PARRY_FAIL:'player:parry_fail',
  PLAYER_DASH:      'player:dash',
  // Combat
  ENEMY_DEATH:      'enemy:death',
  ENEMY_HIT:        'enemy:hit',
  BOSS_PHASE:       'boss:phase',
  // Room
  ROOM_CLEARED:     'room:cleared',
  ROOM_ENTER:       'room:enter',
  // Run
  RUN_START:        'run:start',
  RUN_END:          'run:end',
  RELIC_PICKUP:     'relic:pickup',
  SCRAP_CHANGE:     'scrap:change',
  ECHO_CHANGE:      'echo:change',
  // UI
  UI_OPEN_INVENTORY:'ui:open_inventory',
  UI_CLOSE_INVENTORY:'ui:close_inventory',
  UI_OPEN_MAP:      'ui:open_map',
  UI_CLOSE_MAP:     'ui:close_map',
}

// ─── RELIC SLOT TYPES ────────────────────────────────────────────────────────
export const RELIC_TYPES = {
  IMPLANT:  'implant',   // passive hardware mods
  DOCTRINE: 'doctrine',  // active abilities (replaces second attack)
  EFFIGY:   'effigy',    // cursed — power with drawback
}

// ─── ROOM TYPES ─────────────────────────────────────────────────────────────
export const ROOM_TYPES = {
  COMBAT:    'combat',
  ELITE:     'elite',
  BOSS:      'boss',
  REST:      'rest',
  FORGE:     'forge',     // upgrade station
  LORE:      'lore',      // narrative / lore drop
  TRANSIT:   'transit',   // connector, no enemies
}
