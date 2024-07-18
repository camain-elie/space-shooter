import { Button } from "./Button"

import { Hardware, HardwareId } from "./Hardware"
import { LinearParticule } from "./Particules"
import { Ship } from "./Ship"
import { Coordinates } from "./Vector"
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    BOX_BOTTOM_POSITIONS,
    HARDWARE_BUTTON_MARGIN,
    HARDWARE_BUTTON_WIDTH,
} from "./constants/canvas"

const hardwareList = [
    {
        id: "leftWingLaser" as HardwareId,
        name: "Left wing laser",
    },
    {
        id: "rightWingLaser" as HardwareId,
        name: "Right wing laser",
    },
    {
        id: "shieldGenerator" as HardwareId,
        name: "Shield generator",
    },
    {
        id: "delayedBomb" as HardwareId,
        name: "Delayed bomb",
    },
]

class HardwareSystem {
    private hardwareArray: Hardware[]
    private hardwareChoice: Hardware[]
    private remainingUpgrades: Hardware[]
    private availableUpgrades: number

    constructor() {
        this.hardwareArray = []
        this.hardwareChoice = []
        this.hardwareChoice = []
        this.remainingUpgrades = []
        hardwareList.forEach((hardware) =>
            this.remainingUpgrades.push(
                new Hardware(hardware.id, hardware.name)
            )
        )
        this.availableUpgrades = 0
    }

    getAvailableUpgrades() {
        return this.availableUpgrades
    }

    isRemainingUpgrade() {
        return (
            hardwareList.length - this.hardwareArray.length >
            this.availableUpgrades
        )
    }

    increaseAvailableUpgrades() {
        this.availableUpgrades++
    }

    decreaseAvailableUpgrades() {
        if (this.availableUpgrades > 0) this.availableUpgrades--
    }

    addHardware(hardwareId: HardwareId) {
        const hardware = hardwareList.filter(
            (harware) => harware.id === hardwareId
        )[0]
        const { id, name } = hardware
        this.hardwareArray.push(new Hardware(id, name))
        this.remainingUpgrades = this.remainingUpgrades.filter(
            (hardware) => hardware.id !== hardwareId
        )
    }

    hasHardware(hardwareId: HardwareId) {
        return !!this.hardwareArray.filter(
            (hardware) => hardware.id === hardwareId
        )[0]
    }

    draw(context: CanvasRenderingContext2D) {
        if (this.availableUpgrades > 0) {
            context.textAlign = "center"
            context.fillText(
                `${this.availableUpgrades} upgrade${
                    this.availableUpgrades > 1 ? "s" : ""
                } available`,
                CANVAS_WIDTH / 2,
                CANVAS_HEIGHT -
                    HARDWARE_BUTTON_MARGIN -
                    HARDWARE_BUTTON_WIDTH -
                    10
            )
        }
    }

    generateChoice() {
        this.hardwareChoice = []
        const availableHardware = [...this.remainingUpgrades]
        for (let i = 0; i < 3; i++) {
            if (availableHardware.length) {
                const randomIndex = Math.floor(
                    Math.random() * availableHardware.length
                )
                this.hardwareChoice.push(availableHardware[randomIndex])
                availableHardware.splice(randomIndex, 1)
            }
        }
    }

    getHardwareButtons(context: CanvasRenderingContext2D) {
        this.generateChoice()
        const buttons: Button[] = []
        this.hardwareChoice.forEach((hardware, index) => {
            const { x, y } = BOX_BOTTOM_POSITIONS[index]
            buttons.push(
                new Button(
                    { x, y },
                    HARDWARE_BUTTON_WIDTH,
                    HARDWARE_BUTTON_WIDTH,
                    () => {
                        this.decreaseAvailableUpgrades()
                        this.addHardware(hardware.id)
                        this.generateChoice()
                    },
                    () => this.drawHardwareChoice(context, hardware, { x, y })
                )
            )
        })
        return buttons
    }

    drawHardwareChoice(
        context: CanvasRenderingContext2D,
        hardware: Hardware,
        position: Coordinates
    ) {
        const { x, y } = position
        context.clearRect(x, y, HARDWARE_BUTTON_WIDTH, HARDWARE_BUTTON_WIDTH)
        context.strokeRect(x, y, HARDWARE_BUTTON_WIDTH, HARDWARE_BUTTON_WIDTH)
        context.textAlign = "center"
        context.fillText(
            hardware.name,
            x + HARDWARE_BUTTON_WIDTH / 2,
            y + HARDWARE_BUTTON_WIDTH + 20,
            HARDWARE_BUTTON_WIDTH
        )
    }
}

export { hardwareList, HardwareSystem }
