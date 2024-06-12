import {
    CANVAS_WIDTH,
    MENU_UPGRADE_WIDTH,
    MENU_UPGRADE_MARGIN,
    CANVAS_HEIGHT,
} from "./Constants"
import { Coordinates } from "./Vector"

const menuBoxesPosition = [
    {
        x:
            CANVAS_WIDTH / 2 -
            (MENU_UPGRADE_WIDTH + MENU_UPGRADE_WIDTH / 2 + MENU_UPGRADE_MARGIN),
        y: CANVAS_HEIGHT / 2 - MENU_UPGRADE_WIDTH / 2,
    },
    {
        x: CANVAS_WIDTH / 2 - MENU_UPGRADE_WIDTH / 2,
        y: CANVAS_HEIGHT / 2 - MENU_UPGRADE_WIDTH / 2,
    },
    {
        x: CANVAS_WIDTH / 2 + MENU_UPGRADE_WIDTH / 2 + MENU_UPGRADE_MARGIN,
        y: CANVAS_HEIGHT / 2 - MENU_UPGRADE_WIDTH / 2,
    },
]

const checkClickZone = (
    zone: Coordinates,
    click: Coordinates,
    size: number
) => {
    const { x: zoneX, y: zoneY } = zone
    const { x: clickX, y: clickY } = click
    const isInXZone = clickX > zoneX && clickX < zoneX + size
    const isInYZone = clickY > zoneY && clickY < zoneY + size
    return isInXZone && isInYZone
}

const renderMenu = (
    context: CanvasRenderingContext2D,
    titleRenderer: () => void,
    numberOfChoice: number
) => {
    titleRenderer()
    for (let i = 0; i < numberOfChoice; i++) {
        const { x, y } = menuBoxesPosition[i]
        context.beginPath()
        context.rect(x, y, MENU_UPGRADE_WIDTH, MENU_UPGRADE_WIDTH)
        context.stroke()
        context.clearRect(x, y, MENU_UPGRADE_WIDTH, MENU_UPGRADE_WIDTH)
    }
}

export { menuBoxesPosition, checkClickZone, renderMenu }
