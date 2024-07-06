type HardwareId = "leftWingLaser" | "rightWingLaser" | "shieldGenerator"

class Hardware {
    id: HardwareId
    name: string

    constructor(id: HardwareId, name: string) {
        this.id = id
        this.name = name
    }
}

export { HardwareId, Hardware }
