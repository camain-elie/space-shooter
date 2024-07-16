import {
    Coordinates,
    changeVectorLength,
    getDistance,
    getPerpendicularVector,
    inverseVector,
} from "./Vector"
import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    INVINCIBILITY_TIME,
    LASER_RANGE,
    LASER_SHOOTING_RATE,
    NUMBER_OF_LIVES,
    REFRESH_INTERVAL,
    SHIP_ACCELERATION,
    SHIP_LENGTH,
    SHIP_MAX_SPEED,
    SHIP_WIDTH,
} from "./Constants"
import { UpgradeSystem } from "./UpgradeSystem"
import { HardwareSystem } from "./HardwareSystem"
import { Weapons } from "./Weapons"

class Ship {
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
    weapons: Weapons
    firing: boolean
    laserRate: number
    laserRange: number
    invincibilityTime: number
    invincibilityLeft: number
    lives: number
    level: number
    xp: number
    upgrades: UpgradeSystem
    hardware: HardwareSystem
    shieldReloadTime: number

    constructor() {
        this.coordinates = {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
        }
        this.leftWing = {
            x: CANVAS_WIDTH / 2 - SHIP_LENGTH,
            y: CANVAS_HEIGHT / 2 - SHIP_WIDTH / 2,
        }
        this.rightWing = {
            x: CANVAS_WIDTH / 2 - SHIP_LENGTH,
            y: CANVAS_HEIGHT / 2 + SHIP_WIDTH / 2,
        }
        this.rightLaser = {
            x: CANVAS_WIDTH / 2 - SHIP_LENGTH,
            y: CANVAS_HEIGHT / 2 + SHIP_WIDTH / 2 + 1,
        }
        this.leftLaser = {
            x: CANVAS_WIDTH / 2 - SHIP_LENGTH,
            y: CANVAS_HEIGHT / 2 - SHIP_WIDTH / 2 - 1,
        }
        this.basePoint = {
            x: CANVAS_WIDTH / 2 - SHIP_LENGTH,
            y: CANVAS_HEIGHT / 2,
        }
        this.relativeDirectionVector = {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
        }
        this.directionVector = {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
        }
        this.angle = 0
        this.acceleration = SHIP_ACCELERATION
        this.speed = 0
        this.maxSpeed = SHIP_MAX_SPEED
        this.distanceToCursor = 0
        this.weapons = new Weapons()
        this.firing = false
        this.laserRate = LASER_SHOOTING_RATE
        this.laserRange = LASER_RANGE
        this.invincibilityTime = INVINCIBILITY_TIME
        this.invincibilityLeft = 0
        this.lives = NUMBER_OF_LIVES
        this.level = 1
        this.xp = 0
        this.upgrades = new UpgradeSystem()
        this.hardware = new HardwareSystem()
        this.shieldReloadTime = 0
    }

    reset() {
        this.constructor()
    }

    update(cursorPosition: Coordinates) {
        this.distanceToCursor = getDistance(cursorPosition, this.coordinates)
        this.updateAcceleration()

        if (this.distanceToCursor) {
            const distancePercentage =
                (this.speed * 100) / this.distanceToCursor / REFRESH_INTERVAL

            const newVec = {
                x: cursorPosition.x - this.coordinates.x,
                y: cursorPosition.y - this.coordinates.y,
            }

            this.coordinates.x += newVec.x * distancePercentage
            this.coordinates.y += newVec.y * distancePercentage

            this.updateWingsPosition()
        }
    }

    updateAcceleration = () => {
        const { distanceToCursor, speed, maxSpeed, acceleration } = this
        if (distanceToCursor <= 20 && speed) {
            this.speed = 0
        } else if (speed < maxSpeed && distanceToCursor > 50) {
            const newSpeed = speed + acceleration / REFRESH_INTERVAL
            this.speed = newSpeed > maxSpeed ? maxSpeed : newSpeed
        } else if (speed > 3 && this.distanceToCursor <= 50) {
            const newSpeed = this.speed - acceleration / REFRESH_INTERVAL
            this.speed = newSpeed < 0 ? 1 : newSpeed
        }
    }

    updateWingsPosition() {
        const { coordinates, relativeDirectionVector } = this
        const { x, y } = coordinates

        // first we find the base point
        const baseToNoseVector = changeVectorLength(
            relativeDirectionVector,
            SHIP_LENGTH
        )
        const inverseBaseToNoseVector = inverseVector(baseToNoseVector)
        const basePoint = {
            x: x + inverseBaseToNoseVector.x,
            y: y + inverseBaseToNoseVector.y,
        }

        // from the base point we find the wings positions
        const perpendicularVector = getPerpendicularVector(baseToNoseVector)

        const leftWingVector = changeVectorLength(
            perpendicularVector,
            SHIP_WIDTH / 2
        )
        const rightWingVector = inverseVector(leftWingVector)
        const leftLaserVector = changeVectorLength(
            perpendicularVector,
            SHIP_WIDTH / 2 - 1
        )
        const rightLaserVector = inverseVector(leftLaserVector)

        this.leftWing = {
            x: basePoint.x + leftWingVector.x,
            y: basePoint.y + leftWingVector.y,
        }
        this.rightWing = {
            x: basePoint.x + rightWingVector.x,
            y: basePoint.y + rightWingVector.y,
        }
        this.leftLaser = {
            x: basePoint.x + leftLaserVector.x,
            y: basePoint.y + leftLaserVector.y,
        }
        this.rightLaser = {
            x: basePoint.x + rightLaserVector.x,
            y: basePoint.y + rightLaserVector.y,
        }
        this.basePoint = { ...basePoint }
    }

    isUpgradeSpecial() {
        return this.level % 15 === 0 && this.hardware.isRemainingUpgrade()
    }

    getOrientationVector(cursorPosition: Coordinates) {
        const shipVector: Coordinates = { x: 10, y: 0 }
        const cursorVector: Coordinates = {
            x: cursorPosition.x - this.coordinates.x,
            y: cursorPosition.y - this.coordinates.y,
        }
        this.relativeDirectionVector = { ...cursorVector }
        this.directionVector = { ...cursorPosition }
        const scalarProduct =
            shipVector.x * cursorVector.x + shipVector.y * cursorVector.y
        const shipVectorNorm = Math.sqrt(
            Math.pow(shipVector.x, 2) + Math.pow(shipVector.y, 2)
        )
        const cursorVectorNorm = Math.sqrt(
            Math.pow(cursorVector.x, 2) + Math.pow(cursorVector.y, 2)
        )
        const cos = scalarProduct / (shipVectorNorm * cursorVectorNorm)
        const angle = Math.acos(cos)
        return cursorVector.y > 0 ? -angle : angle
    }

    draw(context: CanvasRenderingContext2D, cursorPosition: Coordinates) {
        const shipRotation = this.getOrientationVector(cursorPosition)

        const { invincibilityLeft } = this
        if (invincibilityLeft) {
            context.strokeStyle = invincibilityLeft
                ? `rgba(255,255,255, ${(invincibilityLeft % 6) / 10})`
                : "white"
        } else if (!this.lives) context.strokeStyle = "red"
        context.translate(this.coordinates.x, this.coordinates.y)
        context.rotate(-shipRotation)

        context.beginPath()

        context.moveTo(-SHIP_LENGTH, -SHIP_WIDTH / 2)
        context.lineTo(0, 0)
        context.lineTo(-SHIP_LENGTH, SHIP_WIDTH / 2)
        context.closePath()
        context.stroke()

        if (
            this.hardware.hasHardware("shieldGenerator") &&
            !this.shieldReloadTime
        ) {
            context.beginPath()
            context.strokeStyle = "turquoise"
            context.strokeStyle = `rgba(255,255,255, ${
                Math.random() * 0.3 + 0.3
            })`
            context.moveTo(-SHIP_LENGTH - 3, -SHIP_WIDTH / 2 - 4)
            context.lineTo(8, 0)
            context.lineTo(-SHIP_LENGTH - 3, SHIP_WIDTH / 2 + 4)
            context.closePath()
            context.stroke()
            context.strokeStyle = "white"
        }

        context.rotate(shipRotation)
        context.translate(-this.coordinates.x, -this.coordinates.y)
        if (this.lives) context.strokeStyle = "white"
    }

    startInvincibility() {
        this.invincibilityLeft = Math.floor(
            this.invincibilityTime * REFRESH_INTERVAL
        )
    }

    startFiring() {
        this.firing = true
    }

    stopFiring() {
        this.firing = false
        this.weapons.laserTicking = 0
    }
}

export { Ship }
