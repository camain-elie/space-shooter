import { Ship } from "./Ship"

type SpecialUpgradeId = "leftWingLaser" | "rightWingLaser"

interface SpecialUpgrade {
    id: SpecialUpgradeId
    name: string
    description: string
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

export { SpecialUpgrade, handleSecondaryLasers }
