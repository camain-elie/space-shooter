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
const LASER_SHOOTING_RATE = 5
const LASER_SHOT_RANGE = 350
const LASER_SHOT_SPEED = 1000
const LASER_SHOT_LENGTH = 10

let currentInterval = 0

// TODO
// Stop movement when mouse off canvas
// Improve deceleration
// Improve acceleration and top speed

type Coordinates = { x: number; y: number }

type Laser = {
    angle: number
    position: Coordinates
    directionVector: Coordinates
    createdPosition: Coordinates
}

type Ship = {
    coordinates: Coordinates
    relativeDirectionVector: Coordinates
    directionVector: Coordinates
    angle: number
    speed: number
    distanceToCursor: number
    firing: boolean
    lasers: Array<Laser>
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

// PLAYER MOVEMENTS
gameCanvas.onmousemove = (ev: MouseEvent) => {
    cursorPosition.x = ev.clientX
    cursorPosition.y = ev.clientY
}

gameCanvas.onmousedown = (ev: MouseEvent) => {
    player.firing = true
}
gameCanvas.onmouseup = (ev: MouseEvent) => {
    player.firing = false
}

const getDistance = (A: Coordinates, B: Coordinates) => {
    const xDiff = A.x - B.x,
        yDiff = A.y - B.y
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

        context?.moveTo(-SHIP_LENGTH, -5)
        context?.lineTo(0, 0)
        context?.lineTo(-SHIP_LENGTH, 5)
        context?.closePath()
        context?.stroke()

        context.rotate(shipRotation)
        context.translate(-player.coordinates.x, -player.coordinates.y)
    }
}

const drawLasers = () => {
    // Laser position calculation
    // const totalLaserTime = LASER_SHOT_RANGE / LASER_SHOT_SPEED
    // const distancePerRender =
    //     LASER_SHOT_RANGE / (totalLaserTime * REFRESH_INTERVAL)
    // console.log(distancePerRender)
    const distancePerRender = LASER_SHOT_SPEED / REFRESH_INTERVAL
    const laserVectorRatio = ((distancePerRender / 100) * 20) / 100

    console.log(laserVectorRatio)
    player.lasers.forEach((laser, index) => {
        // const newLaserVector: Coordinates = { laser.fire}
        const newLaserPos: Coordinates = {
            x: laser.position.x + laser.directionVector.x * laserVectorRatio,
            y: laser.position.y + laser.directionVector.y * laserVectorRatio,
        }
        // if (currentInterval % 10 === 0 && index === 0)
        //     console.log(laser, newLaserPos, laserVectorRatio)
        laser.position = { ...newLaserPos }
    })

    // Laser creation
    const firingInterval = Math.floor(REFRESH_INTERVAL / LASER_SHOOTING_RATE)
    if (player.firing && currentInterval % firingInterval === 0) {
        const laserDirectionRatio = LASER_SHOT_RANGE / player.distanceToCursor
        console.log("Pew", laserDirectionRatio, player.directionVector)
        player.lasers.push({
            angle: 0,
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

    // Draw lasers
    player.lasers.forEach((laser, index) => {
        const laserVectorToLengthRatio = LASER_SHOT_RANGE / LASER_SHOT_LENGTH
        // const laserPath: Coordinates = {
        //     x: laser.position
        // }
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

    // Delete lasers
    player.lasers.forEach((laser, index) => {
        if (
            getDistance(laser.createdPosition, laser.position) >
            LASER_SHOT_RANGE
        )
            player.lasers.splice(index, 1)
    })
}

const draw = () => {
    context?.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
    drawPlayer()
    drawLasers()
    currentInterval++
}

setInterval(draw, REFRESH_INTERVAL)

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
