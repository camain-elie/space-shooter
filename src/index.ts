// Canvas constants
const REFRESH_INTERVAL = 20
const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 720
// Ship constants
const SHIP_WIDTH = 10
const SHIP_LENGTH = 20
const SHIP_MAX_SPEED = 5
const SHIP_ACCELERATION = 5

let second = 0

type Coordinates = { x: number; y: number }
type Ship = {
    coordinates: Coordinates
    directionVector: Coordinates
    angle: number
    speed: number
    acceleration: number
    distanceToCursor: number
}

const gameCanvas =
    (document.getElementById("gameCanvas") as HTMLCanvasElement) ||
    document.createElement("canvas")
const context = gameCanvas.getContext("2d")
const player: Ship = {
    coordinates: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
    },
    directionVector: {
        x: 0,
        y: 0,
    },
    angle: 0,
    speed: 0,
    acceleration: 0,
    distanceToCursor: 0,
}
const cursorPosition: Coordinates = { x: 0, y: 0 }

// PLAYER MOVEMENTS
gameCanvas.onmousemove = (ev: MouseEvent) => {
    cursorPosition.x = ev.clientX
    cursorPosition.y = ev.clientY
    console.log(ev.clientX, ev.clientY)
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
    const distancePercentage =
        (player.speed * 100) / player.distanceToCursor / REFRESH_INTERVAL
    // console.log(!(second % 20))
    const newVec = {
        x: cursorPosition.x - player.coordinates.x,
        y: cursorPosition.y - player.coordinates.y,
    }
    !(second % 40) &&
        console.log(
            distancePercentage,
            player.directionVector.x,
            player.directionVector.y,
            cursorPosition.x,
            cursorPosition.y,
            player.coordinates.x,
            player.coordinates.y
        )
    // player.coordinates.x += player.directionVector.x * distancePercentage
    // player.coordinates.y += player.directionVector.y * distancePercentage
    player.coordinates.x += newVec.x * distancePercentage
    player.coordinates.y += newVec.y * distancePercentage
    // console.log(player.coordinates)
    second++
}

// UTILS
const getShipOrientationVector = () => {
    const shipVector: Coordinates = { x: 10, y: 0 }
    const cursorVector: Coordinates = {
        x: cursorPosition.x - player.coordinates.x,
        y: -(cursorPosition.y - player.coordinates.y),
    }
    player.directionVector = { ...cursorVector }
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

const draw = () => {
    context?.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
    drawPlayer()
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
