/**
 * EventBus — singleton Phaser EventEmitter
 * Desacopla todas as Scenes entre si.
 * 
 * Uso:
 *   import EventBus from '../systems/EventBus'
 *   EventBus.emit(EV.ROOM_CLEARED)
 *   EventBus.on(EV.ROOM_CLEARED, handler, context)
 *   EventBus.off(EV.ROOM_CLEARED, handler, context)
 */
import Phaser from 'phaser'

const EventBus = new Phaser.Events.EventEmitter()

// Dev helper: log all events in development
if (import.meta.env.DEV) {
  const _emit = EventBus.emit.bind(EventBus)
  EventBus.emit = (event, ...args) => {
    console.debug(`[EventBus] ${event}`, ...args)
    return _emit(event, ...args)
  }
}

export default EventBus
