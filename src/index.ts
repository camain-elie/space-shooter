import { Ship } from "./Ship"
import { Coordinates, getDistance } from "./Vector"
import { BackgroundParticule, LinearParticule } from "./Particules"
import {
    handleUpgradeClick,
    getUpgradeChoice,
    renderUpgradeToString,
} from "./Upgrade"
import { timeString, startTimer, stopTimer, resetTimer } from "./Timer"

import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    SHIP_LENGTH,
    SHIP_WIDTH,
    ASTEROID_PARTICULE_LENGTH,
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
import { ParticuleCollection } from "./ParticuleCollection"

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
const asteroidParticules = new ParticuleCollection()
const backgroundParticules = new ParticuleCollection()
const explosionParticules = new ParticuleCollection()

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
    player.lasers.update()
    createNewLaser()
    calculateLasersCollision()
    if (context) player.lasers.draw(context)
}

const calculateLasersCollision = () => {
    player.lasers.collection.forEach((laser, laserIndex) => {
        asteroids.getBelt().forEach((asteroid, asteroidIndex) => {
            if (
                getDistance(laser.position, asteroid.coordinates) <
                asteroid.size
            ) {
                player.lasers.collection.splice(laserIndex, 1)
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
        player.lasers.addParticule(
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

const handleAsteroids = () => {
    if (asteroids.getNumber() && context) {
        asteroids.update()
        asteroids.draw(context)
    } else initWave()
}

const handleAsteroidParticules = () => {
    asteroidParticules.update()
    if (context) asteroidParticules.draw(context)
}

const createParticules = (position: Coordinates, number = 10) => {
    asteroidParticules.addRandomParticules(
        number,
        "linear",
        position,
        ASTEROID_PARTICULE_LENGTH
    )
}

const createExplosion = (position: Coordinates) => {
    createParticules(position, 50)
    explosionParticules.addRandomParticules(30, "circular", position, 2, 0.8)
}

const handleExplosions = () => {
    explosionParticules.update()
    if (context) explosionParticules.draw(context)
}

const handleBackground = () => {
    backgroundParticules.update()
    if (context) backgroundParticules.draw(context)
}

const createBackground = () => {
    for (let i = 0; i < 100; i++) {
        const position = {
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
        }
        const perspectiveRatio = Math.random()
        const particule = new BackgroundParticule(
            position,
            { x: 0, y: 0 },
            Number.POSITIVE_INFINITY,
            perspectiveRatio * 8 + 1,
            perspectiveRatio * 1 + 0.5,
            perspectiveRatio,
            player
        )
        backgroundParticules.addParticule(particule)
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
        asteroidParticules.draw(context)
        asteroids.draw(context)
        backgroundParticules.draw(context)
        explosionParticules.draw(context)
        player.lasers.draw(context)
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
