import { Asteroid, AsteroidType } from "./Asteroid"
import { Coordinates } from "./Vector"
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants/canvas"

class AsteroidBelt {
    belt: Asteroid[]

    constructor() {
        this.belt = []
    }

    update() {
        this.belt.forEach((asteroid, index) => {
            asteroid.update()
            if (asteroid.isGigaAsteroid() && !asteroid.isOnCanvas())
                this.belt.splice(index, 1)
        })
    }

    destroyAsteroid(
        index: number,
        handleParticules: (coordinates: Coordinates) => void
    ) {
        const { coordinates, type } = this.belt[index]
        handleParticules(coordinates)

        this.belt.splice(index, 1)
        if (type === 4) {
            for (let i = 0; i < 4; i++) {
                this.belt.push(
                    new Asteroid(coordinates, (type - 1) as AsteroidType)
                )
            }
        } else if (type !== 1) {
            for (let i = 0; i < 5 - type; i++) {
                this.belt.push(
                    new Asteroid(coordinates, (type - 1) as AsteroidType)
                )
            }
        }
    }

    draw(context: CanvasRenderingContext2D) {
        this.belt.forEach((asteroid) => {
            asteroid.draw(context)
        })
    }

    getNumber() {
        return this.belt.length
    }

    getBelt() {
        return this.belt
    }

    init(wave: number) {
        for (let i = 0; i < wave; i++)
            this.belt.push(
                new Asteroid(
                    {
                        x: Math.random() * CANVAS_WIDTH,
                        y: Math.random() * CANVAS_HEIGHT,
                    },
                    3
                )
            )
        if (wave % 3 === 0) this.belt.push(new Asteroid({ x: 0, y: 0 }, 4))
    }

    reset() {
        this.belt.length = 0
    }
}

export { AsteroidBelt }
