const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 720
const CANVAS_SIDE_MARGIN = 20
const HARDWARE_BUTTON_WIDTH = 100
const HARDWARE_BUTTON_MARGIN = 50
const UPGRADE_JAUGE_LENGTH = 200
const UPGRADE_JAUGE_HEIGHT = 20
const UPGRADE_BUTTON_WIDTH = 20
const JAUGE_FILL_COLOR = "rgba(255, 255, 255, 0.6)"
const BOX_BOTTOM_POSITIONS = [
    {
        x:
            CANVAS_WIDTH / 2 -
            (HARDWARE_BUTTON_WIDTH +
                HARDWARE_BUTTON_WIDTH / 2 +
                HARDWARE_BUTTON_MARGIN),
        y: CANVAS_HEIGHT - HARDWARE_BUTTON_WIDTH - HARDWARE_BUTTON_MARGIN,
    },
    {
        x: CANVAS_WIDTH / 2 - HARDWARE_BUTTON_WIDTH / 2,
        y: CANVAS_HEIGHT - HARDWARE_BUTTON_WIDTH - HARDWARE_BUTTON_MARGIN,
    },
    {
        x:
            CANVAS_WIDTH / 2 +
            HARDWARE_BUTTON_WIDTH / 2 +
            HARDWARE_BUTTON_MARGIN,
        y: CANVAS_HEIGHT - HARDWARE_BUTTON_WIDTH - HARDWARE_BUTTON_MARGIN,
    },
]
const XP_BAR_LENGTH = 300
const XP_BAR_HEIGHT = 10

export {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    CANVAS_SIDE_MARGIN,
    HARDWARE_BUTTON_WIDTH,
    HARDWARE_BUTTON_MARGIN,
    UPGRADE_JAUGE_LENGTH,
    UPGRADE_JAUGE_HEIGHT,
    UPGRADE_BUTTON_WIDTH,
    JAUGE_FILL_COLOR,
    BOX_BOTTOM_POSITIONS,
    XP_BAR_LENGTH,
    XP_BAR_HEIGHT,
}
