import { ASTEROID_PARTICULE_LENGTH } from "./Constants"
import { ParticuleCollection } from "./ParticuleCollection"
import { Coordinates } from "./Vector"

const createExplosion = (
    circularSystem: ParticuleCollection,
    position: Coordinates,
    linearSystem?: ParticuleCollection
) => {
    createDamageParticules(
        linearSystem ? linearSystem : circularSystem,
        position
    )
    circularSystem.addRandomParticules(30, "circular", position, 2, 0.8)
}

const createDamageParticules = (
    particuleCollection: ParticuleCollection,
    position: Coordinates,
    number = 10
) => {
    particuleCollection.addRandomParticules(
        number,
        "linear",
        position,
        ASTEROID_PARTICULE_LENGTH
    )
}

export { createExplosion, createDamageParticules }
