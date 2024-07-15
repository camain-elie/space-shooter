import {
    BOMB_EXPLOSION_DELAY,
    BOMB_RATE,
    BOMB_SIZE,
    LASER_SHOT_LENGTH,
    LASER_SHOT_SPEED,
    REFRESH_INTERVAL,
} from "./Constants"
import { ParticuleCollection } from "./ParticuleCollection"
import { CircularParticule, LinearParticule } from "./Particules"
import { Ship } from "./Ship"
import { createExplosion } from "./VFX"
import { getRandomVector } from "./Vector"

type Side = "right" | "left"

class Weapons {
    lasers: ParticuleCollection
    damageParticules: ParticuleCollection
    bombs: ParticuleCollection
    laserTicking: number
    bombRateTicking: number
    bombExplosionTicking: number

    constructor() {
        this.lasers = new ParticuleCollection()
        this.damageParticules = new ParticuleCollection()
        this.bombs = new ParticuleCollection()
        this.laserTicking = 0
        this.bombRateTicking = 0
        this.bombExplosionTicking = BOMB_EXPLOSION_DELAY * REFRESH_INTERVAL
    }

    handleWeapons(context: CanvasRenderingContext2D, player: Ship) {
        this.handleLasers(context, player)
        if (player.hardware.hasHardware("delayedBomb"))
            this.handleBomb(context, player)
    }

    handleLasers(context: CanvasRenderingContext2D, player: Ship) {
        this.lasers.update()
        if (player.firing) {
            this.createNewLasers(player)
            this.laserTicking++
        }
        this.lasers.draw(context)
    }

    createNewLasers(player: Ship) {
        const firingInterval = Math.floor(REFRESH_INTERVAL / player.laserRate)
        if (player.firing && this.laserTicking % firingInterval === 0) {
            const laserDirectionRatio =
                player.laserRange / player.distanceToCursor
            this.lasers.addParticule(
                new LinearParticule(
                    { ...player.coordinates },
                    {
                        x:
                            (player.directionVector.x - player.coordinates.x) *
                            laserDirectionRatio,
                        y:
                            (player.directionVector.y - player.coordinates.y) *
                            laserDirectionRatio,
                    },
                    player.laserRange,
                    LASER_SHOT_SPEED,
                    LASER_SHOT_LENGTH
                )
            )
            this.createSecondaryLasers(player)
        }
    }

    createSecondaryLasers(player: Ship) {
        if (player.hardware.hasHardware("leftWingLaser"))
            this.createWingLaser(player, "left")
        if (player.hardware.hasHardware("rightWingLaser"))
            this.createWingLaser(player, "right")
    }

    createWingLaser(player: Ship, side: Side) {
        const laserDirectionRatio = player.laserRange / player.distanceToCursor
        const position =
            side === "right"
                ? { ...player.rightLaser }
                : { ...player.leftLaser }
        this.lasers.addParticule(
            new LinearParticule(
                position,
                {
                    x:
                        (player.directionVector.x - position.x) *
                        laserDirectionRatio,
                    y:
                        (player.directionVector.y - position.y) *
                        laserDirectionRatio,
                },
                player.laserRange,
                LASER_SHOT_SPEED,
                LASER_SHOT_LENGTH
            )
        )
    }

    handleBomb(context: CanvasRenderingContext2D, player: Ship) {
        player.firing && this.createBomb(player)
        this.updateBomb(player)
        this.drawBomb(context)
    }

    createBomb(player: Ship) {
        if (this.bombRateTicking === 0) {
            const part = new CircularParticule(
                player.basePoint,
                player.relativeDirectionVector,
                Number.POSITIVE_INFINITY,
                player.speed,
                BOMB_SIZE,
                // might use sin function to draw flicker
                0.5
            )
            this.bombs.addParticule(part)
            this.bombRateTicking = BOMB_RATE * REFRESH_INTERVAL
            this.bombExplosionTicking = BOMB_EXPLOSION_DELAY * REFRESH_INTERVAL
        }
    }

    updateBomb(player: Ship) {
        this.bombs.update()
        if (this.bombRateTicking) this.bombRateTicking--
        if (this.bombExplosionTicking === 0) this.explode(player)
        else this.bombExplosionTicking--
    }

    explode(player: Ship) {
        this.bombExplosionTicking = Number.POSITIVE_INFINITY
        const position = this.bombs.collection[0].position
        this.bombs.reset()
        createExplosion(this.bombs, position, this.damageParticules)
        for (let i = 0; i < player.laserRate * 2; i++) {
            this.lasers.addParticule(
                new LinearParticule(
                    position,
                    getRandomVector(),
                    player.laserRange,
                    LASER_SHOT_SPEED,
                    LASER_SHOT_LENGTH
                )
            )
        }
    }

    drawBomb(context: CanvasRenderingContext2D) {
        this.bombs.draw(context)
    }
}

export { Weapons }
