import {
    CANVAS_HEIGHT,
    CANVAS_SIDE_MARGIN,
    CANVAS_WIDTH,
    JAUGE_COLOR,
    NEXT_LEVEL_XP,
    REFRESH_INTERVAL,
    SHIP_LENGTH,
    SHIP_WIDTH,
    UPGRADE_BUTTON_WIDTH,
    UPGRADE_JAUGE_HEIGHT,
    UPGRADE_JAUGE_LENGTH,
    XP_BAR_HEIGHT,
    XP_BAR_LENGTH,
} from "./Constants"
import { Ship } from "./Ship"
import { Upgrade } from "./Upgrade"
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
    const xpFillLength =
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
    context.fillText(timeString, 20, 65)
}

const drawUpgradeButton = (
    context: CanvasRenderingContext2D,
    upgrade: Upgrade
) => {
    const x = CANVAS_SIDE_MARGIN + UPGRADE_JAUGE_LENGTH,
        y = upgrade.yPosition

    context.beginPath()
    // draw button border
    context.roundRect(
        x,
        y,
        UPGRADE_BUTTON_WIDTH,
        UPGRADE_JAUGE_HEIGHT,
        [0, 5, 5, 0]
    )
    // draw "+" symbol
    context.fillRect(x + 5, y + UPGRADE_JAUGE_HEIGHT / 2 - 1, 10, 2)
    context.fillRect(x + UPGRADE_BUTTON_WIDTH / 2 - 1, y + 5, 2, 10)
    context.stroke()
    // add "unable visual" to the button
    if (upgrade.currentUpgrade === upgrade.maxUpgrade) {
        context.textAlign = "left"
        context.fillStyle = JAUGE_COLOR
        context.fillText("MAX", x + UPGRADE_BUTTON_WIDTH + 10, y + 15)
        context.fill()
    }
    context.closePath()
}

const drawMessage = (
    context: CanvasRenderingContext2D,
    message: string,
    y: number = CANVAS_HEIGHT / 2,
    flicker = false,
    currentInterval = 0
) => {
    context.textAlign = "center"
    context.font = "22px sans-serif"
    context.fillStyle = flicker
        ? `rgba( 255, 255, 255, ${
              (currentInterval % (4 * REFRESH_INTERVAL)) /
              (6 * REFRESH_INTERVAL)
          })`
        : "white"
    context.fillText(message, CANVAS_WIDTH / 2, y)
}

const getLines = (
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
) => {
    const words = text.split(" ")
    const lines: string[] = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = context.measureText(currentLine + " " + word).width
        if (width < maxWidth) {
            currentLine += " " + word
        } else {
            lines.push(currentLine)
            currentLine = word
        }
    }
    lines.push(currentLine)
    return lines
}

const multiLineFillText = (
    context: CanvasRenderingContext2D,
    text: string,
    position: Coordinates,
    maxWidth: number,
    lineHeight: number
) => {
    const lines = getLines(context, text, maxWidth)
    lines.forEach((line, index) => {
        context.fillText(
            line,
            position.x,
            position.y + lineHeight * index,
            maxWidth
        )
    })
}

export {
    drawWave,
    drawAsteroidNumber,
    drawCursor,
    drawRemainingLives,
    drawXpBar,
    drawTimer,
    drawUpgradeButton,
    drawMessage,
    multiLineFillText,
}
