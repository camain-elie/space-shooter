import { Ship } from "./Ship"

import {
    INVINCIBILITY_TIME,
    LASER_RANGE,
    LASER_SHOOTING_RATE,
} from "./constants"

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

const upgrade = (upgrade: Upgrade, ship: Ship) => {
    const { id, stepUpgrade, currentUpgrade, maxUpgrade } = upgrade
    if (currentUpgrade < maxUpgrade) ship[id] += stepUpgrade
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
            maxUpgrade: 10,
        },
        {
            id: "laserRange",
            name: "Laser range",
            description:
                "Determine the distance a laser can cover before vanishing",
            baseValue: LASER_RANGE,
            stepUpgrade: 20,
            currentUpgrade: 1,
            maxUpgrade: 20,
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
    ]
    return upgradeList
}
