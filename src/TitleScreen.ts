import { Button } from "./Button"
import { drawMessage } from "./UI"
import { CANVAS_HEIGHT } from "./constants/canvas"

type GameMode = "asteroid" | "adventure" | undefined

class TitleScreen {
    homescreen: boolean
    gameMode: GameMode
    buttons: Button[]
    currentTicking: number

    constructor() {
        this.homescreen = true
        this.buttons = []
        this.currentTicking = 0
    }

    drawTitle(context: CanvasRenderingContext2D) {
        drawMessage(context, "SPACE SHOOTER", 100)
    }

    drawHomeScreen(context: CanvasRenderingContext2D) {
        drawMessage(context, "Welcome pilote, ready to save the galaxy ?", 150)
        this.drawTitle(context)
        drawMessage(
            context,
            "Click to start a game",
            CANVAS_HEIGHT / 2,
            true,
            this.currentTicking
        )
        console.log(this.currentTicking)
    }

    drawGameModeSelection(context: CanvasRenderingContext2D) {
        this.drawTitle(context)
    }

    draw(context: CanvasRenderingContext2D) {
        this.currentTicking++
        if (this.homescreen) this.drawHomeScreen(context)
        else this.drawGameModeSelection(context)
    }
}

export { TitleScreen }
