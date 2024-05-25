import { Coordinates } from "./Vector"
import { Particule } from "./Particules"

interface Ship {
    coordinates: Coordinates
    rightWing: Coordinates
    leftWing: Coordinates
    basePoint: Coordinates
    relativeDirectionVector: Coordinates
    directionVector: Coordinates
    angle: number
    speed: number
    distanceToCursor: number
    firing: boolean
    laserRate: number
    laserRange: number
    lasers: Particule[]
    invincibilityTime: number
    lives: number
    level: number
    xp: number
}

export { Ship }
