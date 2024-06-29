import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    NEXT_LEVEL_XP,
    SHIP_LENGTH,
    SHIP_WIDTH,
    XP_BAR_HEIGHT,
    XP_BAR_LENGTH,
} from "./Constants"
import { Ship } from "./Ship"
import { Coordinates } from "./Vector"

const drawWave = (context: CanvasRenderingContext2D, wave: number) => {
    context.textAlign = "left"
    context.fillStyle = "white"
    context.font = "16px sans-serif"
    context.fillText(`Wave ${wave}`, 20, 25)
}

const drawAsteroidNumber = (
    context: CanvasRenderingContext2D,
    asteroidNumber: number
) => {
    context.fillText(`Remaining : ${asteroidNumber}`, 20, 45)
}

const drawCursor = (
    context: CanvasRenderingContext2D,
    cursorPosition: Coordinates
) => {
    const { x, y } = cursorPosition

    context.fillRect(x, y, 1, 1)
    context.fillRect(x, y - 10, 1, 5)
    context.fillRect(x + 6, y, 5, 1)
    context.fillRect(x, y + 6, 1, 5)
    context.fillRect(x - 10, y, 5, 1)
}

const drawShipSprite = (
    context: CanvasRenderingContext2D,
    position: Coordinates
) => {
    const { x, y } = position
    context.beginPath()
    context.moveTo(x, y)
    context.lineTo(x + SHIP_WIDTH / 2, y + SHIP_LENGTH)
    context.lineTo(x - SHIP_WIDTH / 2, y + SHIP_LENGTH)
    context.lineTo(x, y)
    context.stroke()
}

const drawRemainingLives = (
    context: CanvasRenderingContext2D,
    remainingLives: number
) => {
    for (let i = 0; i < remainingLives; i++)
        drawShipSprite(context, {
            x: CANVAS_WIDTH - 2 * (i + 1) * SHIP_WIDTH,
            y: 15,
        })
}

const drawXpBar = (context: CanvasRenderingContext2D, player: Ship) => {
    context.strokeRect(
        CANVAS_WIDTH / 2 - XP_BAR_LENGTH / 2,
        20,
        XP_BAR_LENGTH,
        XP_BAR_HEIGHT
    )
    const xpRatioLenght =
        (player.xp * XP_BAR_LENGTH) / (player.level * NEXT_LEVEL_XP)
    let xpFillLength =
        xpRatioLenght > XP_BAR_LENGTH ? XP_BAR_LENGTH : xpRatioLenght
    context.fillRect(
        CANVAS_WIDTH / 2 - XP_BAR_LENGTH / 2,
        20,
        xpFillLength,
        XP_BAR_HEIGHT
    )
    context.textAlign = "center"
    context.fillText(
        `level ${player.level}`,
        CANVAS_WIDTH / 2,
        40 + XP_BAR_HEIGHT
    )
}

const drawTimer = (context: CanvasRenderingContext2D, timeString: string) => {
    context.textAlign = "left"
    context.fillText(timeString, 20, CANVAS_HEIGHT - 20)
}

export {
    drawWave,
    drawAsteroidNumber,
    drawCursor,
    drawRemainingLives,
    drawXpBar,
    drawTimer,
}
