// Canvas constants
const REFRESH_INTERVAL = 30
const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 720
// Ship constants
const SHIP_WIDTH = 10
const SHIP_LENGTH = 20
const SHIP_MAX_SPEED = 3
const SHIP_ACCELERATION = 3
const INVINCIBILITY_TIME = 3
const NUMBER_OF_LIVES = 3
// Laser constants
const LASER_SHOOTING_RATE = 10
const LASER_SHOT_RANGE = 600
const LASER_SHOT_SPEED = 1000
const LASER_SHOT_LENGTH = 10
// Asteroids constants
const ASTEROID_MAX_SPEED = 100
const ASTEROID_SIZE = 20

let currentInterval = 0
let level = 1

// TODO
// Stop movement when mouse off canvas
// Improve deceleration
// Improve acceleration and top speed
// Look into TS ESLint commented rules
// Simplify the vector system with vx, vy
// Look into SAT theorem for better collision detection
// Look into https://stackoverflow.com/questions/17047378/finding-coordinates-after-canvas-rotation
// to avoid rotation and having to find coordinates

interface Coordinates {
    x: number
    y: number
}

interface Laser {
    position: Coordinates
    directionVector: Coordinates
    createdPosition: Coordinates
}

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
    lasers: Laser[]
    invincibilityTime: number
    lives: number
}

type AsteroidSize = 1 | 2 | 3

interface Asteroid {
    coordinates: Coordinates
    relativeDirectionVector: Coordinates
    rotationSpeed: number
    angle: number
    speed: number
    size: AsteroidSize
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
    lasers: [],
    invincibilityTime: 0,
    lives: NUMBER_OF_LIVES,
}

const cursorPosition: Coordinates = {
    ...player.coordinates,
}

const asteroids: Asteroid[] = []

// PLAYER MOVEMENTS
gameCanvas.onmousemove = (ev: MouseEvent) => {
    cursorPosition.x = ev.clientX
    cursorPosition.y = ev.clientY
}

gameCanvas.onmousedown = () => {
    player.firing = true
}

gameCanvas.onmouseup = () => {
    player.firing = false
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

// DRAW
const drawPlayer = () => {
    if (context) {
        player.distanceToCursor = getDistance(
            cursorPosition,
            player.coordinates
        )
        const shipRotation = getShipOrientationVector()
        if (player.distanceToCursor > 50) player.angle = shipRotation
        getAcceleration()
        updateShipPosition()

        context.translate(player.coordinates.x, player.coordinates.y)
        context.rotate(-shipRotation)

        context?.beginPath()
        context.strokeStyle = "white"

        context?.moveTo(-SHIP_LENGTH, -SHIP_WIDTH / 2)
        context?.lineTo(0, 0)
        context?.lineTo(-SHIP_LENGTH, SHIP_WIDTH / 2)
        context?.closePath()
        context?.stroke()

        context.rotate(shipRotation)
        context.translate(-player.coordinates.x, -player.coordinates.y)
    }
}

const handleLasers = () => {
    calculateLasersPosition()
    createNewLaser()
    calculateLasersColision()
    drawLasers()
    deleteLasers()
}

const calculateLasersPosition = () => {
    const distancePerRender = LASER_SHOT_SPEED / REFRESH_INTERVAL
    const laserVectorRatio = ((distancePerRender / 100) * 20) / 100

    player.lasers.forEach((laser) => {
        const newLaserPos: Coordinates = {
            x: laser.position.x + laser.directionVector.x * laserVectorRatio,
            y: laser.position.y + laser.directionVector.y * laserVectorRatio,
        }
        laser.position = { ...newLaserPos }
    })
}

const calculateLasersColision = () => {
    player.lasers.forEach((laser, laserIndex) => {
        asteroids.forEach((asteroid, asteroidIndex) => {
            if (
                getDistance(laser.position, asteroid.coordinates) <
                asteroid.size * ASTEROID_SIZE
            ) {
                player.lasers.splice(laserIndex, 1)
                destroyAsteroid(asteroid, asteroidIndex)
            }
        })
    })
}

const createNewLaser = () => {
    const firingInterval = Math.floor(REFRESH_INTERVAL / LASER_SHOOTING_RATE)
    if (player.firing && currentInterval % firingInterval === 0) {
        const laserDirectionRatio = LASER_SHOT_RANGE / player.distanceToCursor
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
        const laserVectorToLengthRatio = LASER_SHOT_RANGE / LASER_SHOT_LENGTH
        context?.beginPath()
        context?.moveTo(laser.position.x, laser.position.y)
        context?.lineTo(
            laser.position.x +
                laser.directionVector.x / laserVectorToLengthRatio,
            laser.position.y +
                laser.directionVector.y / laserVectorToLengthRatio
        )
        context?.closePath()
        context?.stroke()
    })
}

const deleteLasers = () => {
    player.lasers.forEach((laser, index) => {
        if (
            getDistance(laser.createdPosition, laser.position) >
            LASER_SHOT_RANGE
        )
            player.lasers.splice(index, 1)
    })
}

const initAsteroids = () => {
    for (let i = 0; i < level; i++)
        createAsteroid(
            {
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
            },
            3
        )
}

const moveAsteroids = () => {
    asteroids.forEach((asteroid) => {
        const {
            coordinates,
            relativeDirectionVector,
            rotationSpeed,
            angle,
            speed,
            size,
        } = asteroid
        const { x, y } = coordinates
        const radius = size * ASTEROID_SIZE
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
        if (newPos.x > CANVAS_WIDTH + radius)
            newPos.x -= CANVAS_WIDTH + radius * 2
        if (newPos.x < 0 - radius) newPos.x += CANVAS_WIDTH + radius * 2
        if (newPos.y > CANVAS_HEIGHT + radius)
            newPos.y -= CANVAS_HEIGHT + radius * 2
        if (newPos.y < 0 - radius) newPos.y += CANVAS_HEIGHT + radius * 2

        asteroid.coordinates = newPos

        const newAngle = angle + rotationSpeed / REFRESH_INTERVAL
        asteroid.angle = newAngle
    })
}

const drawAsteroids = () => {
    asteroids.forEach((asteroid) => {
        const { size, angle } = asteroid
        const { x, y } = asteroid.coordinates
        context?.beginPath()
        // add a notch to visualize the rotation
        context?.arc(
            x,
            y,
            size * ASTEROID_SIZE,
            angle,
            angle + (2 * Math.PI - 0.2)
        )
        context?.stroke()
    })
}

const createAsteroid = (coordinates: Coordinates, size: AsteroidSize) => {
    // this will only implement a simplified version of an asteroid for now
    asteroids.push({
        coordinates,
        relativeDirectionVector: {
            x: Math.random() * (20 + 20) - 20,
            y: Math.random() * (20 + 20) - 20,
        },
        rotationSpeed: Math.random() * 4 - 2,
        angle: 0,
        speed: Math.random() * ASTEROID_MAX_SPEED,
        size,
    })
}

const destroyAsteroid = (asteroid: Asteroid, index: number) => {
    const { coordinates, size } = asteroid
    if (asteroid.size === 1) {
        asteroids.splice(index, 1)
    } else {
        for (let i = 0; i < 5 - asteroid.size; i++) {
            createAsteroid(coordinates, (size - 1) as AsteroidSize)
        }
        asteroids.splice(index, 1)
    }
}

const handleAsteroids = () => {
    if (asteroids.length) {
        moveAsteroids()
        drawAsteroids()
    } else {
        level++
        initAsteroids()
    }
}

const detectPlayerCollision = () => {
    const { coordinates } = player
    if (player.invincibilityTime) player.invincibilityTime--
    else {
        asteroids.forEach((asteroid) => {
            const { size, coordinates: asteroidPosition } = asteroid
            if (
                getDistance(coordinates, asteroidPosition) <
                    size * ASTEROID_SIZE ||
                getDistance(player.leftWing, asteroidPosition) <
                    size * ASTEROID_SIZE ||
                getDistance(player.rightWing, asteroidPosition) <
                    size * ASTEROID_SIZE
            ) {
                console.log("aouch")
                player.invincibilityTime = INVINCIBILITY_TIME * REFRESH_INTERVAL
                player.lives--
                if (player.lives > 0)
                    console.log(`Only ${player.lives} life left !`)
                else console.log("Uh uh... End of game bruh")
            }
        })
    }
}

const draw = () => {
    context?.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
    drawPlayer()
    handleAsteroids()
    handleLasers()
    detectPlayerCollision()

    currentInterval++
}

window.setInterval(draw, REFRESH_INTERVAL)
