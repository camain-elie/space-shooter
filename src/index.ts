import { Ship } from "./Ship"
import { Coordinates, getDistance } from "./Vector"
import { CircularParticule, LinearParticule } from "./Particules"
import {
    handleUpgradeClick,
    getUpgradeChoice,
    renderUpgradeToString,
} from "./Apgrade"
import { timeString, startTimer, stopTimer, resetTimer } from "./Timer"

import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    SHIP_LENGTH,
    SHIP_WIDTH,
    ASTEROID_PARTICULE_LENGTH,
    ASTEROID_PARTICULE_MAX_RANGE,
    ASTEROID_PARTICULE_MAX_SPEED,
    ASTEROID_PARTICULE_MIN_SPEED,
    REFRESH_INTERVAL,
    SHIELD_RELOAD_TIME,
    LASER_SHOT_LENGTH,
    LASER_SHOT_SPEED,
} from "./Constants"
import { Asteroid } from "./Asteroid"
import {
    getSpecialUpgradesChoice,
    handleSecondaryLasers,
    handleSpecialUpgradeClick,
    hasSpecialUpgrade,
    renderSpecialUpgrade,
} from "./SpecialUpgrade"
import { menuBoxesPosition, renderMenu } from "./Menu"
import { AsteroidBelt } from "./AsteroidBelt"

// Game constants
const NEW_GAME_DELAY = 2
const MENU_CHOICE_DELAY = 1
const XP_BAR_LENGTH = 300
const XP_BAR_HEIGHT = 10
const NEXT_LEVEL_XP = 30

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

const player = new Ship()

const cursorPosition: Coordinates = {
    ...player.coordinates,
}

const asteroids: AsteroidBelt = new AsteroidBelt()
const asteroidParticules: LinearParticule[] = []
const backgroundParticules: CircularParticule[] = []
const explosionParticules: CircularParticule[] = []

// PLAYER MOVEMENTS
const handleCursorMove = (ev: MouseEvent | TouchEvent) => {
    const rect = gameCanvas.getBoundingClientRect()
    let clientX, clientY
    if (ev instanceof MouseEvent) {
        ;({ clientX, clientY } = ev)
    } else {
        const touch = ev.touches[0]
        ;({ clientX, clientY } = touch)
    }
    cursorPosition.x = clientX - rect.left
    cursorPosition.y = clientY - rect.top
}

gameCanvas.onmousemove = handleCursorMove
gameCanvas.ontouchmove = handleCursorMove

gameCanvas.onclick = () => {
    if (startGame) {
        startTimer()
        startGame = false
    }
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

const startFiring = () => (player.firing = true)
gameCanvas.onmousedown = startFiring
gameCanvas.ontouchstart = startFiring

const stopFiring = () => {
    player.firing = false
    laserTicking = 0
}
gameCanvas.onmouseup = stopFiring
gameCanvas.ontouchend = stopFiring

window.onkeydown = (event: KeyboardEvent) => {
    if (event.key.toLocaleLowerCase() === "p" && !startGame && !endGame) {
        isPaused ? startTimer() : stopTimer()
        isPaused = !isPaused
    }
}

gameCanvas.oncontextmenu = (event: MouseEvent) => event.preventDefault()

const restartGame = () => {
    endGame = false
    wave = 0
    asteroids.reset()
    resetTimer()
    startTimer()

    player.reset()
}

const initWave = () => {
    if (currentInterval) wave++

    asteroids.init(wave)
    player.startInvincibility()
}

const handleXp = (asteroid: Asteroid) => {
    const { type } = asteroid
    player.xp += type === 4 ? 50 : 4 - type

    if (player.xp > player.level * NEXT_LEVEL_XP) {
        if (player.shieldReloadTime) player.shieldReloadTime--
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
        context.fillText(`Remaining : ${asteroids.getNumber()}`, 20, 45)

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

        // draw the timer
        context.textAlign = "left"
        context.fillText(`${timeString}`, 20, CANVAS_HEIGHT - 20)
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
        player.update(cursorPosition)
        player.draw(context, cursorPosition)
    }
}

const handleLasers = () => {
    calculateLasersPosition()
    createNewLaser()
    calculateLasersCollision()
    drawLasers()
    deleteLasers()
}

const calculateLasersPosition = () => {
    player.lasers.forEach((laser) => laser.update())
}

const calculateLasersCollision = () => {
    player.lasers.forEach((laser, laserIndex) => {
        asteroids.getBelt().forEach((asteroid, asteroidIndex) => {
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
                    asteroids.destroyAsteroid(asteroidIndex, createParticules)
                }
            }
        })
    })
}

const createNewLaser = () => {
    const firingInterval = Math.floor(REFRESH_INTERVAL / player.laserRate)
    if (player.firing && laserTicking % firingInterval === 0) {
        const laserDirectionRatio = player.laserRange / player.distanceToCursor
        player.lasers.push(
            new LinearParticule(
                { ...player.coordinates },
                {
                    x:
                        (player.directionVector.x - player.coordinates.x) *
                        laserDirectionRatio,
                    y:
                        (player.directionVector.y - player.coordinates.y) *
                        laserDirectionRatio,
                },
                player.laserRange,
                LASER_SHOT_SPEED,
                LASER_SHOT_LENGTH
            )
        )
        handleSecondaryLasers(player)
    }
}

const drawLasers = () => {
    player.lasers.forEach((laser) => {
        if (context) laser.draw(context)
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
    if (asteroids.getNumber() && context) {
        asteroids.update()
        asteroids.draw(context)
    } else initWave()
}

const handleAsteroidParticules = () => {
    calculateAsteroidParticulesPosition()
    drawAsteroidParticules()
    deleteParticules(asteroidParticules)
}

const calculateAsteroidParticulesPosition = () => {
    asteroidParticules.forEach((particule) => particule.update())
}

const createParticules = (position: Coordinates, particuleNumber = 10) => {
    for (let i = 0; i < particuleNumber; i++) {
        asteroidParticules.push(
            new LinearParticule(
                position,
                {
                    x: Math.random() * (10 + 10) - 10,
                    y: Math.random() * 20 - 10,
                },
                Math.random() * ASTEROID_PARTICULE_MAX_RANGE,

                Math.random() *
                    (ASTEROID_PARTICULE_MAX_SPEED -
                        ASTEROID_PARTICULE_MIN_SPEED) +
                    ASTEROID_PARTICULE_MIN_SPEED,
                ASTEROID_PARTICULE_LENGTH
            )
        )
    }
}

const drawAsteroidParticules = () => {
    asteroidParticules.forEach((particule) => {
        if (context) particule.draw(context)
    })
}

const deleteParticules = (
    particuleArray: (LinearParticule | CircularParticule)[]
) => {
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
        explosionParticules.push(
            new CircularParticule(
                position,
                {
                    x: Math.random() * (10 + 10) - 10,
                    y: Math.random() * 20 - 10,
                },
                Math.random() * ASTEROID_PARTICULE_MAX_RANGE,

                Math.random() *
                    (ASTEROID_PARTICULE_MAX_SPEED -
                        ASTEROID_PARTICULE_MIN_SPEED) +
                    ASTEROID_PARTICULE_MIN_SPEED,

                Math.random() * 0.8,
                Math.random() * 2 + 2
            )
        )
    }
}

const handleExplosions = () => {
    moveExplosionParticules()
    deleteParticules(explosionParticules)
    drawExplosionParticules()
}

const moveExplosionParticules = () => {
    explosionParticules.forEach((particule) => particule.update())
}

const drawExplosionParticules = () => {
    if (context) {
        explosionParticules.forEach((particule) => {
            particule.draw(context)
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
        backgroundParticules.forEach((particule) => particule.draw(context))
    }
}

const createBackground = () => {
    for (let i = 0; i < 100; i++) {
        const position = {
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
        }
        const backgroundLevel = Math.random()
        const particule = new CircularParticule(
            position,
            { x: 0, y: 0 },
            0,
            backgroundLevel * 8 + 1,
            backgroundLevel,
            backgroundLevel * 1 + 0.5
        )
        backgroundParticules.push(particule)
    }
}

const detectPlayerCollision = () => {
    const { coordinates, invincibilityLeft } = player
    if (!player.lives) return

    if (invincibilityLeft) player.invincibilityLeft--
    else {
        asteroids.getBelt().forEach((asteroid) => {
            const { size, coordinates: asteroidPosition } = asteroid
            if (
                !player.invincibilityLeft &&
                (getDistance(coordinates, asteroidPosition) < size ||
                    getDistance(player.leftWing, asteroidPosition) < size ||
                    getDistance(player.rightWing, asteroidPosition) < size)
            ) {
                if (
                    hasSpecialUpgrade(player, "shieldGenerator") &&
                    !player.shieldReloadTime
                ) {
                    player.shieldReloadTime = SHIELD_RELOAD_TIME
                    player.startInvincibility()
                } else {
                    player.lives--
                    if (player.lives > 0) player.startInvincibility()
                    else {
                        createExplosion(player.coordinates)
                        endGame = true
                        stopTimer()
                        newGameDelay = NEW_GAME_DELAY * REFRESH_INTERVAL
                    }
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
        asteroids.draw(context)
        drawBackgroundParticules()
        drawExplosionParticules()
        drawLasers()
        player.draw(context, cursorPosition)
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
