import { Coordinates } from "./Vector"
import { Particule } from "./Particules"
import { Upgrade } from "./Upgrade"

interface Ship {
    coordinates: Coordinates
    rightWing: Coordinates
    leftWing: Coordinates
    basePoint: Coordinates
    relativeDirectionVector: Coordinates
    directionVector: Coordinates
    angle: number
    acceleration: number
    speed: number
    maxSpeed: number
    distanceToCursor: number
    firing: boolean
    laserRate: number
    laserRange: number
    lasers: Particule[]
    invincibilityTime: number
    invincibilityLeft: number
    lives: number
    level: number
    xp: number
    upgrades: Upgrade[]
    upgradeChoice: Upgrade[]
}

export { Ship }
