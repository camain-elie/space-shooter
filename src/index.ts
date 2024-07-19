import { REFRESH_INTERVAL } from "./constants/game"
import { Game } from "./Game"

// @TODO
// Stop movement when mouse off canvas
// Improve deceleration
// Improve acceleration and top speed
// Look into TS ESLint commented rules
// Simplify the vector system with vx, vy
// Look into SAT theorem for better collision detection
// Look into https://stackoverflow.com/questions/17047378/finding-coordinates-after-canvas-rotation
// to avoid rotation and having to find coordinates
// Reorganize files & directories

// Game set up
const gameCanvas =
    (document.getElementById("gameCanvas") as HTMLCanvasElement) ||
    document.createElement("canvas")
const context = gameCanvas.getContext("2d")

const game = new Game()

if (context) {
    gameCanvas.onmousemove = (event: MouseEvent) =>
        game.handleCursorMove(event, gameCanvas)
    gameCanvas.ontouchmove = (event: TouchEvent) =>
        game.handleCursorMove(event, gameCanvas)

    gameCanvas.onclick = () => game.onClick(context)

    gameCanvas.onmousedown = () => game.player.startFiring()
    gameCanvas.ontouchstart = () => game.player.startFiring()

    gameCanvas.onmouseup = () => game.player.stopFiring()
    gameCanvas.ontouchend = () => game.player.stopFiring()

    window.onkeydown = (event: KeyboardEvent) => game.onKeyDown(event)
}

gameCanvas.oncontextmenu = (event: MouseEvent) => event.preventDefault()

context &&
    window.setInterval(() => game.draw(context, gameCanvas), REFRESH_INTERVAL)
