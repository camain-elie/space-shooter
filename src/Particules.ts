import { Coordinates } from "./Vector"

export interface Particule {
    position: Coordinates
    directionVector: Coordinates
    createdPosition: Coordinates
}

export interface AsteroidParticule extends Particule {
    range: number
    speed: number
}

export interface ExplosionParticule extends AsteroidParticule {
    opacity: number
    size: number
}
