import { CircularParticule, LinearParticule } from "./Particules"
import { Coordinates, getDistance, getRandomVector } from "./Vector"
import {
    PARTICULE_MAX_RANGE,
    PARTICULE_MAX_SPEED,
    PARTICULE_MIN_SPEED,
} from "./constants/game"

type ParticuleType = "linear" | "circular"

class ParticuleCollection {
    collection: (LinearParticule | CircularParticule)[] = []

    addParticule(particule: LinearParticule | CircularParticule) {
        this.collection.push(particule)
    }

    addRandomParticules(
        number: number,
        type: ParticuleType,
        position: Coordinates,
        maxSize: number,
        maxOpacity = 1
    ) {
        for (let i = 0; i < number; i++) {
            const directionVector = getRandomVector(),
                range = Math.random() * PARTICULE_MAX_RANGE,
                speed =
                    Math.random() *
                        (PARTICULE_MAX_SPEED - PARTICULE_MIN_SPEED) +
                    PARTICULE_MIN_SPEED,
                size = type === "linear" ? maxSize : Math.random() * 2 + 2,
                opacity = Math.random() * maxOpacity

            this.collection.push(
                type === "linear"
                    ? new LinearParticule(
                          position,
                          directionVector,
                          range,
                          speed,
                          size
                      )
                    : new CircularParticule(
                          position,
                          directionVector,
                          range,
                          speed,
                          size,
                          opacity
                      )
            )
        }
    }

    update() {
        this.collection.forEach((particule) => particule.update())
        this.removeOutdatedParticules()
    }

    removeOutdatedParticules() {
        this.collection.forEach((particule, index) => {
            if (
                getDistance(particule.createdPosition, particule.position) >
                particule.range
            )
                this.collection.splice(index, 1)
        })
    }

    reset() {
        this.collection = []
    }

    draw(context: CanvasRenderingContext2D) {
        this.collection.forEach((particule) => particule.draw(context))
    }
}

export { ParticuleCollection }
