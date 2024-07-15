type HardwareId =
    | "leftWingLaser"
    | "rightWingLaser"
    | "shieldGenerator"
    | "delayedBomb"

class Hardware {
    id: HardwareId
    name: string

    constructor(id: HardwareId, name: string) {
        this.id = id
        this.name = name
    }
}

export { HardwareId, Hardware }
