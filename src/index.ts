const SHIP_WIDTH = 10
const SHIP_LENGTH = 20

const gameCanvas =
    (document.getElementById("gameCanvas") as HTMLCanvasElement) ||
    document.createElement("canvas")
const context = gameCanvas.getContext("2d")
const playerPos = {
    x: 50,
    y: 50,
}
gameCanvas.onmousemove = (ev) => {
    console.log(ev)
    playerPos.x = ev.clientX
    playerPos.y = ev.clientY
}

const drawPlayer = () => {
    if (context) {
        context?.beginPath()
        context.strokeStyle = "white"
        context?.moveTo(playerPos.x - SHIP_LENGTH, playerPos.y - 5)
        context?.lineTo(playerPos.x, playerPos.y)
        context?.lineTo(playerPos.x - SHIP_LENGTH, playerPos.y + 5)
        context?.closePath()
        context?.stroke()
    }
}

const draw = () => {
    context?.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
    drawPlayer()
}

setInterval(draw, 20)

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
