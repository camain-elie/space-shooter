import { Coordinates } from "./Vector"
import { CANVAS_CENTER } from "./constants/canvas"

class Cursor {
    gameCanvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    position: Coordinates

    constructor(
        gameCanvas: HTMLCanvasElement,
        context: CanvasRenderingContext2D
    ) {
        this.gameCanvas = gameCanvas
        this.context = context
        this.position = CANVAS_CENTER

        this.gameCanvas.onmousemove = (event: MouseEvent) =>
            this.handleCursorMove(event)
        this.gameCanvas.ontouchmove = (event: TouchEvent) =>
            this.handleCursorMove(event)
    }

    handleCursorMove(event: MouseEvent | TouchEvent) {
        const rect = this.gameCanvas.getBoundingClientRect()
        let clientX, clientY
        if (event instanceof MouseEvent) {
            ;({ clientX, clientY } = event)
        } else {
            const touch = event.touches[0]
            ;({ clientX, clientY } = touch)
        }
        this.position.x = clientX - rect.left
        this.position.y = clientY - rect.top
    }

    draw() {
        const {
            context,
            position: { x, y },
        } = this

        context.fillStyle = "white"
        context.fillRect(x, y, 1, 1)
        context.fillRect(x, y - 10, 1, 5)
        context.fillRect(x + 6, y, 5, 1)
        context.fillRect(x, y + 6, 1, 5)
        context.fillRect(x - 10, y, 5, 1)
    }
}

export { Cursor }
