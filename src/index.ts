function startGame() {
    myGameArea.start()
}

type GameArea = {
    canvas: HTMLCanvasElement
    context?: CanvasRenderingContext2D
    start: any
}

var myGameArea: GameArea = {
    canvas: document.createElement("canvas"),
    start: function () {
        this.canvas.width = 480
        this.canvas.height = 270
        this.context = this.canvas.getContext("2d")!
        document.body.insertBefore(this.canvas, document.body.childNodes[0])
    },
}

startGame()
