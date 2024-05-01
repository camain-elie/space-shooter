// Canvas constants
const REFRESH_INTERVAL = 30
const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 720
// Ship constants
const SHIP_WIDTH = 10
const SHIP_LENGTH = 20
const SHIP_MAX_SPEED = 3
const SHIP_ACCELERATION = 3
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
    relativeDirectionVector: Coordinates
    directionVector: Coordinates
    angle: number
    speed: number
    distanceToCursor: number
    firing: boolean
    lasers: Laser[]
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

const getDistance = (a: Coordinates, b: Coordinates) => {
    const xDiff = a.x - b.x,
        yDiff = a.y - b.y
    return Math.hypot(xDiff, yDiff)
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
    }
}

const getShipOrientationVector = () => {
    const shipVector: Coordinates = { x: 10, y: 0 }
    const cursorVector: Coordinates = {
        x: cursorPosition.x - player.coordinates.x,
        y: -(cursorPosition.y - player.coordinates.y),
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
    return cursorVector.y < 0 ? -angle : angle
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
    for (let i = 0; i < level; i++) {
        console.log(i, level)
        createAsteroid(
            {
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
            },
            3
        )
    }
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

const draw = () => {
    context?.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
    drawPlayer()
    handleAsteroids()
    handleLasers()
    currentInterval++
}

window.setInterval(draw, REFRESH_INTERVAL)

// var myGamePiece: any

// function startGame() {
//     myGamePiece = new (component as any)(30, 30, "red", 10, 120)
//     myGameArea.start()
// }

// type GameArea = {
//     canvas: HTMLCanvasElement
//     context?: CanvasRenderingContext2D
//     interval?: number
//     key: number
//     start: any
//     clear: any
// }

// var myGameArea: GameArea = {
//     canvas: document.createElement("canvas"),
//     key: 0,
//     start: function () {
//         this.canvas.width = 480
//         this.canvas.height = 270
//         this.context = this.canvas.getContext("2d")!
//         document.body.insertBefore(this.canvas, document.body.childNodes[0])
//         this.interval = setInterval(updateGameArea, 20)
//         window.addEventListener("keydown", function (e) {
//             myGameArea.key = e.keyCode
//         })
//         window.addEventListener("keyup", function (e) {
//             myGameArea.key = 0
//         })
//     },
//     clear: function () {
//         this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height)
//     },
// }

// function component(
//     this: any,
//     width: number,
//     height: number,
//     color: CanvasFillStrokeStyles["fillStyle"],
//     x: number,
//     y: number
// ) {
//     this.width = width
//     this.height = height
//     this.speedX = 0
//     this.speedY = 0
//     this.x = x
//     this.y = y
//     this.update = function () {
//         const context = myGameArea.context
//         if (context) {
//             context.fillStyle = color
//             context.fillRect(this.x, this.y, this.width, this.height)
//         }
//     }
//     this.newPos = function () {
//         this.x += this.speedX
//         this.y += this.speedY
//     }
// }

// function updateGameArea() {
//     myGameArea.clear()
//     myGamePiece.speedX = 0
//     myGamePiece.speedY = 0
//     if (myGameArea.key && myGameArea.key == 37) {
//         myGamePiece.speedX = -1
//     }
//     if (myGameArea.key && myGameArea.key == 39) {
//         myGamePiece.speedX = 1
//     }
//     if (myGameArea.key && myGameArea.key == 38) {
//         myGamePiece.speedY = -1
//     }
//     if (myGameArea.key && myGameArea.key == 40) {
//         myGamePiece.speedY = 1
//     }
//     myGamePiece.newPos()
//     myGamePiece.update()
// }

// function moveUp() {
//     myGamePiece.speedY -= 1
// }

// function moveDown() {
//     myGamePiece.speedY += 1
// }

// function moveLeft() {
//     myGamePiece.speedX -= 1
// }
// function moveRight() {
//     myGamePiece.speedX += 1
// }

// function clearMove() {
//     myGamePiece.speedX = 0
//     myGamePiece.speedY = 0
// }

// startGame()
