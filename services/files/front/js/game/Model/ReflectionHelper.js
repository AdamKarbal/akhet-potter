export const MOVEMENT_DELTAS = {
    0:   { dx: 0,  dy: -1 }, // UP
    90:  { dx: 1,  dy: 0 },  // RIGHT
    180: { dx: 0,  dy: 1 },  // DOWN
    270: { dx: -1, dy: 0 }   // LEFT
};

export const SCARAB_BACKSLASH = { 180: 270, 0: 90, 90: 0, 270: 180 };

export const SCARAB_SLASH =     { 180: 90, 0: 270, 90: 180, 270: 0 };

export const PYRAMID_REFLECTIONS = {
    0:   { 270: 180, 0: 90 },
    90:  { 90: 180, 0: 270 },
    180: { 90: 0, 180: 270 },
    270: { 270: 0, 180: 90 }
};