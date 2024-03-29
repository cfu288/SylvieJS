"use strict";
/**
 * LokiEventEmitter is a minimalist version of EventEmitter. It enables any
 * constructor that inherits EventEmitter to emit events and trigger
 * listeners that have been added to the event through the on(event, callback) method
 *
 * @constructor LokiEventEmitter
 */
export class SylvieEventEmitter {
  save: any;

  /**
   * on(eventName, listener) - adds a listener to the queue of callbacks associated to an event
   * @param {string|string[]} eventName - the name(s) of the event(s) to listen to
   * @param {function} listener - callback function of listener to attach
   * @returns {int} the index of the callback in the array of listeners for a particular event
   * @memberof LokiEventEmitter
   */
  on<F extends (...args: any[]) => any>(
    eventName: string | string[],
    listener: F,
  ): F {
    let event;

    if (Array.isArray(eventName)) {
      eventName.forEach((currentEventName) => {
        this.on(currentEventName, listener);
      });
      return listener;
    }

    event = this.events[eventName];
    if (!event) {
      event = this.events[eventName] = [];
    }
    event.push(listener);
    return listener;
  }

  /**
   * Alias of LokiEventEmitter.prototype.on
   * addListener(eventName, listener) - adds a listener to the queue of callbacks associated to an event
   * @param {string|string[]} eventName - the name(s) of the event(s) to listen to
   * @param {function} listener - callback function of listener to attach
   * @returns {int} the index of the callback in the array of listeners for a particular event
   * @memberof LokiEventEmitter
   */
  addListener: SylvieEventEmitter["on"] = this.on;

  /**
   * emit(eventName, data) - emits a particular event
   * with the option of passing optional parameters which are going to be processed by the callback
   * provided signatures match (i.e. if passing emit(event, arg0, arg1) the listener should take two parameters)
   * @param {string} eventName - the name of the event
   * @param {object=} data - optional object passed with the event
   * @memberof LokiEventEmitter
   */
  emit(eventName: string, data?: unknown, arg?: any): void {
    let selfArgs;

    if (eventName && this.events[eventName]) {
      if (this.events[eventName].length) {
        // eslint-disable-next-line prefer-rest-params
        selfArgs = Array.prototype.slice.call(arguments, 1);
        this.events[eventName].forEach((listener) => {
          if (this.asyncListeners) {
            setTimeout(() => {
              listener.apply(this, selfArgs);
            }, 1);
          } else {
            listener.apply(this, selfArgs);
          }
        });
      }
    } else {
      throw new Error(`No event ${eventName} defined`);
    }
  }

  /**
   * removeListener() - removes the listener at position 'index' from the event 'eventName'
   * @param {string|string[]} eventName - the name(s) of the event(s) which the listener is attached to
   * @param {function} listener - the listener callback function to remove from emitter
   * @memberof LokiEventEmitter
   */
  removeListener(
    eventName: string | string[],
    listener: (...args: any[]) => any,
  ): void {
    if (Array.isArray(eventName)) {
      eventName.forEach((currentEventName) => {
        this.removeListener(currentEventName, listener);
      });

      return;
    }

    if (this.events[eventName]) {
      const listeners = this.events[eventName];
      listeners.splice(listeners.indexOf(listener), 1);
    }
  }

  /**
   * @prop {hashmap} events - a hashmap, with each property being an array of callbacks
   * @memberof LokiEventEmitter
   */
  public events: { [eventName: string]: ((...args: any[]) => any)[] } = {};

  /**
   * @prop {boolean} asyncListeners - boolean determines whether or not the callbacks associated with each event
   * should happen in an async fashion or not
   * Default is false, which means events are synchronous
   * @memberof LokiEventEmitter
   */
  asyncListeners = false;
}
