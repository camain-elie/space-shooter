import { Button } from "./Button"
import {
    BOX_BOTTOM_POSITIONS,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    LASER_SHOT_LENGTH,
    LASER_SHOT_SPEED,
    MENU_UPGRADE_MARGIN,
    MENU_UPGRADE_WIDTH,
} from "./Constants"
import { Hardware, HardwareId } from "./Hardware"
import { LinearParticule } from "./Particules"
import { Ship } from "./Ship"
import { Coordinates } from "./Vector"

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
                CANVAS_HEIGHT - MENU_UPGRADE_MARGIN - MENU_UPGRADE_WIDTH - 10
            )
        }
    }

    generateChoice() {
        if (this.remainingUpgrades.length <= 3)
            this.hardwareChoice = [...this.remainingUpgrades]
    }

    getHardwareButtons(context: CanvasRenderingContext2D) {
        this.generateChoice()
        const buttons: Button[] = []
        this.remainingUpgrades.forEach((hardware, index) => {
            const { x, y } = BOX_BOTTOM_POSITIONS[index]
            buttons.push(
                new Button(
                    { x, y },
                    MENU_UPGRADE_WIDTH,
                    MENU_UPGRADE_WIDTH,
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
        context.clearRect(x, y, MENU_UPGRADE_WIDTH, MENU_UPGRADE_WIDTH)
        context.strokeRect(x, y, MENU_UPGRADE_WIDTH, MENU_UPGRADE_WIDTH)
        context.textAlign = "center"
        context.fillText(
            hardware.name,
            x + MENU_UPGRADE_WIDTH / 2,
            y + MENU_UPGRADE_WIDTH + 20,
            MENU_UPGRADE_WIDTH
        )
    }

    handleSecondaryLasers(player: Ship) {
        if (this.hasHardware("leftWingLaser")) this.createLeftWingLaser(player)
        if (this.hasHardware("rightWingLaser"))
            this.createRightWingLaser(player)
    }

    createLeftWingLaser(player: Ship) {
        const laserDirectionRatio = player.laserRange / player.distanceToCursor
        player.lasers.addParticule(
            new LinearParticule(
                { ...player.leftLaser },
                {
                    x:
                        (player.directionVector.x - player.leftLaser.x) *
                        laserDirectionRatio,
                    y:
                        (player.directionVector.y - player.leftLaser.y) *
                        laserDirectionRatio,
                },
                player.laserRange,
                LASER_SHOT_SPEED,
                LASER_SHOT_LENGTH
            )
        )
    }

    createRightWingLaser(player: Ship) {
        const laserDirectionRatio = player.laserRange / player.distanceToCursor
        player.lasers.addParticule(
            new LinearParticule(
                { ...player.rightLaser },
                {
                    x:
                        (player.directionVector.x - player.rightLaser.x) *
                        laserDirectionRatio,
                    y:
                        (player.directionVector.y - player.rightLaser.y) *
                        laserDirectionRatio,
                },
                player.laserRange,
                LASER_SHOT_SPEED,
                LASER_SHOT_LENGTH
            )
        )
    }
}

export { HardwareSystem }