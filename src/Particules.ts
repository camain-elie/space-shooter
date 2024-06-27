import { REFRESH_INTERVAL } from "./Constants"
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
    size: number

    constructor(
        createdPosition: Coordinates,
        directionVector: Coordinates,
        range: number,
        speed: number,
        opacity: number,
        size: number
    ) {
        super(createdPosition, directionVector, range, speed, size)

        this.opacity = opacity
        this.size = size
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

export { Particule, LinearParticule, CircularParticule }
