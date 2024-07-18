import { Coordinates, getDistance, getRandomVector } from "./Vector"
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants/canvas"
import {
    GIGA_ASTEROID_SIZE,
    ASTEROID_MAX_SPEED,
    ASTEROID_SIZE,
    ASTEROID_JAGGEDNESS,
    REFRESH_INTERVAL,
} from "./constants/game"

type AsteroidType = 1 | 2 | 3 | 4

class Asteroid {
    coordinates: Coordinates
    relativeDirectionVector: Coordinates
    rotationSpeed: number
    angle: number
    speed: number
    size: number
    type: AsteroidType
    vertex: number
    offset: number[]
    health: number

    constructor(coordinates: Coordinates, type: AsteroidType) {
        if (type === 4) {
            const top = Math.random() < 0.5
            const left = Math.random() < 0.5
            const size = GIGA_ASTEROID_SIZE

            this.coordinates = {
                x: left ? -size / 2 : CANVAS_WIDTH + size / 2,
                y: top ? -size / 2 : CANVAS_HEIGHT + size / 2,
            }
            this.relativeDirectionVector = {
                x: left ? CANVAS_WIDTH : -CANVAS_WIDTH,
                y: top ? CANVAS_HEIGHT : -CANVAS_HEIGHT,
            }
            this.rotationSpeed = Math.random() > 0.5 ? -1 : 1
            this.angle = 0
            this.speed = 100
            this.size = size
            this.type = type
            this.vertex = 20
            this.offset = []
            this.health = 50

            for (let i = 0; i < this.vertex; i++) {
                this.offset.push(Math.random() * 0.1 * 2 + 1 - 0.1)
            }
            return
        }

        this.coordinates = coordinates
        this.relativeDirectionVector = getRandomVector()
        this.rotationSpeed = Math.random() * 4 - 2
        this.angle = 0
        this.speed = Math.random() * ASTEROID_MAX_SPEED
        this.size = type * ASTEROID_SIZE
        this.type = type
        this.vertex = Math.random() * (12 - 6) + 6
        this.offset = []
        this.health = 1

        for (let i = 0; i < this.vertex; i++) {
            this.offset.push(
                Math.random() * ASTEROID_JAGGEDNESS * 2 +
                    1 -
                    ASTEROID_JAGGEDNESS
            )
        }
    }

    draw(context: CanvasRenderingContext2D) {
        const { size, angle, vertex, offset } = this
        const { x, y } = this.coordinates

        context.strokeStyle = "white"
        context.beginPath()
        context.moveTo(
            x + size * offset[0] * Math.cos(angle),
            y + size * offset[0] * Math.sin(angle)
        )

        for (let i = 1; i < vertex; i++) {
            context.lineTo(
                x +
                    size *
                        offset[i] *
                        Math.cos(angle + (i * Math.PI * 2) / vertex),
                y +
                    size *
                        offset[i] *
                        Math.sin(angle + (i * Math.PI * 2) / vertex)
            )
        }
        context.closePath()
        context.stroke()
        // give a 3d perspective aspect to asteroids
        context.fillStyle = "#0a132d"
        context.fill()
    }

    update() {
        const {
            coordinates,
            relativeDirectionVector,
            rotationSpeed,
            angle,
            speed,
            type,
            size,
        } = this
        const { x, y } = coordinates
        const distancePerFrame = speed / REFRESH_INTERVAL
        const vectorDistance = getDistance(
            { x: 0, y: 0 },
            relativeDirectionVector
        )
        const distanceRatio = distancePerFrame / vectorDistance
        const newPos = {
            x: x + relativeDirectionVector.x * distanceRatio,
            y: y + relativeDirectionVector.y * distanceRatio,
        }
        if (type !== 4) {
            if (newPos.x > CANVAS_WIDTH + size)
                newPos.x -= CANVAS_WIDTH + size * 2
            if (newPos.x < 0 - size) newPos.x += CANVAS_WIDTH + size * 2
            if (newPos.y > CANVAS_HEIGHT + size)
                newPos.y -= CANVAS_HEIGHT + size * 2
            if (newPos.y < 0 - size) newPos.y += CANVAS_HEIGHT + size * 2
        }

        this.coordinates = newPos

        const newAngle = angle + rotationSpeed / REFRESH_INTERVAL
        this.angle = newAngle
    }

    isGigaAsteroid() {
        return this.type === 4
    }

    isOnCanvas() {
        const {
            coordinates: { x, y },
            size,
        } = this
        return (
            x < CANVAS_WIDTH + size &&
            x > -size &&
            y < CANVAS_HEIGHT + size &&
            y > -size
        )
    }
}

const createGigaAsteroid = (asteroids: Asteroid[]) => {
    asteroids.push(new Asteroid({ x: 0, y: 0 }, 4))
}

export { AsteroidType, Asteroid, createGigaAsteroid }
