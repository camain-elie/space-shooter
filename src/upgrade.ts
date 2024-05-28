import { Ship } from "./Ship"

import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    INVINCIBILITY_TIME,
    LASER_RANGE,
    LASER_SHOOTING_RATE,
    MENU_UPGRADE_MARGIN,
    MENU_UPGRADE_WIDTH,
} from "./Game"
import { Coordinates } from "./Vector"

type UpgradeId = "invincibilityTime" | "laserRate" | "laserRange"

interface Upgrade {
    id: UpgradeId
    name: string
    description: string
    baseValue: number
    stepUpgrade: number
    currentUpgrade: number
    maxUpgrade: number
}

const upgradeBoxesPosition = [
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

const handleUpgrade = (upgrade: Upgrade, ship: Ship) => {
    const { id, stepUpgrade, currentUpgrade, maxUpgrade } = upgrade
    if (currentUpgrade < maxUpgrade) {
        ship[id] += stepUpgrade
        upgrade.currentUpgrade++
    }
}

const getUpgradeChoice = (ship: Ship) => {
    const availableUpgrades = ship.upgrades.filter(
        (upgrade) => upgrade.currentUpgrade < upgrade.maxUpgrade
    )
    const randomAvailableUpgrades: Upgrade[] = []

    for (let i = 0; i < 3; i++) {
        if (availableUpgrades.length) {
            const randomIndex = Math.floor(
                Math.random() * availableUpgrades.length
            )
            randomAvailableUpgrades.push(availableUpgrades[randomIndex])
            availableUpgrades.splice(randomIndex, 1)
        }
    }

    return randomAvailableUpgrades
}

const initUpgrades = () => {
    const upgradeList: Upgrade[] = [
        {
            id: "invincibilityTime",
            name: "Invincibility time",
            description:
                "Determine the delay before the ship can get hit again after getting hit or beginning a new wave",
            baseValue: INVINCIBILITY_TIME,
            stepUpgrade: 0.2,
            currentUpgrade: 0,
            // maxUpgrade: 3,
            maxUpgrade: 10,
        },
        {
            id: "laserRange",
            name: "Laser range",
            description:
                "Determine the distance a laser can cover before vanishing",
            baseValue: LASER_RANGE,
            stepUpgrade: 20,
            currentUpgrade: 0,
            maxUpgrade: 20,
            // maxUpgrade: 3,
        },
        {
            id: "laserRate",
            name: "Laser rate",
            description: "The rate at which lasers are shot",
            baseValue: LASER_SHOOTING_RATE,
            stepUpgrade: 1,
            currentUpgrade: 0,
            maxUpgrade: 26,
            // maxUpgrade: 3,
        },
    ]
    return upgradeList
}

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

const handleUpgradeClick = (
    clickCoordinates: Coordinates,
    player: Ship,
    toggleMenu: () => void
) => {
    let clickedIndex = -1
    upgradeBoxesPosition.forEach((boxPosition, index) => {
        if (checkClickZone(boxPosition, clickCoordinates, MENU_UPGRADE_WIDTH))
            clickedIndex = index
    })
    if (player.upgradeChoice[clickedIndex]) {
        handleUpgrade(player.upgradeChoice[clickedIndex], player)
        toggleMenu()
    }
}

const renderUpgradeToString = (
    upgrade: Upgrade,
    coordinates: Coordinates,
    color: string,
    context: CanvasRenderingContext2D
) => {
    const lineHeight = 15
    const { id, name, description, currentUpgrade, maxUpgrade } = upgrade
    const { x, y } = coordinates
    console.log(name)
    // context.font = "16px sans-serif"
    context.textAlign = "left"
    context.fillStyle = color
    context.fillText(name, x + 10, y + 30, MENU_UPGRADE_WIDTH - 20)
    context.fillText(description, x + 10, y + 60, MENU_UPGRADE_WIDTH - 20)
    context.fillText(
        `Current upgrade level : ${currentUpgrade}`,
        x + 10,
        y + 90,
        MENU_UPGRADE_WIDTH - 20
    )
    context.fillText(
        `Max level : ${maxUpgrade}`,
        x + 10,
        y + 120,
        MENU_UPGRADE_WIDTH - 20
    )
}

export {
    Upgrade,
    upgradeBoxesPosition,
    handleUpgrade,
    getUpgradeChoice,
    initUpgrades,
    handleUpgradeClick,
    renderUpgradeToString,
}
