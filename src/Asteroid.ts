import {
    ASTEROID_JAGGEDNESS,
    ASTEROID_MAX_SPEED,
    ASTEROID_SIZE,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    GIGA_ASTEROID_SIZE,
    REFRESH_INTERVAL,
} from "./Constants"
import { Coordinates, getDistance } from "./Vector"

type AsteroidType = 1 | 2 | 3 | 4

interface Asteroid {
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
}

const createAsteroid = (coordinates: Coordinates, type: AsteroidType) => {
    const size = type * ASTEROID_SIZE
    const asteroid: Asteroid = {
        coordinates,
        relativeDirectionVector: {
            x: Math.random() * (20 + 20) - 20,
            y: Math.random() * (20 + 20) - 20,
        },
        rotationSpeed: Math.random() * 4 - 2,
        angle: 0,
        speed: Math.random() * ASTEROID_MAX_SPEED,
        size,
        type,
        vertex: Math.random() * (12 - 6) + 6,
        offset: [],
        health: 1,
    }

    for (let i = 0; i < asteroid.vertex; i++) {
        asteroid.offset.push(
            Math.random() * ASTEROID_JAGGEDNESS * 2 + 1 - ASTEROID_JAGGEDNESS
        )
    }

    return asteroid
}

const createGigaAsteroid = (asteroids: Asteroid[]) => {
    const top = Math.random() < 0.5
    const left = Math.random() < 0.5
    const size = GIGA_ASTEROID_SIZE

    const asteroid: Asteroid = {
        coordinates: {
            x: left ? -size : CANVAS_WIDTH + size,
            y: top ? -size : CANVAS_HEIGHT + size,
        },
        relativeDirectionVector: {
            x: left ? CANVAS_WIDTH : -CANVAS_WIDTH,
            y: top ? CANVAS_HEIGHT : -CANVAS_HEIGHT,
        },
        rotationSpeed: Math.random() > 0.5 ? -1 : 1,
        angle: 0,
        speed: 100,
        size,
        type: 4,
        vertex: 20,
        offset: [],
        health: 50,
    }

    for (let i = 0; i < asteroid.vertex; i++) {
        asteroid.offset.push(Math.random() * 0.1 * 2 + 1 - 0.1)
    }

    asteroids.push(asteroid)
}

const initAsteroids = (asteroids: Asteroid[], wave: number) => {
    for (let i = 0; i < wave; i++)
        asteroids.push(
            createAsteroid(
                {
                    x: Math.random() * CANVAS_WIDTH,
                    y: Math.random() * CANVAS_HEIGHT,
                },
                3
            )
        )
}

const moveAsteroids = (asteroids: Asteroid[]) => {
    asteroids.forEach((asteroid, index) => {
        const {
            coordinates,
            relativeDirectionVector,
            rotationSpeed,
            angle,
            speed,
            type,
            size,
        } = asteroid
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
        if (type === 4) {
            if (
                newPos.x > CANVAS_WIDTH + size ||
                newPos.x < -size ||
                newPos.y > CANVAS_HEIGHT + size ||
                newPos.y < -size
            )
                asteroids.splice(index, 1)
        } else {
            if (newPos.x > CANVAS_WIDTH + size)
                newPos.x -= CANVAS_WIDTH + size * 2
            if (newPos.x < 0 - size) newPos.x += CANVAS_WIDTH + size * 2
            if (newPos.y > CANVAS_HEIGHT + size)
                newPos.y -= CANVAS_HEIGHT + size * 2
            if (newPos.y < 0 - size) newPos.y += CANVAS_HEIGHT + size * 2
        }

        asteroid.coordinates = newPos

        const newAngle = angle + rotationSpeed / REFRESH_INTERVAL
        asteroid.angle = newAngle
    })
}

const drawAsteroids = (
    context: CanvasRenderingContext2D,
    asteroids: Asteroid[]
) => {
    if (context) {
        asteroids.forEach((asteroid) => {
            const { size, angle, vertex, offset } = asteroid
            const { x, y } = asteroid.coordinates

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
        })
    }
}

const destroyAsteroid = (
    asteroidArray: Asteroid[],
    asteroid: Asteroid,
    index: number,
    handleParticules: (coordinates: Coordinates) => void
) => {
    const { coordinates, type } = asteroid
    handleParticules(coordinates)

    asteroidArray.splice(index, 1)
    if (type === 4) {
        for (let i = 0; i < 4; i++) {
            asteroidArray.push(
                createAsteroid(coordinates, (type - 1) as AsteroidType)
            )
        }
    } else if (type !== 1) {
        for (let i = 0; i < 5 - asteroid.type; i++) {
            asteroidArray.push(
                createAsteroid(coordinates, (type - 1) as AsteroidType)
            )
        }
    }
}

export {
    AsteroidType,
    Asteroid,
    createAsteroid,
    createGigaAsteroid,
    initAsteroids,
    moveAsteroids,
    drawAsteroids,
    destroyAsteroid,
}
