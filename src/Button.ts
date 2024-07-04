import { Coordinates } from "./Vector"

class Button {
    position: Coordinates
    width: number
    height: number
    onClick: () => void
    draw: (context: CanvasRenderingContext2D) => void

    constructor(
        position: Coordinates,
        width: number,
        height: number,
        onClick: () => void,
        draw: (context: CanvasRenderingContext2D) => void
    ) {
        this.position = position
        this.width = width
        this.height = height
        this.onClick = onClick
        this.draw = draw
    }

    checkOnClick(clickPosition: Coordinates) {
        if (
            this.checkClickZone(
                this.position,
                clickPosition,
                this.width,
                this.height
            )
        ) {
            this.onClick()
            return true
        }
        return false
    }

    checkClickZone(
        zone: Coordinates,
        click: Coordinates,
        width: number,
        height: number
    ) {
        const { x: zoneX, y: zoneY } = zone
        const { x: clickX, y: clickY } = click
        const isInXZone = clickX > zoneX && clickX < zoneX + width
        const isInYZone = clickY > zoneY && clickY < zoneY + height
        return isInXZone && isInYZone
    }
}

export { Button }
