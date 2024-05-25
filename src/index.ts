import { Ship } from "./Ship"
import { Coordinates } from "./Vector"
import * from "./Particules"

import {
    INVINCIBILITY_TIME,
    LASER_SHOOTING_RATE,
    LASER_RANGE,
} from "./constants"

// Canvas constants
const REFRESH_INTERVAL = 30
const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 720
// Game constants
const NEW_GAME_DELAY = 2
const NUMBER_OF_LIVES = 3
const XP_BAR_LENGTH = 300
const XP_BAR_HEIGHT = 10
const NEXT_LEVEL_XP = 30
// Ship constants
const SHIP_WIDTH = 10
const SHIP_LENGTH = 20
const SHIP_MAX_SPEED = 3
const SHIP_ACCELERATION = 3
// Laser constants
const LASER_SHOT_SPEED = 1000
const LASER_SHOT_LENGTH = 10
// Asteroids constants
const ASTEROID_MAX_SPEED = 100
const ASTEROID_SIZE = 20
const GIGA_ASTEROID_SIZE = 200
const ASTEROID_JAGGEDNESS = 0.3
const ASTEROID_PARTICULE_LENGTH = 2
const ASTEROID_PARTICULE_MIN_SPEED = 50
const ASTEROID_PARTICULE_MAX_SPEED = 200
const ASTEROID_PARTICULE_MAX_RANGE = 100

let currentInterval = 0
let wave = 1
let startGame = true
let endGame = false
let isPaused = false
let upgradeMenu = false
let newGameDelay = 0
let laserTicking = 0

// TODO
// Stop movement when mouse off canvas
// Improve deceleration
// Improve acceleration and top speed
// Look into TS ESLint commented rules
// Simplify the vector system with vx, vy
// Look into SAT theorem for better collision detection
// Look into https://stackoverflow.com/questions/17047378/finding-coordinates-after-canvas-rotation
// to avoid rotation and having to find coordinates

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

// Game set up
const gameCanvas =
    (document.getElementById("gameCanvas") as HTMLCanvasElement) ||
    document.createElement("canvas")
const context = gameCanvas.getContext("2d")

const player: Ship = {
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
    speed: 0,
    distanceToCursor: 0,
    firing: false,
    laserRate: LASER_SHOOTING_RATE,
    laserRange: LASER_RANGE,
    lasers: [],
    invincibilityTime: 0,
    lives: NUMBER_OF_LIVES,
    level: 1,
    xp: 0,
}

const cursorPosition: Coordinates = {
    ...player.coordinates,
}

const asteroids: Asteroid[] = []
const asteroidParticules: AsteroidParticule[] = []
const backgroundParticules: ExplosionParticule[] = []
const explosionParticules: ExplosionParticule[] = []

// PLAYER MOVEMENTS
gameCanvas.onmousemove = (ev: MouseEvent) => {
    const rect = gameCanvas.getBoundingClientRect()
    cursorPosition.x = ev.clientX - rect.left
    cursorPosition.y = ev.clientY - rect.top
}

gameCanvas.onclick = () => {
    if (startGame) startGame = false
    if (endGame && !newGameDelay) restartGame()
}

gameCanvas.onmousedown = () => {
    player.firing = true
}

gameCanvas.onmouseup = () => {
    player.firing = false
    laserTicking = 0
}

window.onkeydown = (event: KeyboardEvent) => {
    if (event.key.toLocaleLowerCase() === "p" && !startGame && !endGame)
        isPaused = !isPaused
}

// UTILS
const getDistance = (a: Coordinates, b: Coordinates) => {
    const xDiff = a.x - b.x,
        yDiff = a.y - b.y
    return Math.hypot(xDiff, yDiff)
}

const inverseVector = (vector: Coordinates) => {
    return { x: -vector.x, y: -vector.y }
}

const changeVectorLength = (vector: Coordinates, length: number) => {
    const vectorLength = getDistance({ x: 0, y: 0 }, vector)
    const vectorLengthRatio = length / vectorLength
    return { x: vector.x * vectorLengthRatio, y: vector.y * vectorLengthRatio }
}

const getPerpendicularVector = (vector: Coordinates) => ({
    x: vector.y,
    y: -vector.x,
})

const restartGame = () => {
    endGame = false
    wave = 0
    asteroids.length = 0

    player.level = 1
    player.xp = 0
    player.lasers.length = 0
    player.lives = NUMBER_OF_LIVES
    player.invincibilityTime = INVINCIBILITY_TIME
    player.laserRange = LASER_RANGE
    player.laserRate = LASER_SHOOTING_RATE
}

const initWave = () => {
    if (currentInterval) wave++

    initAsteroids()
    if (wave % 3 === 0) createGigaAsteroid()
    player.invincibilityTime = INVINCIBILITY_TIME * REFRESH_INTERVAL
}

const getAcceleration = () => {
    if (player.distanceToCursor <= 20 && player.speed) {
        player.speed = 0
    } else if (player.speed < SHIP_MAX_SPEED && player.distanceToCursor > 50) {
        const newSpeed = player.speed + SHIP_ACCELERATION / REFRESH_INTERVAL
        player.speed = newSpeed > SHIP_MAX_SPEED ? SHIP_MAX_SPEED : newSpeed
    } else if (player.speed > 3 && player.distanceToCursor <= 50) {
        const newSpeed = player.speed - SHIP_ACCELERATION / REFRESH_INTERVAL
        player.speed = newSpeed < 0 ? 1 : newSpeed
    }
}

const updateShipPosition = () => {
    if (player.distanceToCursor) {
        const distancePercentage =
            (player.speed * 100) / player.distanceToCursor / REFRESH_INTERVAL

        const newVec = {
            x: cursorPosition.x - player.coordinates.x,
            y: cursorPosition.y - player.coordinates.y,
        }

        player.coordinates.x += newVec.x * distancePercentage
        player.coordinates.y += newVec.y * distancePercentage

        updateWingsPosition()
    }
}

const updateWingsPosition = () => {
    const { coordinates, relativeDirectionVector } = player
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
    const perpendicularVector = changeVectorLength(
        getPerpendicularVector(baseToNoseVector),
        SHIP_WIDTH / 2
    )
    const inversePerpendicularVector = inverseVector(perpendicularVector)

    player.leftWing = {
        x: basePoint.x + perpendicularVector.x,
        y: basePoint.y + perpendicularVector.y,
    }
    player.rightWing = {
        x: basePoint.x + inversePerpendicularVector.x,
        y: basePoint.y + inversePerpendicularVector.y,
    }
    player.basePoint = { ...basePoint }
}

const getShipOrientationVector = () => {
    const shipVector: Coordinates = { x: 10, y: 0 }
    const cursorVector: Coordinates = {
        x: cursorPosition.x - player.coordinates.x,
        y: cursorPosition.y - player.coordinates.y,
    }
    player.relativeDirectionVector = { ...cursorVector }
    player.directionVector = { ...cursorPosition }
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

const handleXp = (asteroid: Asteroid) => {
    const { type } = asteroid
    player.xp += type === 4 ? 50 : 4 - type
    if (player.xp > player.level * NEXT_LEVEL_XP) {
        player.xp = player.xp - player.level * NEXT_LEVEL_XP
        player.level++
        upgradeMenu = true
        player.laserRange += 20
        if (
            player.laserRate < 29 &&
            (player.laserRate < 10 || player.level % 3 === 0)
        )
            player.laserRate += 1
    }
}

// DRAW
const drawUIElements = () => {
    if (context) {
        const { x, y } = cursorPosition

        // draw the wave
        context.textAlign = "left"
        context.fillStyle = "white"
        context.font = "16px sans-serif"
        context.fillText(`Wave ${wave}`, 20, 25)

        // draw the number of remaining asteroids
        context.fillText(`Remaining : ${asteroids.length}`, 20, 45)

        // draw the cursor
        context.fillRect(x, y, 1, 1)
        context.fillRect(x, y - 10, 1, 5)
        context.fillRect(x + 6, y, 5, 1)
        context.fillRect(x, y + 6, 1, 5)
        context.fillRect(x - 10, y, 5, 1)

        // draw number of lives
        for (let i = 0; i < player.lives; i++)
            drawShipSprite(CANVAS_WIDTH - 2 * (i + 1) * SHIP_WIDTH, 15)

        // draw xp bar
        context.strokeRect(
            CANVAS_WIDTH / 2 - XP_BAR_LENGTH / 2,
            20,
            XP_BAR_LENGTH,
            XP_BAR_HEIGHT
        )
        const xpFillLength =
            (player.xp * XP_BAR_LENGTH) / (player.level * NEXT_LEVEL_XP)
        context.fillRect(
            CANVAS_WIDTH / 2 - XP_BAR_LENGTH / 2,
            20,
            xpFillLength,
            XP_BAR_HEIGHT
        )
        context.textAlign = "center"
        context.fillText(
            `level ${player.level}`,
            CANVAS_WIDTH / 2,
            40 + XP_BAR_HEIGHT
        )
    }
}

const drawShipSprite = (x: number, y: number) => {
    if (context) {
        context.beginPath()
        context.moveTo(x, y)
        context.lineTo(x + SHIP_WIDTH / 2, y + SHIP_LENGTH)
        context.lineTo(x - SHIP_WIDTH / 2, y + SHIP_LENGTH)
        context.lineTo(x, y)
        context.stroke()
    }
}

const drawPlayer = () => {
    const { invincibilityTime } = player
    if (context) {
        player.distanceToCursor = getDistance(
            cursorPosition,
            player.coordinates
        )
        const shipRotation = getShipOrientationVector()
        if (player.distanceToCursor > 50) player.angle = shipRotation
        getAcceleration()
        updateShipPosition()

        if (invincibilityTime) {
            context.strokeStyle = invincibilityTime
                ? `rgba(255,255,255, ${(invincibilityTime % 6) / 10})`
                : "white"
        } else if (!player.lives) context.strokeStyle = "red"
        context.translate(player.coordinates.x, player.coordinates.y)
        context.rotate(-shipRotation)

        context?.beginPath()

        context?.moveTo(-SHIP_LENGTH, -SHIP_WIDTH / 2)
        context?.lineTo(0, 0)
        context?.lineTo(-SHIP_LENGTH, SHIP_WIDTH / 2)
        context?.closePath()
        context?.stroke()

        context.rotate(shipRotation)
        context.translate(-player.coordinates.x, -player.coordinates.y)
        if (player.lives) context.strokeStyle = "white"
    }
}

const calculateParticulePosition = (
    particule: AsteroidParticule
): Coordinates => {
    const distancePerRender = particule.speed / REFRESH_INTERVAL
    const particuleVectorRatio =
        distancePerRender /
        getDistance({ x: 0, y: 0 }, particule.directionVector)
    return {
        x:
            particule.position.x +
            particule.directionVector.x * particuleVectorRatio,
        y:
            particule.position.y +
            particule.directionVector.y * particuleVectorRatio,
    }
}

const drawParticule = (particule: AsteroidParticule, length: number) => {
    const particuleVectorToLengthRatio =
        getDistance({ x: 0, y: 0 }, particule.directionVector) / length
    context?.beginPath()
    context?.moveTo(particule.position.x, particule.position.y)
    context?.lineTo(
        particule.position.x +
            particule.directionVector.x / particuleVectorToLengthRatio,
        particule.position.y +
            particule.directionVector.y / particuleVectorToLengthRatio
    )
    context?.closePath()
    context?.stroke()
}

const handleLasers = () => {
    calculateLasersPosition()
    createNewLaser()
    calculateLasersColision()
    drawLasers()
    deleteLasers()
}

const calculateLasersPosition = () => {
    player.lasers.forEach((laser) => {
        laser.position = calculateParticulePosition({
            ...laser,
            range: player.laserRange,
            speed: LASER_SHOT_SPEED,
        })
    })
}

const calculateLasersColision = () => {
    player.lasers.forEach((laser, laserIndex) => {
        asteroids.forEach((asteroid, asteroidIndex) => {
            if (
                getDistance(laser.position, asteroid.coordinates) <
                asteroid.size
            ) {
                player.lasers.splice(laserIndex, 1)
                if (asteroid.health > 1) {
                    asteroid.health--
                    createParticules(laser.position)
                } else {
                    handleXp(asteroid)
                    destroyAsteroid(asteroid, asteroidIndex)
                }
            }
        })
    })
}

const createNewLaser = () => {
    const firingInterval = Math.floor(REFRESH_INTERVAL / player.laserRate)
    if (player.firing && laserTicking % firingInterval === 0) {
        const laserDirectionRatio = player.laserRange / player.distanceToCursor
        player.lasers.push({
            position: { ...player.coordinates },
            directionVector: {
                x:
                    (player.directionVector.x - player.coordinates.x) *
                    laserDirectionRatio,
                y:
                    (player.directionVector.y - player.coordinates.y) *
                    laserDirectionRatio,
            },
            createdPosition: { ...player.coordinates },
        })
    }
}

const drawLasers = () => {
    player.lasers.forEach((laser) => {
        drawParticule(
            { ...laser, range: player.laserRange, speed: LASER_SHOT_SPEED },
            LASER_SHOT_LENGTH
        )
    })
}

const deleteLasers = () => {
    player.lasers.forEach((laser, index) => {
        if (
            getDistance(laser.createdPosition, laser.position) >
            player.laserRange
        )
            player.lasers.splice(index, 1)
    })
}

const initAsteroids = () => {
    for (let i = 0; i < wave; i++)
        createAsteroid(
            {
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
            },
            3
        )
}

const moveAsteroids = () => {
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

const drawAsteroids = () => {
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

const createGigaAsteroid = () => {
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

    asteroids.push(asteroid)
}

const destroyAsteroid = (asteroid: Asteroid, index: number) => {
    const { coordinates, type } = asteroid
    createParticules(coordinates)

    asteroids.splice(index, 1)
    if (type === 4) {
        for (let i = 0; i < 4; i++) {
            createAsteroid(coordinates, (type - 1) as AsteroidType)
        }
    } else if (type !== 1) {
        for (let i = 0; i < 5 - asteroid.type; i++) {
            createAsteroid(coordinates, (type - 1) as AsteroidType)
        }
    }
}

const handleAsteroids = () => {
    if (asteroids.length) {
        moveAsteroids()
        drawAsteroids()
    } else initWave()
}

const handleAsteroidParticules = () => {
    calculateAsteroidParticulesPosition()
    drawAsteroidParticules()
    deleteParticules(asteroidParticules)
}

const calculateAsteroidParticulesPosition = () => {
    asteroidParticules.forEach((particule) => {
        const newParticulePos: Coordinates =
            calculateParticulePosition(particule)
        particule.position = { ...newParticulePos }
    })
}

const createParticules = (position: Coordinates, particuleNumber = 10) => {
    for (let i = 0; i < particuleNumber; i++) {
        asteroidParticules.push({
            createdPosition: position,
            directionVector: {
                x: Math.random() * (10 + 10) - 10,
                y: Math.random() * 20 - 10,
            },
            range: Math.random() * ASTEROID_PARTICULE_MAX_RANGE,
            speed:
                Math.random() *
                    (ASTEROID_PARTICULE_MAX_SPEED -
                        ASTEROID_PARTICULE_MIN_SPEED) +
                ASTEROID_PARTICULE_MIN_SPEED,
            position,
        })
    }
}

const drawAsteroidParticules = () => {
    asteroidParticules.forEach((particule) => {
        drawParticule(particule, ASTEROID_PARTICULE_LENGTH)
    })
}

const deleteParticules = (particuleArray: AsteroidParticule[]) => {
    particuleArray.forEach((particule, index) => {
        if (
            getDistance(particule.createdPosition, particule.position) >
            particule.range
        )
            particuleArray.splice(index, 1)
    })
}

const createExplosion = (position: Coordinates) => {
    createParticules(position, 50)

    for (let i = 0; i < 30; i++) {
        explosionParticules.push({
            createdPosition: position,
            directionVector: {
                x: Math.random() * (10 + 10) - 10,
                y: Math.random() * 20 - 10,
            },
            range: Math.random() * ASTEROID_PARTICULE_MAX_RANGE,
            speed:
                Math.random() *
                    (ASTEROID_PARTICULE_MAX_SPEED -
                        ASTEROID_PARTICULE_MIN_SPEED) +
                ASTEROID_PARTICULE_MIN_SPEED,
            position,
            opacity: Math.random() * 0.8,
            size: Math.random() * 2 + 2,
        })
    }
}

const handleExplosions = () => {
    moveExplosionParticules()
    deleteParticules(explosionParticules)
    drawExplosionParticules()
}

const moveExplosionParticules = () => {
    explosionParticules.forEach((particule) => {
        const newParticulePos: Coordinates =
            calculateParticulePosition(particule)
        particule.position = { ...newParticulePos }
    })
    if (explosionParticules.length) console.log(explosionParticules[0])
}

const drawExplosionParticules = () => {
    if (context) {
        explosionParticules.forEach((particule) => {
            const {
                position: { x, y },
                opacity,
                size,
            } = particule
            context.fillStyle = `rgba(255, 255, 255, ${opacity})`
            context.beginPath()
            context.arc(x, y, size, 0, 2 * Math.PI)
            context.fill()
            context.closePath()
        })
    }
}

const handleBackground = () => {
    moveBackgroundParticules()
    drawBackgroundParticules()
}

const moveBackgroundParticules = () => {
    backgroundParticules.forEach((particule) => {
        const {
            position: { x, y },
            speed,
            size,
        } = particule
        const { relativeDirectionVector: directionVector, speed: playerSpeed } =
            player

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

        particule.position = newPos
    })
}

const drawBackgroundParticules = () => {
    if (context) {
        backgroundParticules.forEach((particule) => {
            const {
                position: { x, y },
                opacity,
                size,
            } = particule
            context.fillStyle = `rgba(255, 255, 255, ${opacity})`
            context.beginPath()
            context.arc(x, y, size, 0, 2 * Math.PI)
            context.fill()
            context.closePath()
        })
    }
}

const createBackground = () => {
    for (let i = 0; i < 100; i++) {
        const position = {
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
        }
        const backgroundLevel = Math.random()
        const particule: ExplosionParticule = {
            createdPosition: { ...position },
            position: { ...position },
            directionVector: { x: 0, y: 0 },
            range: 0,
            speed: backgroundLevel * 8 + 1,
            opacity: backgroundLevel,
            size: backgroundLevel * 1 + 0.5,
        }
        backgroundParticules.push(particule)
    }
}

const detectPlayerCollision = () => {
    const { coordinates, invincibilityTime } = player
    if (!player.lives) return

    if (invincibilityTime) player.invincibilityTime--
    else {
        asteroids.forEach((asteroid) => {
            const { size, coordinates: asteroidPosition } = asteroid
            if (
                !player.invincibilityTime &&
                (getDistance(coordinates, asteroidPosition) < size ||
                    getDistance(player.leftWing, asteroidPosition) < size ||
                    getDistance(player.rightWing, asteroidPosition) < size)
            ) {
                player.lives--
                if (player.lives > 0)
                    player.invincibilityTime =
                        INVINCIBILITY_TIME * REFRESH_INTERVAL
                else {
                    createExplosion(player.coordinates)
                    endGame = true
                    newGameDelay = NEW_GAME_DELAY * REFRESH_INTERVAL
                }
            }
        })
    }
}

const drawMessage = (
    message: string,
    flicker = false,
    y: number = CANVAS_HEIGHT / 2
) => {
    if (context) {
        context.textAlign = "center"
        context.font = "22px sans-serif"
        context.fillStyle = flicker
            ? `rgba( 255, 255, 255, ${
                  (currentInterval % (4 * REFRESH_INTERVAL)) /
                  (6 * REFRESH_INTERVAL)
              })`
            : "white"
        context.fillText(message, CANVAS_WIDTH / 2, y)
    }
}

const renderUpgradeMenu = () => {
    drawMessage("Choose an upgrade", false, 150)
    if (context) {
        context.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 150, 300, 300)
        context.rect(CANVAS_WIDTH / 2 - 500, CANVAS_HEIGHT / 2 - 150, 300, 300)
        context.rect(CANVAS_WIDTH / 2 + 200, CANVAS_HEIGHT / 2 - 150, 300, 300)
        context.stroke()
        context.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 150, 300, 300)
        context.rect(CANVAS_WIDTH / 2 - 500, CANVAS_HEIGHT / 2 - 150, 300, 300)
        context.rect(CANVAS_WIDTH / 2 + 200, CANVAS_HEIGHT / 2 - 150, 300, 300)
        context.fillStyle = "#0a132d"
        context.fill()
        // context.rect(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2 - 100, 200, 200)
        // context.rect(CANVAS_WIDTH / 2 - 350, CANVAS_HEIGHT / 2 - 100, 200, 200)
        // context.rect(CANVAS_WIDTH / 2 + 150, CANVAS_HEIGHT / 2 - 100, 200, 200)
        // context.stroke()
    }
}

const draw = () => {
    if (!isPaused && !upgradeMenu) {
        context?.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
        handleBackground()
        handleAsteroids()
        handleAsteroidParticules()
        handleExplosions()
        drawUIElements()
        if (!endGame && !startGame) {
            drawPlayer()
            handleLasers()
            detectPlayerCollision()
        } else {
            drawMessage(
                startGame
                    ? "Welcome pilot ! Ready to shoot some rocks ?"
                    : "Your ship has been destroyed... Try again !"
            )
            if (!newGameDelay) {
                drawMessage(
                    "Click to start a new game",
                    true,
                    CANVAS_HEIGHT / 2 + 30
                )
            } else newGameDelay--
        }

        currentInterval++
        if (player.firing) laserTicking++
    } else if (isPaused) {
        drawMessage("Game paused")
        drawMessage("Press P to resume", true, CANVAS_HEIGHT / 2 + 30)
    } else {
        renderUpgradeMenu()
    }
}

createBackground()

window.setInterval(draw, REFRESH_INTERVAL)
