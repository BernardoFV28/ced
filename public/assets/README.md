# Assets — CARNE & DOUTRINA

Coloque os arquivos de assets aqui seguindo a estrutura:

## sprites/
- `player.png` — spritesheet 32×32 por frame, 51 frames total
- `enemy_grunt.png` — spritesheet 24×24, animações: idle(4), run(6), attack(4), hurt(2), death(4)
- `enemy_prophet.png` — 32×32
- `boss_syndesis.png` — 64×64

## tiles/
- `hub.png`, `ruins.png`, `church.png`, `server.png` — tilesets 16×16

## maps/
- `hub.json` — Tiled JSON com layers: Background, Platforms, Foreground, SpawnPoints
- `rooms/combat_1.json` … — salas individuais com mesmos layers

## ui/
- `heart.png`, `heart_empty.png` — 8×8
- `scrap.png`, `echo.png` — 8×8 ícones de moeda
- `relic_frame.png` — 16×16 frame de relíquia
- `relics.png` + `relics.json` — atlas de ícones de relíquias

## audio/
- `sfx/attack.ogg`, `parry.ogg`, `dash.ogg`, `hurt.ogg`, `death.ogg`, `relic.ogg`
- `bgm/hub.ogg`, `run.ogg`, `boss.ogg`

## Ferramentas recomendadas
- Sprites: Aseprite
- Tilemaps: Tiled Map Editor
- Áudio: sfxr / Bfxr para SFX, FamiTracker/LMMS para BGM
