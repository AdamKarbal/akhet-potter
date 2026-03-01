export const MOVEMENT_DELTAS = {
    0:   { dx: 0,  dy: -1 }, // UP
    90:  { dx: 1,  dy: 0 },  // RIGHT
    180: { dx: 0,  dy: 1 },  // DOWN
    270: { dx: -1, dy: 0 }   // LEFT
};

// Miroir type "Slash" ( / )
export const SCARAB_SLASH = {
    0: 270,   // Un laser allant vers le HAUT tape et part à GAUCHE
    90: 0,    // Un laser allant vers la DROITE tape et part en HAUT
    180: 90,  // Un laser allant vers le BAS tape et part à DROITE
    270: 180  // Un laser allant vers la GAUCHE tape et part en BAS
};


export const SCARAB_BACKSLASH = {
    0: 90,
    90: 180,
    180: 270,
    270: 0
};

export const PYRAMID_REFLECTIONS = {
    0:   { 270: 180, 0: 90 },
    90:  { 90: 180, 0: 270 },
    180: { 90: 0, 180: 270 },
    270: { 270: 0, 180: 90 }
};