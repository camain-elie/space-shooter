import { Cursor } from "./Cursor"
import { TitleScreen } from "./TitleScreen"
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants/canvas"

class SpaceShooter {
    gameCanvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    cursor: Cursor
    titleScreen: TitleScreen

    constructor(
        gameCanvas: HTMLCanvasElement,
        context: CanvasRenderingContext2D
    ) {
        this.gameCanvas = gameCanvas
        this.context = context
        this.cursor = new Cursor(gameCanvas, context)
        this.titleScreen = new TitleScreen()
    }

    clear(context: CanvasRenderingContext2D) {
        context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    draw() {
        this.clear(this.context)
        this.titleScreen.draw(this.context)
        this.cursor.draw()
    }
}

export { SpaceShooter }
