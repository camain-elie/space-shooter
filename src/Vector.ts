interface Coordinates {
    x: number
    y: number
}

const getDistance = (a: Coordinates, b: Coordinates) => {
    const xDiff = a.x - b.x,
        yDiff = a.y - b.y
    return Math.hypot(xDiff, yDiff)
}

const inverseVector = (vector: Coordinates) => {
    return { x: -vector.x, y: -vector.y }
}

const changeVectorLength = (vector: Coordinates, length: number) => {
    const vectorLength = getDistance({ x: 0, y: 0 }, vector)
    const vectorLengthRatio = length / vectorLength
    return { x: vector.x * vectorLengthRatio, y: vector.y * vectorLengthRatio }
}

const getPerpendicularVector = (vector: Coordinates) => ({
    x: vector.y,
    y: -vector.x,
})

const getRandomVector = () => ({
    x: Math.random() * (20 + 20) - 20,
    y: Math.random() * (20 + 20) - 20,
})

export {
    Coordinates,
    getDistance,
    inverseVector,
    changeVectorLength,
    getPerpendicularVector,
    getRandomVector,
}
