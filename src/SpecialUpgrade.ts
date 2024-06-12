import { MENU_UPGRADE_WIDTH } from "./Constants"
import { checkClickZone, menuBoxesPosition } from "./Menu"
import { Ship } from "./Ship"
import { Coordinates } from "./Vector"

type SpecialUpgradeId = "leftWingLaser" | "rightWingLaser"

interface SpecialUpgrade {
    id: SpecialUpgradeId
    name: string
    description: string
}

const specialUpgradeList: SpecialUpgrade[] = [
    {
        id: "leftWingLaser",
        name: "Additional left wing laser",
        description:
            "Add an additional laser on the left wing. The laser has the same rate and range as the main laser.",
    },
    {
        id: "rightWingLaser",
        name: "Additional right wing laser",
        description:
            "Add an additional laser on the right wing. The laser has the same rate and range as the main laser.",
    },
]

const handleSpecialUpgrade = (upgrade: SpecialUpgrade, ship: Ship) => {
    ship.specialUpgrade.push(upgrade)
}

const getSpecialUpgradesChoice = (player: Ship) => {
    let availableSpecialUpgrades = [...specialUpgradeList]
    player.specialUpgrade.forEach(
        (specialUpgrade) =>
            (availableSpecialUpgrades = availableSpecialUpgrades.filter(
                (option) => option.id !== specialUpgrade.id
            ))
    )
    return availableSpecialUpgrades
}

const handleSpecialUpgradeClick = (
    clickCoordinates: Coordinates,
    player: Ship,
    toggleMenu: () => void
) => {
    let clickedIndex = -1
    menuBoxesPosition.forEach((boxPosition, index) => {
        if (checkClickZone(boxPosition, clickCoordinates, MENU_UPGRADE_WIDTH))
            clickedIndex = index
    })
    if (player.specialUpgradeChoice[clickedIndex]) {
        handleSpecialUpgrade(player.specialUpgradeChoice[clickedIndex], player)
        toggleMenu()
    }
}

const renderSpecialUpgrade = (
    specialUpgrade: SpecialUpgrade,
    coordinates: Coordinates,
    color: string,
    context: CanvasRenderingContext2D
) => {
    const { name, description } = specialUpgrade
    const { x, y } = coordinates
    context.textAlign = "left"
    context.fillStyle = color
    context.fillText(name, x + 10, y + 30, MENU_UPGRADE_WIDTH - 20)
    context.fillText(description, x + 10, y + 60, MENU_UPGRADE_WIDTH - 20)
}

const handleSecondaryLasers = (player: Ship) => {
    if (
        player.specialUpgrade.filter(
            (special) => special.id === "leftWingLaser"
        ).length
    )
        createLeftWingLaser(player)
    if (
        player.specialUpgrade.filter(
            (special) => special.id === "rightWingLaser"
        ).length
    )
        createRightWingLaser(player)
}

const createLeftWingLaser = (player: Ship) => {
    const laserDirectionRatio = player.laserRange / player.distanceToCursor
    player.lasers.push({
        position: { ...player.leftWing },
        directionVector: {
            x:
                (player.directionVector.x - player.leftWing.x) *
                laserDirectionRatio,
            y:
                (player.directionVector.y - player.leftWing.y) *
                laserDirectionRatio,
        },
        createdPosition: { ...player.leftWing },
    })
}

const createRightWingLaser = (player: Ship) => {
    const laserDirectionRatio = player.laserRange / player.distanceToCursor
    player.lasers.push({
        position: { ...player.rightWing },
        directionVector: {
            x:
                (player.directionVector.x - player.rightWing.x) *
                laserDirectionRatio,
            y:
                (player.directionVector.y - player.rightWing.y) *
                laserDirectionRatio,
        },
        createdPosition: { ...player.rightWing },
    })
}

export {
    SpecialUpgrade,
    handleSpecialUpgradeClick,
    getSpecialUpgradesChoice,
    renderSpecialUpgrade,
    handleSecondaryLasers,
}
