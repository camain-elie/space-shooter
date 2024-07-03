let timeCount = 0
let timeString = "0:00:00"
let interval: number

const startTimer = () => {
  interval = window.setInterval(() => {
    timeCount++
    timeString = timeToString()
  }, 1000)
}

const stopTimer = () => {
  window.clearInterval(interval)
}

const resetTimer = () => (timeCount = 0)

const timeToString = () => {
  const seconds = timeCount % 60
  const totalMinutes = (timeCount - seconds) / 60
  const minutes = totalMinutes % 60
  const hours = (totalMinutes - minutes) / 60
  return `${hours}:${minutes < 10 ? 0 : ""}${minutes}:${
    seconds < 10 ? 0 : ""
  }${seconds}`
}

export { timeString, startTimer, stopTimer, resetTimer }
