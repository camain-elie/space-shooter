import { Button } from "./Button"
import {
    CANVAS_HEIGHT,
    CANVAS_SIDE_MARGIN,
    INVINCIBILITY_TIME,
    JAUGE_COLOR,
    LASER_RANGE,
    LASER_SHOOTING_RATE,
    SHIP_ACCELERATION,
    SHIP_MAX_SPEED,
    UPGRADE_BUTTON_WIDTH,
    UPGRADE_JAUGE_HEIGHT,
    UPGRADE_JAUGE_LENGTH,
} from "./Constants"
import { Ship } from "./Ship"
import { drawUpgradeButton } from "./UI"
import { Upgrade, UpgradeId } from "./Upgrade"

const upgradeList = [
    {
        id: "invincibilityTime" as UpgradeId,
        name: "Invincibility time",
        description:
            "Determine the delay before the ship can get hit again after getting hit or beginning a new wave",
        baseValue: INVINCIBILITY_TIME,
        stepUpgrade: 0.2,
        currentUpgrade: 0,
        maxUpgrade: 15,
    },
    {
        id: "laserRange" as UpgradeId,
        name: "Laser range",
        description:
            "Determine the distance a laser can cover before vanishing",
        baseValue: LASER_RANGE,
        stepUpgrade: 20,
        currentUpgrade: 0,
        maxUpgrade: 30,
    },
    {
        id: "laserRate" as UpgradeId,
        name: "Laser rate",
        description: "The rate at which lasers are shot",
        baseValue: LASER_SHOOTING_RATE,
        stepUpgrade: 1,
        currentUpgrade: 0,
        maxUpgrade: 26,
    },
    {
        id: "maxSpeed" as UpgradeId,
        name: "Ship max speed",
        description: "The max speed the ship can reach",
        baseValue: SHIP_MAX_SPEED,
        stepUpgrade: 0.2,
        currentUpgrade: 0,
        maxUpgrade: 15,
    },
    {
        id: "acceleration" as UpgradeId,
        name: "Ship Accelaration",
        description: "Time for the ship to gain speed",
        baseValue: SHIP_ACCELERATION,
        stepUpgrade: 0.2,
        currentUpgrade: 0,
        maxUpgrade: 15,
    },
]

class UpgradeSystem {
    private upgradeArray: Upgrade[]
    private availableUpgrades: number

    constructor() {
        this.upgradeArray = []
        upgradeList.forEach((upgrade, index) => {
            const {
                id,
                name,
                description,
                baseValue,
                stepUpgrade,
                currentUpgrade,
                maxUpgrade,
            } = upgrade
            this.upgradeArray.push(
                new Upgrade(
                    id,
                    name,
                    description,
                    baseValue,
                    stepUpgrade,
                    currentUpgrade,
                    maxUpgrade,
                    CANVAS_HEIGHT -
                        CANVAS_SIDE_MARGIN -
                        (index + 1) * UPGRADE_JAUGE_HEIGHT -
                        index * 25
                )
            )
        })
        this.availableUpgrades = 0
    }

    getNumberOfTotalUpgrades() {
        return this.upgradeArray.reduce(
            (acc, upgrade) => acc + upgrade.maxUpgrade,
            0
        )
    }

    getUpgradeButtons(context: CanvasRenderingContext2D, player: Ship) {
        const buttonArray: Button[] = []
        this.upgradeArray.forEach((upgrade, index) => {
            const x = CANVAS_SIDE_MARGIN + UPGRADE_JAUGE_LENGTH,
                y =
                    CANVAS_HEIGHT -
                    CANVAS_SIDE_MARGIN -
                    (index + 1) * UPGRADE_JAUGE_HEIGHT -
                    index * 25
            buttonArray.push(
                new Button(
                    { x, y },
                    UPGRADE_BUTTON_WIDTH,
                    UPGRADE_JAUGE_HEIGHT,
                    () => {
                        upgrade.levelUp(player)
                    },
                    () => drawUpgradeButton(context, upgrade)
                )
            )
        })
        return buttonArray
    }

    getAvailableUpgrades() {
        return this.availableUpgrades
    }

    increaseAvailableUpgrades() {
        this.availableUpgrades++
    }

    decreaseAvailableUpgrade() {
        this.availableUpgrades--
    }

    draw(context: CanvasRenderingContext2D) {
        if (this.availableUpgrades) {
            let y = 0
            this.upgradeArray.forEach((upgrade, index) => {
                y =
                    CANVAS_HEIGHT -
                    CANVAS_SIDE_MARGIN -
                    (index + 1) * UPGRADE_JAUGE_HEIGHT -
                    index * 25
                context.fillStyle = JAUGE_COLOR
                upgrade.draw(context)
                context.fillText(upgrade.name, CANVAS_SIDE_MARGIN, y - 5)
            })
            y -= 30

            context.fillStyle = "white"
            context.fillText(
                `${this.availableUpgrades} upgrade${
                    this.availableUpgrades > 1 ? "s" : ""
                } available`,
                CANVAS_SIDE_MARGIN,
                y
            )
        }
    }
}

export { UpgradeSystem }
