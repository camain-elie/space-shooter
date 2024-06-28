import { CANVAS_HEIGHT, CANVAS_WIDTH, REFRESH_INTERVAL } from "./Constants"
import { Ship } from "./Ship"
import { Coordinates, getDistance } from "./Vector"

class Particule {
    position: Coordinates
    directionVector: Coordinates
    createdPosition: Coordinates
    range: number
    speed: number
    size: number

    constructor(
        createdPosition: Coordinates,
        directionVector: Coordinates,
        range: number,
        speed: number,
        size: number
    ) {
        this.position = createdPosition
        this.directionVector = directionVector
        this.createdPosition = createdPosition
        this.range = range
        this.speed = speed
        this.size = size
    }

    update() {
        const { position, directionVector, speed } = this
        const distancePerRender = speed / REFRESH_INTERVAL
        const particuleVectorRatio =
            distancePerRender / getDistance({ x: 0, y: 0 }, directionVector)
        this.position = {
            x: position.x + directionVector.x * particuleVectorRatio,
            y: position.y + directionVector.y * particuleVectorRatio,
        }
    }
}

class LinearParticule extends Particule {
    draw(context: CanvasRenderingContext2D) {
        const { position, directionVector, size } = this
        const particuleVectorToLengthRatio =
            getDistance({ x: 0, y: 0 }, directionVector) / size
        context.beginPath()
        context.moveTo(position.x, position.y)
        context.lineTo(
            position.x + directionVector.x / particuleVectorToLengthRatio,
            position.y + directionVector.y / particuleVectorToLengthRatio
        )
        context.closePath()
        context.stroke()
    }
}

class CircularParticule extends Particule {
    opacity: number

    constructor(
        createdPosition: Coordinates,
        directionVector: Coordinates,
        range: number,
        speed: number,
        size: number,
        opacity: number
    ) {
        super(createdPosition, directionVector, range, speed, size)
        this.opacity = opacity
    }

    draw(context: CanvasRenderingContext2D) {
        const {
            position: { x, y },
            opacity,
            size,
        } = this
        context.fillStyle = `rgba(255, 255, 255, ${opacity})`
        context.beginPath()
        context.arc(x, y, size, 0, 2 * Math.PI)
        context.fill()
        context.closePath()
    }
}

class BackgroundParticule extends CircularParticule {
    player: Ship

    constructor(
        createdPosition: Coordinates,
        directionVector: Coordinates,
        range: number,
        speed: number,
        size: number,
        opacity: number,
        player: Ship
    ) {
        super(createdPosition, directionVector, range, speed, size, opacity)
        this.player = player
    }
    update() {
        const {
            position: { x, y },
            speed,
            size,
        } = this
        const { relativeDirectionVector: directionVector, speed: playerSpeed } =
            this.player

        const distancePerFrame = (speed * playerSpeed) / REFRESH_INTERVAL
        const vectorDistance = getDistance({ x: 0, y: 0 }, directionVector)
        const distanceRatio = distancePerFrame / vectorDistance
        const newPos = {
            x: x + directionVector.x * distanceRatio,
            y: y + directionVector.y * distanceRatio,
        }

        if (newPos.x > CANVAS_WIDTH + size) newPos.x -= CANVAS_WIDTH + size * 2
        if (newPos.x < 0 - size) newPos.x += CANVAS_WIDTH + size * 2
        if (newPos.y > CANVAS_HEIGHT + size)
            newPos.y -= CANVAS_HEIGHT + size * 2
        if (newPos.y < 0 - size) newPos.y += CANVAS_HEIGHT + size * 2

        this.position = newPos
    }
}

export { Particule, LinearParticule, CircularParticule, BackgroundParticule }
