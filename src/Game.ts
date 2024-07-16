import { Asteroid } from "./Asteroid"
import { AsteroidBelt } from "./AsteroidBelt"
import { Button } from "./Button"
import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    NEW_GAME_DELAY,
    NEXT_LEVEL_XP,
    REFRESH_INTERVAL,
    SHIELD_RELOAD_TIME,
} from "./Constants"
import { hardwareList } from "./HardwareSystem"
import { ParticuleCollection } from "./ParticuleCollection"
import { BackgroundParticule } from "./Particules"
import { Ship } from "./Ship"
import { resetTimer, startTimer, stopTimer, timeString } from "./Timer"
import {
    drawAsteroidNumber,
    drawCursor,
    drawMessage,
    drawRemainingLives,
    drawTimer,
    drawWave,
    drawXpBar,
} from "./UI"
import { createDamageParticules, createExplosion } from "./VFX"
import { Coordinates, getDistance } from "./Vector"

class Game {
    player: Ship
    cursorPosition: Coordinates
    asteroids: AsteroidBelt
    asteroidParticules: ParticuleCollection
    backgroundParticules: ParticuleCollection
    explosionParticules: ParticuleCollection
    currentInterval: number
    newGameDelay: number
    wave: number
    startGame: boolean
    endGame: boolean
    isPaused: boolean
    upgradeButtons: Button[]
    hardwareButtons: Button[]

    constructor() {
        this.player = new Ship()
        this.cursorPosition = { x: 0, y: 0 }
        this.asteroids = new AsteroidBelt()
        this.asteroidParticules = new ParticuleCollection()
        this.backgroundParticules = new ParticuleCollection()
        this.explosionParticules = new ParticuleCollection()
        this.currentInterval = 0
        this.newGameDelay = 0
        this.wave = 1
        this.startGame = true
        this.endGame = false
        this.isPaused = false
        this.upgradeButtons = []
        this.hardwareButtons = []

        this.createBackground()
    }

    restartGame() {
        this.endGame = false
        this.wave = 0
        this.asteroids.reset()
        resetTimer()
        startTimer()

        this.player.reset()
    }

    initWave() {
        if (this.currentInterval) this.wave++

        this.asteroids.init(this.wave)
        this.player.startInvincibility()
    }

    handleAsteroids(context: CanvasRenderingContext2D) {
        if (this.asteroids.getNumber() && context) {
            this.asteroids.update()
            this.asteroids.draw(context)
        } else this.initWave()
    }

    handleAsteroidParticules(context: CanvasRenderingContext2D) {
        this.asteroidParticules.update()
        this.asteroidParticules.draw(context)
    }

    handleExplosions(context: CanvasRenderingContext2D) {
        this.explosionParticules.update()
        this.explosionParticules.draw(context)
    }

    handleBackground(context: CanvasRenderingContext2D) {
        this.backgroundParticules.update()
        this.backgroundParticules.draw(context)
    }

    createBackground() {
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
                this.player
            )
            this.backgroundParticules.addParticule(particule)
        }
    }

    handleXp(context: CanvasRenderingContext2D, asteroid: Asteroid) {
        const { type } = asteroid
        this.player.xp += type === 4 ? 50 : 4 - type

        if (this.player.xp > this.player.level * NEXT_LEVEL_XP) {
            if (this.player.shieldReloadTime) this.player.shieldReloadTime--
            this.player.xp = this.player.xp - this.player.level * NEXT_LEVEL_XP
            this.player.level++
            if (this.player.isUpgradeSpecial()) {
                if (
                    context &&
                    this.player.hardware.getAvailableUpgrades() === 0
                )
                    this.hardwareButtons.push(
                        ...this.player.hardware.getHardwareButtons(context)
                    )
                if (this.player.hardware.isRemainingUpgrade())
                    this.player.hardware.increaseAvailableUpgrades()
            } else {
                if (
                    this.player.upgrades.getNumberOfTotalUpgrades() +
                        hardwareList.length >=
                    this.player.level - 1
                )
                    this.player.upgrades.increaseAvailableUpgrades()
                if (
                    context &&
                    !this.upgradeButtons.length &&
                    this.player.upgrades.getAvailableUpgrades()
                )
                    this.upgradeButtons.push(
                        ...this.player.upgrades.getUpgradeButtons(
                            context,
                            this.player
                        )
                    )
            }
        }
    }

    detectPlayerCollision() {
        const { coordinates, invincibilityLeft } = this.player
        if (!this.player.lives) return

        if (invincibilityLeft) this.player.invincibilityLeft--
        else {
            this.asteroids.getBelt().forEach((asteroid) => {
                const { size, coordinates: asteroidPosition } = asteroid
                if (
                    !this.player.invincibilityLeft &&
                    (getDistance(coordinates, asteroidPosition) < size ||
                        getDistance(this.player.leftWing, asteroidPosition) <
                            size ||
                        getDistance(this.player.rightWing, asteroidPosition) <
                            size)
                ) {
                    if (
                        this.player.hardware.hasHardware("shieldGenerator") &&
                        !this.player.shieldReloadTime
                    ) {
                        this.player.shieldReloadTime = SHIELD_RELOAD_TIME
                        this.player.startInvincibility()
                    } else {
                        this.player.lives--
                        if (this.player.lives > 0)
                            this.player.startInvincibility()
                        else {
                            createExplosion(
                                this.explosionParticules,
                                this.player.coordinates,
                                this.asteroidParticules
                            )
                            this.endGame = true
                            stopTimer()
                            this.newGameDelay =
                                NEW_GAME_DELAY * REFRESH_INTERVAL
                        }
                    }
                }
            })
        }
    }

    handlePlayer(context: CanvasRenderingContext2D) {
        this.player.update(this.cursorPosition)
        this.player.draw(context, this.cursorPosition)
    }

    calculateLasersCollision(context: CanvasRenderingContext2D) {
        this.player.weapons.lasers.collection.forEach((laser, laserIndex) => {
            this.asteroids.getBelt().forEach((asteroid, asteroidIndex) => {
                if (
                    getDistance(laser.position, asteroid.coordinates) <
                    asteroid.size
                ) {
                    this.player.weapons.lasers.collection.splice(laserIndex, 1)
                    if (asteroid.health > 1) {
                        asteroid.health--
                        createDamageParticules(
                            this.asteroidParticules,
                            laser.position
                        )
                    } else {
                        this.handleXp(context, asteroid)
                        this.asteroids.destroyAsteroid(asteroidIndex, () =>
                            createDamageParticules(
                                this.asteroidParticules,
                                asteroid.coordinates
                            )
                        )
                    }
                }
            })
        })
    }

    drawUIElements(context: CanvasRenderingContext2D) {
        drawWave(context, this.wave)
        drawAsteroidNumber(context, this.asteroids.getNumber())
        drawCursor(context, this.cursorPosition)
        drawRemainingLives(context, this.player.lives)
        drawXpBar(context, this.player)
        drawTimer(context, timeString)
        this.player.upgrades.draw(context)
        this.player.hardware.draw(context)
        this.upgradeButtons.forEach((button) => button.draw(context))
        this.hardwareButtons.forEach((button) => button.draw(context))
    }

    draw(context: CanvasRenderingContext2D, gameCanvas: HTMLCanvasElement) {
        if (!this.isPaused) {
            context?.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
            this.handleBackground(context)
            this.handleAsteroids(context)
            this.handleAsteroidParticules(context)
            this.handleExplosions(context)
            if (!this.endGame && !this.startGame) {
                this.handlePlayer(context)
                context &&
                    this.player.weapons.handleWeapons(context, this.player)
                this.calculateLasersCollision(context)
                this.detectPlayerCollision()
            } else {
                drawMessage(
                    context,
                    this.startGame
                        ? "Welcome pilot ! Ready to shoot some rocks ?"
                        : "Your ship has been destroyed... Try again !"
                )
                if (!this.newGameDelay) {
                    drawMessage(
                        context,
                        "Click to start a new game",
                        CANVAS_HEIGHT / 2 + 30,
                        true,
                        this.currentInterval
                    )
                } else this.newGameDelay--
            }
            this.drawUIElements(context)

            this.currentInterval++
        } else if (this.isPaused) {
            drawMessage(context, "Game paused")
            drawMessage(
                context,
                "Press P to resume",
                CANVAS_HEIGHT / 2 + 30,
                true,
                this.currentInterval
            )
        }
    }

    onClick(context: CanvasRenderingContext2D) {
        if (this.startGame) {
            startTimer()
            this.startGame = false
        } else if (this.endGame && !this.newGameDelay) this.restartGame()
        else {
            this.upgradeButtons.forEach((button) => {
                if (
                    button.checkOnClick(this.cursorPosition) &&
                    !this.player.upgrades.getAvailableUpgrades()
                )
                    this.upgradeButtons.length = 0
            })
            this.hardwareButtons.forEach((button) => {
                if (button.checkOnClick(this.cursorPosition)) {
                    if (context && this.player.hardware.getAvailableUpgrades())
                        this.hardwareButtons =
                            this.player.hardware.getHardwareButtons(context)
                    else this.hardwareButtons.length = 0
                }
            })
        }
    }

    onKeyDown(event: KeyboardEvent) {
        if (
            event.key.toLocaleLowerCase() === "p" &&
            !this.startGame &&
            !this.endGame
        ) {
            this.isPaused ? startTimer() : stopTimer()
            this.isPaused = !this.isPaused
        }
    }

    handleCursorMove(
        ev: MouseEvent | TouchEvent,
        gameCanvas: HTMLCanvasElement
    ) {
        const rect = gameCanvas.getBoundingClientRect()
        let clientX, clientY
        if (ev instanceof MouseEvent) {
            ;({ clientX, clientY } = ev)
        } else {
            const touch = ev.touches[0]
            ;({ clientX, clientY } = touch)
        }
        this.cursorPosition.x = clientX - rect.left
        this.cursorPosition.y = clientY - rect.top
    }
}

export { Game }
