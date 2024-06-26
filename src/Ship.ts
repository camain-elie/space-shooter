import { Coordinates } from "./Vector"
import { Particule } from "./Particules"
import { Upgrade, initUpgrades } from "./Apgrade"
import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    INVINCIBILITY_TIME,
    LASER_RANGE,
    LASER_SHOOTING_RATE,
    NUMBER_OF_LIVES,
    SHIP_ACCELERATION,
    SHIP_LENGTH,
    SHIP_MAX_SPEED,
    SHIP_WIDTH,
} from "./Constants"
import { SpecialUpgrade } from "./SpecialUpgrade"

interface Ship {
    coordinates: Coordinates
    rightWing: Coordinates
    leftWing: Coordinates
    rightLaser: Coordinates
    leftLaser: Coordinates
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
    specialUpgrade: SpecialUpgrade[]
    specialUpgradeChoice: SpecialUpgrade[]
    shieldReloadTime: number
}

const initShip = (): Ship => ({
    coordinates: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
    },
    leftWing: {
        x: CANVAS_WIDTH / 2 - SHIP_LENGTH,
        y: CANVAS_HEIGHT / 2 - SHIP_WIDTH / 2,
    },
    rightWing: {
        x: CANVAS_WIDTH / 2 - SHIP_LENGTH,
        y: CANVAS_HEIGHT / 2 + SHIP_WIDTH / 2,
    },
    rightLaser: {
        x: CANVAS_WIDTH / 2 - SHIP_LENGTH,
        y: CANVAS_HEIGHT / 2 + SHIP_WIDTH / 2 + 1,
    },
    leftLaser: {
        x: CANVAS_WIDTH / 2 - SHIP_LENGTH,
        y: CANVAS_HEIGHT / 2 - SHIP_WIDTH / 2 - 1,
    },
    basePoint: {
        x: CANVAS_WIDTH / 2 - SHIP_LENGTH,
        y: CANVAS_HEIGHT / 2,
    },
    relativeDirectionVector: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
    },
    directionVector: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
    },
    angle: 0,
    acceleration: SHIP_ACCELERATION,
    speed: 0,
    maxSpeed: SHIP_MAX_SPEED,
    distanceToCursor: 0,
    firing: false,
    laserRate: LASER_SHOOTING_RATE,
    laserRange: LASER_RANGE,
    lasers: [],
    invincibilityTime: INVINCIBILITY_TIME,
    invincibilityLeft: 0,
    lives: NUMBER_OF_LIVES,
    level: 1,
    xp: 0,
    upgrades: initUpgrades(),
    upgradeChoice: [],
    specialUpgrade: [],
    specialUpgradeChoice: [],
    shieldReloadTime: 0,
})

export { Ship, initShip }
