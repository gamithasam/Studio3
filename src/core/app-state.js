/**
 * AppState - Centralized state management
 * Manages application state and notifies subscribers of changes
 */

export default class AppState {
  constructor(eventBus) {
    this.eventBus = eventBus;
    
    // Application state
    this.state = {
      isPlaying: false,
      currentSlideIndex: 0,
      isPaused: false,
      isExporting: false
    };
  }

  /**
   * Update state and notify listeners
   * @param {object} changes - Object with state changes
   */
  setState(changes) {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...changes };
    
    // Emit events for changed properties
    Object.keys(changes).forEach(key => {
      if (previousState[key] !== this.state[key]) {
        this.eventBus.emit(`state:${key}`, {
          value: this.state[key],
          previous: previousState[key]
        });
      }
    });
    
    // Also emit a general state change event
    this.eventBus.emit('state:changed', {
      current: this.state,
      previous: previousState,
      changed: Object.keys(changes)
    });
  }

  /**
   * Get current state or a specific state property
   * @param {string} [prop] - Optional property name
   * @returns {any} The state or specified property value
   */
  getState(prop) {
    if (prop) {
      return this.state[prop];
    }
    return { ...this.state };
  }
}
