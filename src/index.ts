// Canvas constants
const REFRESH_INTERVAL = 20
const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 720
// Ship constants
const SHIP_WIDTH = 10
const SHIP_LENGTH = 20
const MAX_SHIP_SPEED = 20

type Coordinates = { x: number; y: number }

const gameCanvas =
    (document.getElementById("gameCanvas") as HTMLCanvasElement) ||
    document.createElement("canvas")
const context = gameCanvas.getContext("2d")
const playerPosition: Coordinates = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
}
const cursorPosition: Coordinates = { x: 0, y: 0 }

// PLAYER MOVEMENTS
gameCanvas.onmousemove = (ev: MouseEvent) => {
    cursorPosition.x = ev.clientX
    cursorPosition.y = ev.clientY
}

const getDistance = (A: Coordinates, B: Coordinates) => {
    const xDiff = A.x - B.x,
        yDiff = A.y - B.y
    return Math.hypot(xDiff, yDiff)
}

// TODO
const getShipOrientationVector = () => {
    const shipVector: Coordinates = { x: 10, y: 0 }
    const cursorVector: Coordinates = {
        x: cursorPosition.x - playerPosition.x,
        y: -(cursorPosition.y - playerPosition.y),
    }

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
    const degAngle = angle * (180 / Math.PI)
    // return cursorVector.y < 0 ? -degAngle : degAngle
    return cursorVector.y < 0 ? -angle : angle
}

const drawPlayer = () => {
    if (context) {
        const shipRotation = getShipOrientationVector()
        context.translate(playerPosition.x, playerPosition.y)
        context.rotate(-shipRotation)

        context?.beginPath()
        context.strokeStyle = "white"
        // context?.moveTo(playerPosition.x - SHIP_LENGTH, playerPosition.y - 5)
        // context?.lineTo(playerPosition.x, playerPosition.y)
        // context?.lineTo(playerPosition.x - SHIP_LENGTH, playerPosition.y + 5)
        context?.moveTo(-SHIP_LENGTH, -5)
        context?.lineTo(0, 0)
        context?.lineTo(-SHIP_LENGTH, 5)
        context?.closePath()
        context?.stroke()

        context.rotate(shipRotation)
        context.translate(-playerPosition.x, -playerPosition.y)

        console.log(getShipOrientationVector())
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
