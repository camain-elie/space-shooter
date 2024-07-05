import { Ship } from "./Ship"

import {
    CANVAS_SIDE_MARGIN,
    UPGRADE_JAUGE_HEIGHT,
    UPGRADE_JAUGE_LENGTH,
} from "./Constants"

type UpgradeId =
    | "invincibilityTime"
    | "laserRate"
    | "laserRange"
    | "maxSpeed"
    | "acceleration"

class Upgrade {
    id: UpgradeId
    name: string
    description: string
    baseValue: number
    stepUpgrade: number
    currentUpgrade: number
    maxUpgrade: number
    yPosition: number

    constructor(
        id: UpgradeId,
        name: string,
        description: string,
        baseValue: number,
        stepUpgrade: number,
        currentUpgrade: number,
        maxUpgrade: number,
        yPosition: number
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.baseValue = baseValue
        this.stepUpgrade = stepUpgrade
        this.currentUpgrade = currentUpgrade
        this.maxUpgrade = maxUpgrade
        this.yPosition = yPosition
    }

    levelUp(player: Ship) {
        if (
            this.maxUpgrade > this.currentUpgrade &&
            player.upgrades.getAvailableUpgrades() > 0
        ) {
            this.currentUpgrade++
            player[this.id] += this.stepUpgrade
            player.upgrades.decreaseAvailableUpgrade()
        }
    }

    draw(context: CanvasRenderingContext2D) {
        const upgradeWidth = UPGRADE_JAUGE_LENGTH / this.maxUpgrade

        for (let i = 0; i < this.maxUpgrade; i++) {
            const x = CANVAS_SIDE_MARGIN + i * upgradeWidth

            if (i === 0) {
                context.beginPath()
                context.roundRect(
                    x,
                    this.yPosition,
                    upgradeWidth,
                    UPGRADE_JAUGE_HEIGHT,
                    [5, 0, 0, 5]
                )
                context.stroke()
                if (this.currentUpgrade > i) context.fill()
                context.closePath()
            } else {
                if (this.currentUpgrade > i)
                    context.fillRect(
                        x,
                        this.yPosition,
                        upgradeWidth,
                        UPGRADE_JAUGE_HEIGHT
                    )

                context.strokeRect(
                    x,
                    this.yPosition,
                    upgradeWidth,
                    UPGRADE_JAUGE_HEIGHT
                )
            }
        }
    }
}

export { Upgrade, UpgradeId }
