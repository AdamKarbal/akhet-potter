import {applyRetryableWrites} from "mongodb/src/utils.ts";

export const ACTION_TYPES = {
  ROTATE: 'ROTATE',
  MOVE: 'MOVE',
  PLACE: 'PLACE',
  EXCHANGE: 'EXCHANGE'
}

export const ROTATION_TYPES = {
  CLOCKWISE: 'CLOCKWISE',
  ANTICLOCKWISE: 'ANTICLOCKWISE',
}

export class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

export class Action {
  constructor(actionType, cell, result) {
    if (new.target === Action) throw new Error('Action is abstract and cannot be instantiated directly');
    this.actionType = actionType;
    this.cell = cell;
    this.result = result;
  }

  isConsistent() {
    throw new Error('isConsistent method must be implemented by subclasses');
  }
}

export class Rotate extends Action {
  constructor(cell, result) {
    super(ACTION_TYPES.ROTATE, cell, result);
  }

  isConsistent() {
    return this.actionType && this.actionType === ACTION_TYPES.ROTATE
      && this.cell && this.cell instanceof Cell
      && this.result && (this.result === ROTATION_TYPES.CLOCKWISE || this.result === ROTATION_TYPES.ANTICLOCKWISE);
  }
}

export class Move extends Action {
  constructor(cell, result) {
    super(ACTION_TYPES.MOVE, cell, result);
  }

  isConsistent() {
    return this.actionType && this.actionType === ACTION_TYPES.MOVE
      && this.cell && this.cell instanceof Cell
      && this.result && this.result instanceof Cell;
  }
}

export class Place extends Action {
  constructor(result) {
    super(ACTION_TYPES.PLACE, result);
  }

  isConsistent() {
    return this.actionType && this.actionType === ACTION_TYPES.PLACE
      && !this.cell
      && this.result
        && this.result.destination && this.result.destination instanceof Cell
        && this.result.orientation && this.result.orientation in [0, 9, 90, 99];
  }
}

export class Exchange extends Action {
  constructor(cell, result) {
    super(ACTION_TYPES.EXCHANGE, cell, result);
  }

  isConsistent() {
    return this.actionType && this.actionType === ACTION_TYPES.EXCHANGE
      && this.cell && this.cell instanceof Cell
      && this.result && this.result instanceof Cell;
  }
}