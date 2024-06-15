import { Ship } from "./Ship"

import {
    INVINCIBILITY_TIME,
    LASER_RANGE,
    LASER_SHOOTING_RATE,
    MENU_UPGRADE_WIDTH,
    SHIP_ACCELERATION,
    SHIP_MAX_SPEED,
} from "./Constants"
import { Coordinates } from "./Vector"
import { checkClickZone, menuBoxesPosition } from "./Menu"

type UpgradeId =
    | "invincibilityTime"
    | "laserRate"
    | "laserRange"
    | "maxSpeed"
    | "acceleration"

interface Upgrade {
    id: UpgradeId
    name: string
    description: string
    baseValue: number
    stepUpgrade: number
    currentUpgrade: number
    maxUpgrade: number
}

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
            maxUpgrade: 15,
        },
        {
            id: "laserRange",
            name: "Laser range",
            description:
                "Determine the distance a laser can cover before vanishing",
            baseValue: LASER_RANGE,
            stepUpgrade: 20,
            currentUpgrade: 0,
            maxUpgrade: 30,
        },
        {
            id: "laserRate",
            name: "Laser rate",
            description: "The rate at which lasers are shot",
            baseValue: LASER_SHOOTING_RATE,
            stepUpgrade: 1,
            currentUpgrade: 0,
            maxUpgrade: 26,
        },
        {
            id: "maxSpeed",
            name: "Ship max speed",
            description: "The max speed the ship can reach",
            baseValue: SHIP_MAX_SPEED,
            stepUpgrade: 0.2,
            currentUpgrade: 0,
            maxUpgrade: 15,
        },
        {
            id: "acceleration",
            name: "Ship Accelaration",
            description: "Time for the ship to gain speed",
            baseValue: SHIP_ACCELERATION,
            stepUpgrade: 0.2,
            currentUpgrade: 0,
            maxUpgrade: 15,
        },
    ]
    return upgradeList
}

const handleUpgradeClick = (
    clickCoordinates: Coordinates,
    player: Ship,
    toggleMenu: () => void
) => {
    let clickedIndex = -1
    menuBoxesPosition.forEach((boxPosition, index) => {
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
    // need to develop a whole set of string rendering functions later
    const { name, description, currentUpgrade, maxUpgrade } = upgrade
    const { x, y } = coordinates
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
    handleUpgrade,
    getUpgradeChoice,
    initUpgrades,
    handleUpgradeClick,
    renderUpgradeToString,
}
