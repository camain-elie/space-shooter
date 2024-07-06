import { Ship } from "./Ship"
import { Coordinates, getDistance } from "./Vector"
import { BackgroundParticule, LinearParticule } from "./Particules"
import { timeString, startTimer, stopTimer, resetTimer } from "./Timer"

import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    ASTEROID_PARTICULE_LENGTH,
    REFRESH_INTERVAL,
    SHIELD_RELOAD_TIME,
    LASER_SHOT_LENGTH,
    LASER_SHOT_SPEED,
    NEXT_LEVEL_XP,
} from "./Constants"
import { Asteroid } from "./Asteroid"
import { AsteroidBelt } from "./AsteroidBelt"
import { ParticuleCollection } from "./ParticuleCollection"
import {
    drawAsteroidNumber,
    drawCursor,
    drawRemainingLives,
    drawTimer,
    drawWave,
    drawXpBar,
} from "./UI"
import { Button } from "./Button"

// Game constants
const NEW_GAME_DELAY = 2

let currentInterval = 0
let wave = 1
let startGame = true
let endGame = false
let isPaused = false
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

const buttonArray: Button[] = []
let hardwareButtons: Button[] = []

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
    } else if (endGame && !newGameDelay) restartGame()
    else {
        buttonArray.forEach((button) => {
            if (
                button.checkOnClick(cursorPosition) &&
                !player.upgrades.getAvailableUpgrades()
            )
                buttonArray.length = 0
        })
        hardwareButtons.forEach((button) => {
            if (button.checkOnClick(cursorPosition)) {
                if (context && player.hardware.getAvailableUpgrades())
                    hardwareButtons =
                        player.hardware.getHardwareButtons(context)
                else hardwareButtons.length = 0
            }
        })
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
        if (isUpgradeSpecial()) {
            if (context && player.hardware.getAvailableUpgrades() === 0)
                hardwareButtons.push(
                    ...player.hardware.getHardwareButtons(context)
                )
            if (player.hardware.isRemainingUpgrade())
                player.hardware.increaseAvailableUpgrades()
        } else {
            if (player.upgrades.getNumberOfTotalUpgrades() >= player.level - 1)
                player.upgrades.increaseAvailableUpgrades()
            if (
                context &&
                !buttonArray.length &&
                player.upgrades.getAvailableUpgrades()
            )
                buttonArray.push(
                    ...player.upgrades.getUpgradeButtons(context, player)
                )
        }
    }
}

const isUpgradeSpecial = () => player.level % 15 === 0

// DRAW
const drawUIElements = () => {
    if (context) {
        drawWave(context, wave)
        drawAsteroidNumber(context, asteroids.getNumber())
        drawCursor(context, cursorPosition)
        drawRemainingLives(context, player.lives)
        drawXpBar(context, player)
        drawTimer(context, timeString)
        player.upgrades.draw(context)
        player.hardware.draw(context)
        buttonArray.forEach((button) => button.draw(context))
        hardwareButtons.forEach((button) => button.draw(context))
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
        player.hardware.handleSecondaryLasers(player)
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
                    player.hardware.hasHardware("shieldGenerator") &&
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

const draw = () => {
    if (!isPaused) {
        context?.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
        handleBackground()
        handleAsteroids()
        handleAsteroidParticules()
        handleExplosions()
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
        drawUIElements()

        currentInterval++
        if (player.firing) laserTicking++
    } else if (isPaused) {
        drawMessage("Game paused")
        drawMessage("Press P to resume", true, CANVAS_HEIGHT / 2 + 30)
    }
}

createBackground()

window.setInterval(draw, REFRESH_INTERVAL)
