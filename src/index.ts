import { Ship, initShip } from "./Ship"
import {
    Coordinates,
    changeVectorLength,
    getDistance,
    getPerpendicularVector,
    inverseVector,
} from "./Vector"
import { AsteroidParticule, ExplosionParticule } from "./Particules"
import {
    initUpgrades,
    handleUpgradeClick,
    getUpgradeChoice,
    renderUpgradeToString,
} from "./Upgrade"

import {
    INVINCIBILITY_TIME,
    LASER_SHOOTING_RATE,
    LASER_RANGE,
    SHIP_MAX_SPEED,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    SHIP_ACCELERATION,
    SHIP_LENGTH,
    SHIP_WIDTH,
    NUMBER_OF_LIVES,
    ASTEROID_PARTICULE_LENGTH,
    ASTEROID_PARTICULE_MAX_RANGE,
    ASTEROID_PARTICULE_MAX_SPEED,
    ASTEROID_PARTICULE_MIN_SPEED,
    REFRESH_INTERVAL,
} from "./Constants"
import {
    Asteroid,
    createGigaAsteroid,
    destroyAsteroid,
    drawAsteroids,
    initAsteroids,
    moveAsteroids,
} from "./Asteroid"
import {
    getSpecialUpgradesChoice,
    handleSecondaryLasers,
    handleSpecialUpgradeClick,
    renderSpecialUpgrade,
} from "./SpecialUpgrade"
import { menuBoxesPosition, renderMenu } from "./Menu"

// Game constants
const NEW_GAME_DELAY = 2
const MENU_CHOICE_DELAY = 1
const XP_BAR_LENGTH = 300
const XP_BAR_HEIGHT = 10
const NEXT_LEVEL_XP = 30
// Laser constants
const LASER_SHOT_SPEED = 1000
const LASER_SHOT_LENGTH = 10

let currentInterval = 0
let wave = 1
let startGame = true
let endGame = false
let isPaused = false
let upgradeMenu = false
let menuDelay = 0
let newGameDelay = 0
let laserTicking = 0

// TODO
// Stop movement when mouse off canvas
// Improve deceleration
// Improve acceleration and top speed
// Look into TS ESLint commented rules
// Simplify the vector system with vx, vy
// Look into SAT theorem for better collision detection
// Look into https://stackoverflow.com/questions/17047378/finding-coordinates-after-canvas-rotation
// to avoid rotation and having to find coordinates

// Game set up
const gameCanvas =
    (document.getElementById("gameCanvas") as HTMLCanvasElement) ||
    document.createElement("canvas")
const context = gameCanvas.getContext("2d")

const player: Ship = initShip()

const cursorPosition: Coordinates = {
    ...player.coordinates,
}

const asteroids: Asteroid[] = []
const asteroidParticules: AsteroidParticule[] = []
const backgroundParticules: ExplosionParticule[] = []
const explosionParticules: ExplosionParticule[] = []

// PLAYER MOVEMENTS
gameCanvas.onmousemove = (ev: MouseEvent) => {
    const rect = gameCanvas.getBoundingClientRect()
    cursorPosition.x = ev.clientX - rect.left
    cursorPosition.y = ev.clientY - rect.top
}

gameCanvas.onclick = () => {
    if (startGame) startGame = false
    if (endGame && !newGameDelay) restartGame()
    if (upgradeMenu && menuDelay > MENU_CHOICE_DELAY * REFRESH_INTERVAL) {
        isUpgradeSpecial()
            ? handleSpecialUpgradeClick(
                  cursorPosition,
                  player,
                  turnOffUpgradeMenu
              )
            : handleUpgradeClick(cursorPosition, player, turnOffUpgradeMenu)
    }
}

gameCanvas.onmousedown = () => {
    player.firing = true
}

gameCanvas.onmouseup = () => {
    player.firing = false
    laserTicking = 0
}

window.onkeydown = (event: KeyboardEvent) => {
    if (event.key.toLocaleLowerCase() === "p" && !startGame && !endGame)
        isPaused = !isPaused
}

gameCanvas.oncontextmenu = (event: MouseEvent) => event.preventDefault()

const restartGame = () => {
    endGame = false
    wave = 0
    asteroids.length = 0

    player.level = 1
    player.xp = 0
    player.lasers.length = 0
    player.lives = NUMBER_OF_LIVES
    player.upgrades = initUpgrades()
    player.invincibilityTime = INVINCIBILITY_TIME
    player.laserRange = LASER_RANGE
    player.laserRate = LASER_SHOOTING_RATE
    player.maxSpeed = SHIP_MAX_SPEED
    player.acceleration = SHIP_ACCELERATION
}

const initWave = () => {
    if (currentInterval) wave++

    initAsteroids(asteroids, wave)
    if (wave % 3 === 0) createGigaAsteroid(asteroids)
    startPlayerInvincibility()
}

const startPlayerInvincibility = () =>
    (player.invincibilityLeft = Math.floor(
        player.invincibilityTime * REFRESH_INTERVAL
    ))

const getAcceleration = () => {
    const { distanceToCursor, speed, maxSpeed, acceleration } = player
    if (distanceToCursor <= 20 && speed) {
        player.speed = 0
    } else if (speed < maxSpeed && distanceToCursor > 50) {
        const newSpeed = speed + acceleration / REFRESH_INTERVAL
        player.speed = newSpeed > maxSpeed ? maxSpeed : newSpeed
    } else if (speed > 3 && player.distanceToCursor <= 50) {
        const newSpeed = player.speed - acceleration / REFRESH_INTERVAL
        player.speed = newSpeed < 0 ? 1 : newSpeed
    }
}

const updateShipPosition = () => {
    if (player.distanceToCursor) {
        const distancePercentage =
            (player.speed * 100) / player.distanceToCursor / REFRESH_INTERVAL

        const newVec = {
            x: cursorPosition.x - player.coordinates.x,
            y: cursorPosition.y - player.coordinates.y,
        }

        player.coordinates.x += newVec.x * distancePercentage
        player.coordinates.y += newVec.y * distancePercentage

        updateWingsPosition()
    }
}

const updateWingsPosition = () => {
    const { coordinates, relativeDirectionVector } = player
    const { x, y } = coordinates

    // first we find the base point
    const baseToNoseVector = changeVectorLength(
        relativeDirectionVector,
        SHIP_LENGTH
    )
    const inverseBaseToNoseVector = inverseVector(baseToNoseVector)
    const basePoint = {
        x: x + inverseBaseToNoseVector.x,
        y: y + inverseBaseToNoseVector.y,
    }

    // from the base point we find the wings positions
    const perpendicularVector = changeVectorLength(
        getPerpendicularVector(baseToNoseVector),
        SHIP_WIDTH / 2
    )
    const inversePerpendicularVector = inverseVector(perpendicularVector)

    player.leftWing = {
        x: basePoint.x + perpendicularVector.x,
        y: basePoint.y + perpendicularVector.y,
    }
    player.rightWing = {
        x: basePoint.x + inversePerpendicularVector.x,
        y: basePoint.y + inversePerpendicularVector.y,
    }
    player.basePoint = { ...basePoint }
}

const getShipOrientationVector = () => {
    const shipVector: Coordinates = { x: 10, y: 0 }
    const cursorVector: Coordinates = {
        x: cursorPosition.x - player.coordinates.x,
        y: cursorPosition.y - player.coordinates.y,
    }
    player.relativeDirectionVector = { ...cursorVector }
    player.directionVector = { ...cursorPosition }
    const scalarProduct =
        shipVector.x * cursorVector.x + shipVector.y * cursorVector.y
    const shipVectorNorm = Math.sqrt(
        Math.pow(shipVector.x, 2) + Math.pow(shipVector.y, 2)
    )
    const cursorVectorNorm = Math.sqrt(
        Math.pow(cursorVector.x, 2) + Math.pow(cursorVector.y, 2)
    )
    const cos = scalarProduct / (shipVectorNorm * cursorVectorNorm)
    const angle = Math.acos(cos)
    return cursorVector.y > 0 ? -angle : angle
}

const handleXp = (asteroid: Asteroid) => {
    const { type } = asteroid
    player.xp += type === 4 ? 50 : 4 - type

    if (player.xp > player.level * NEXT_LEVEL_XP) {
        player.xp = player.xp - player.level * NEXT_LEVEL_XP
        player.level++
        player.specialUpgradeChoice = getSpecialUpgradesChoice(player)
        player.upgradeChoice = getUpgradeChoice(player)
        if (isUpgradeSpecial()) upgradeMenu = true
        else if (player.upgradeChoice.length) upgradeMenu = true
    }
}

const isUpgradeSpecial = () =>
    player.level % 15 === 0 && player.specialUpgradeChoice.length

const turnOffUpgradeMenu = () => {
    upgradeMenu = false
    menuDelay = 0
}

// DRAW
const drawUIElements = () => {
    if (context) {
        const { x, y } = cursorPosition

        // draw the wave
        context.textAlign = "left"
        context.fillStyle = "white"
        context.font = "16px sans-serif"
        context.fillText(`Wave ${wave}`, 20, 25)

        // draw the number of remaining asteroids
        context.fillText(`Remaining : ${asteroids.length}`, 20, 45)

        // draw the cursor
        context.fillRect(x, y, 1, 1)
        context.fillRect(x, y - 10, 1, 5)
        context.fillRect(x + 6, y, 5, 1)
        context.fillRect(x, y + 6, 1, 5)
        context.fillRect(x - 10, y, 5, 1)

        // draw number of lives
        for (let i = 0; i < player.lives; i++)
            drawShipSprite(CANVAS_WIDTH - 2 * (i + 1) * SHIP_WIDTH, 15)

        // draw xp bar
        context.strokeRect(
            CANVAS_WIDTH / 2 - XP_BAR_LENGTH / 2,
            20,
            XP_BAR_LENGTH,
            XP_BAR_HEIGHT
        )
        const xpRatioLenght =
            (player.xp * XP_BAR_LENGTH) / (player.level * NEXT_LEVEL_XP)
        let xpFillLength =
            xpRatioLenght > XP_BAR_LENGTH ? XP_BAR_LENGTH : xpRatioLenght
        context.fillRect(
            CANVAS_WIDTH / 2 - XP_BAR_LENGTH / 2,
            20,
            xpFillLength,
            XP_BAR_HEIGHT
        )
        context.textAlign = "center"
        context.fillText(
            `level ${player.level}`,
            CANVAS_WIDTH / 2,
            40 + XP_BAR_HEIGHT
        )
    }
}

const drawShipSprite = (x: number, y: number) => {
    if (context) {
        context.beginPath()
        context.moveTo(x, y)
        context.lineTo(x + SHIP_WIDTH / 2, y + SHIP_LENGTH)
        context.lineTo(x - SHIP_WIDTH / 2, y + SHIP_LENGTH)
        context.lineTo(x, y)
        context.stroke()
    }
}

const handlePlayer = () => {
    if (context) {
        player.distanceToCursor = getDistance(
            cursorPosition,
            player.coordinates
        )
        getAcceleration()
        updateShipPosition()

        drawPlayer()
    }
}

const drawPlayer = () => {
    if (context) {
        const shipRotation = getShipOrientationVector()

        const { invincibilityLeft } = player
        if (invincibilityLeft) {
            context.strokeStyle = invincibilityLeft
                ? `rgba(255,255,255, ${(invincibilityLeft % 6) / 10})`
                : "white"
        } else if (!player.lives) context.strokeStyle = "red"
        context.translate(player.coordinates.x, player.coordinates.y)
        context.rotate(-shipRotation)

        context?.beginPath()

        context?.moveTo(-SHIP_LENGTH, -SHIP_WIDTH / 2)
        context?.lineTo(0, 0)
        context?.lineTo(-SHIP_LENGTH, SHIP_WIDTH / 2)
        context?.closePath()
        context?.stroke()

        context.rotate(shipRotation)
        context.translate(-player.coordinates.x, -player.coordinates.y)
        if (player.lives) context.strokeStyle = "white"
    }
}

const calculateParticulePosition = (
    particule: AsteroidParticule
): Coordinates => {
    const distancePerRender = particule.speed / REFRESH_INTERVAL
    const particuleVectorRatio =
        distancePerRender /
        getDistance({ x: 0, y: 0 }, particule.directionVector)
    return {
        x:
            particule.position.x +
            particule.directionVector.x * particuleVectorRatio,
        y:
            particule.position.y +
            particule.directionVector.y * particuleVectorRatio,
    }
}

const drawParticule = (particule: AsteroidParticule, length: number) => {
    const particuleVectorToLengthRatio =
        getDistance({ x: 0, y: 0 }, particule.directionVector) / length
    context?.beginPath()
    context?.moveTo(particule.position.x, particule.position.y)
    context?.lineTo(
        particule.position.x +
            particule.directionVector.x / particuleVectorToLengthRatio,
        particule.position.y +
            particule.directionVector.y / particuleVectorToLengthRatio
    )
    context?.closePath()
    context?.stroke()
}

const handleLasers = () => {
    calculateLasersPosition()
    createNewLaser()
    calculateLasersColision()
    drawLasers()
    deleteLasers()
}

const calculateLasersPosition = () => {
    player.lasers.forEach((laser) => {
        laser.position = calculateParticulePosition({
            ...laser,
            range: player.laserRange,
            speed: LASER_SHOT_SPEED,
        })
    })
}

const calculateLasersColision = () => {
    player.lasers.forEach((laser, laserIndex) => {
        asteroids.forEach((asteroid, asteroidIndex) => {
            if (
                getDistance(laser.position, asteroid.coordinates) <
                asteroid.size
            ) {
                player.lasers.splice(laserIndex, 1)
                if (asteroid.health > 1) {
                    asteroid.health--
                    createParticules(laser.position)
                } else {
                    handleXp(asteroid)
                    destroyAsteroid(
                        asteroids,
                        asteroid,
                        asteroidIndex,
                        createParticules
                    )
                }
            }
        })
    })
}

const createNewLaser = () => {
    const firingInterval = Math.floor(REFRESH_INTERVAL / player.laserRate)
    if (player.firing && laserTicking % firingInterval === 0) {
        const laserDirectionRatio = player.laserRange / player.distanceToCursor
        player.lasers.push({
            position: { ...player.coordinates },
            directionVector: {
                x:
                    (player.directionVector.x - player.coordinates.x) *
                    laserDirectionRatio,
                y:
                    (player.directionVector.y - player.coordinates.y) *
                    laserDirectionRatio,
            },
            createdPosition: { ...player.coordinates },
        })
        handleSecondaryLasers(player)
    }
}

const drawLasers = () => {
    player.lasers.forEach((laser) => {
        drawParticule(
            { ...laser, range: player.laserRange, speed: LASER_SHOT_SPEED },
            LASER_SHOT_LENGTH
        )
    })
}

const deleteLasers = () => {
    player.lasers.forEach((laser, index) => {
        if (
            getDistance(laser.createdPosition, laser.position) >
            player.laserRange
        )
            player.lasers.splice(index, 1)
    })
}

const handleAsteroids = () => {
    if (asteroids.length && context) {
        moveAsteroids(asteroids)
        drawAsteroids(context, asteroids)
    } else initWave()
}

const handleAsteroidParticules = () => {
    calculateAsteroidParticulesPosition()
    drawAsteroidParticules()
    deleteParticules(asteroidParticules)
}

const calculateAsteroidParticulesPosition = () => {
    asteroidParticules.forEach((particule) => {
        const newParticulePos: Coordinates =
            calculateParticulePosition(particule)
        particule.position = { ...newParticulePos }
    })
}

const createParticules = (position: Coordinates, particuleNumber = 10) => {
    for (let i = 0; i < particuleNumber; i++) {
        asteroidParticules.push({
            createdPosition: position,
            directionVector: {
                x: Math.random() * (10 + 10) - 10,
                y: Math.random() * 20 - 10,
            },
            range: Math.random() * ASTEROID_PARTICULE_MAX_RANGE,
            speed:
                Math.random() *
                    (ASTEROID_PARTICULE_MAX_SPEED -
                        ASTEROID_PARTICULE_MIN_SPEED) +
                ASTEROID_PARTICULE_MIN_SPEED,
            position,
        })
    }
}

const drawAsteroidParticules = () => {
    asteroidParticules.forEach((particule) => {
        drawParticule(particule, ASTEROID_PARTICULE_LENGTH)
    })
}

const deleteParticules = (particuleArray: AsteroidParticule[]) => {
    particuleArray.forEach((particule, index) => {
        if (
            getDistance(particule.createdPosition, particule.position) >
            particule.range
        )
            particuleArray.splice(index, 1)
    })
}

const createExplosion = (position: Coordinates) => {
    createParticules(position, 50)

    for (let i = 0; i < 30; i++) {
        explosionParticules.push({
            createdPosition: position,
            directionVector: {
                x: Math.random() * (10 + 10) - 10,
                y: Math.random() * 20 - 10,
            },
            range: Math.random() * ASTEROID_PARTICULE_MAX_RANGE,
            speed:
                Math.random() *
                    (ASTEROID_PARTICULE_MAX_SPEED -
                        ASTEROID_PARTICULE_MIN_SPEED) +
                ASTEROID_PARTICULE_MIN_SPEED,
            position,
            opacity: Math.random() * 0.8,
            size: Math.random() * 2 + 2,
        })
    }
}

const handleExplosions = () => {
    moveExplosionParticules()
    deleteParticules(explosionParticules)
    drawExplosionParticules()
}

const moveExplosionParticules = () => {
    explosionParticules.forEach((particule) => {
        const newParticulePos: Coordinates =
            calculateParticulePosition(particule)
        particule.position = { ...newParticulePos }
    })
}

const drawExplosionParticules = () => {
    if (context) {
        explosionParticules.forEach((particule) => {
            const {
                position: { x, y },
                opacity,
                size,
            } = particule
            context.fillStyle = `rgba(255, 255, 255, ${opacity})`
            context.beginPath()
            context.arc(x, y, size, 0, 2 * Math.PI)
            context.fill()
            context.closePath()
        })
    }
}

const handleBackground = () => {
    moveBackgroundParticules()
    drawBackgroundParticules()
}

const moveBackgroundParticules = () => {
    backgroundParticules.forEach((particule) => {
        const {
            position: { x, y },
            speed,
            size,
        } = particule
        const { relativeDirectionVector: directionVector, speed: playerSpeed } =
            player

        const distancePerFrame = (speed * playerSpeed) / REFRESH_INTERVAL
        const vectorDistance = getDistance({ x: 0, y: 0 }, directionVector)
        const distanceRatio = distancePerFrame / vectorDistance
        const newPos = {
            x: x + directionVector.x * distanceRatio,
            y: y + directionVector.y * distanceRatio,
        }

        if (newPos.x > CANVAS_WIDTH + size) newPos.x -= CANVAS_WIDTH + size * 2
        if (newPos.x < 0 - size) newPos.x += CANVAS_WIDTH + size * 2
        if (newPos.y > CANVAS_HEIGHT + size)
            newPos.y -= CANVAS_HEIGHT + size * 2
        if (newPos.y < 0 - size) newPos.y += CANVAS_HEIGHT + size * 2

        particule.position = newPos
    })
}

const drawBackgroundParticules = () => {
    if (context) {
        backgroundParticules.forEach((particule) => {
            const {
                position: { x, y },
                opacity,
                size,
            } = particule
            context.fillStyle = `rgba(255, 255, 255, ${opacity})`
            context.beginPath()
            context.arc(x, y, size, 0, 2 * Math.PI)
            context.fill()
            context.closePath()
        })
    }
}

const createBackground = () => {
    for (let i = 0; i < 100; i++) {
        const position = {
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
        }
        const backgroundLevel = Math.random()
        const particule: ExplosionParticule = {
            createdPosition: { ...position },
            position: { ...position },
            directionVector: { x: 0, y: 0 },
            range: 0,
            speed: backgroundLevel * 8 + 1,
            opacity: backgroundLevel,
            size: backgroundLevel * 1 + 0.5,
        }
        backgroundParticules.push(particule)
    }
}

const detectPlayerCollision = () => {
    const { coordinates, invincibilityLeft } = player
    if (!player.lives) return

    if (invincibilityLeft) player.invincibilityLeft--
    else {
        asteroids.forEach((asteroid) => {
            const { size, coordinates: asteroidPosition } = asteroid
            if (
                !player.invincibilityLeft &&
                (getDistance(coordinates, asteroidPosition) < size ||
                    getDistance(player.leftWing, asteroidPosition) < size ||
                    getDistance(player.rightWing, asteroidPosition) < size)
            ) {
                player.lives--
                if (player.lives > 0) startPlayerInvincibility()
                else {
                    createExplosion(player.coordinates)
                    endGame = true
                    newGameDelay = NEW_GAME_DELAY * REFRESH_INTERVAL
                }
            }
        })
    }
}

const drawMessage = (
    message: string,
    flicker = false,
    y: number = CANVAS_HEIGHT / 2
) => {
    if (context) {
        context.textAlign = "center"
        context.font = "22px sans-serif"
        context.fillStyle = flicker
            ? `rgba( 255, 255, 255, ${
                  (currentInterval % (4 * REFRESH_INTERVAL)) /
                  (6 * REFRESH_INTERVAL)
              })`
            : "white"
        context.fillText(message, CANVAS_WIDTH / 2, y)
    }
}

const renderUpgradeMenu = () => {
    menuDelay++
    const { specialUpgradeChoice, upgradeChoice } = player
    // render the background element without moving them
    if (context) {
        context?.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
        drawAsteroidParticules()
        drawAsteroids(context, asteroids)
        drawBackgroundParticules()
        drawExplosionParticules()
        drawLasers()
        drawPlayer()
        drawUIElements()

        renderMenu(
            context,
            () => drawMessage("Choose an upgrade", false, 150),
            isUpgradeSpecial()
                ? specialUpgradeChoice.length
                : upgradeChoice.length
        )
        const color =
            menuDelay > MENU_CHOICE_DELAY * REFRESH_INTERVAL
                ? "white"
                : "rgba(255,255,255,0.5)"
        if (isUpgradeSpecial()) {
            renderMenu(
                context,
                () => drawMessage("Choose an upgrade", false, 150),
                player.specialUpgradeChoice.length
            )
            specialUpgradeChoice.forEach((item, index) => {
                const { x, y } = menuBoxesPosition[index]
                renderSpecialUpgrade(
                    specialUpgradeChoice[index],
                    { x, y },
                    color,
                    context
                )
                context.closePath()
            })
        } else {
            upgradeChoice.forEach((item, index) => {
                const { x, y } = menuBoxesPosition[index]
                renderUpgradeToString(
                    upgradeChoice[index],
                    { x, y },
                    color,
                    context
                )
                context.closePath()
            })
        }
    }
}

const draw = () => {
    if (!isPaused && !upgradeMenu) {
        context?.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
        handleBackground()
        handleAsteroids()
        handleAsteroidParticules()
        handleExplosions()
        drawUIElements()
        if (!endGame && !startGame) {
            handlePlayer()
            handleLasers()
            detectPlayerCollision()
        } else {
            drawMessage(
                startGame
                    ? "Welcome pilot ! Ready to shoot some rocks ?"
                    : "Your ship has been destroyed... Try again !"
            )
            if (!newGameDelay) {
                drawMessage(
                    "Click to start a new game",
                    true,
                    CANVAS_HEIGHT / 2 + 30
                )
            } else newGameDelay--
        }

        currentInterval++
        if (player.firing) laserTicking++
    } else if (isPaused) {
        drawMessage("Game paused")
        drawMessage("Press P to resume", true, CANVAS_HEIGHT / 2 + 30)
    } else {
        renderUpgradeMenu()
        drawUIElements()
    }
}

createBackground()

window.setInterval(draw, REFRESH_INTERVAL)
