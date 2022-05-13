const DEFAULT_OPTIONS = {
  position: 'top-left',
  text: 'Hello World!',
  autoClose: 3000,
  canClose: true,
  onClose: () => {},
  showProgress: true,
  pauseOnHover: true,
}

export default class Toast {
  #canClose
  #isPaused = false
  #toastElem
  #removeBinded
  #createTime = new Date()

  #remainingTime = 0
  #remainingProgress = 1
  #totalMouseoverTime = 0
  #mouseoverTime = 0
  #mouseleaveTime = 0
  #timeVisible = 0
  
  // setTimeout / setInterval
  #progressBarAnimationFrame
  #remainingProgressAnimationFrame

  constructor(options) {
    this.#toastElem = document.createElement('div')
    this.#toastElem.classList.add('toast')
    requestAnimationFrame(() => {
      this.#toastElem.classList.add('show')
    })
    this.#removeBinded = this.remove.bind(this)

    this.update({ ...DEFAULT_OPTIONS, ...options })
    if(!this.#canClose) {
      throw new Error('canClose property must be true when autoClose is false.')
    }
  }

  set position(value) {
    const selector = `[data-position="${value}"]`
    const container = document.querySelector(selector) || createContainer(value)
    container.append(this.#toastElem)
  }

  set text(value) {
    this.#toastElem.textContent = value
  }

  set autoClose(value) {
    if (value === false) return
    if (typeof value === 'number' && value > 0){
      this.#remainingTime = value
      const func = (time) => {
        const now = new Date()
        if (!this.#isPaused && this.#remainingProgress > 0) {
          this.#timeVisible = now - this.#createTime 
          this.#remainingProgress = 1 - (this.#timeVisible - this.#totalMouseoverTime) / this.#remainingTime
          this.#remainingProgressAnimationFrame = requestAnimationFrame(func)
        } else if (this.#isPaused && this.#remainingProgress > 0) {
          this.#remainingProgressAnimationFrame = requestAnimationFrame(func)
        } else this.remove()
      } 
      this.#remainingProgressAnimationFrame = requestAnimationFrame(func)
    } else return


  }

  set canClose(value) {
    if (value === true) {
      this.#canClose = true
      this.#toastElem.addEventListener('click', this.#removeBinded)
    } else {
      this.#canClose = false
      this.#toastElem.style.cursor = 'not-allowed'
      this.#toastElem.removeEventListener('click', this.#removeBinded)
    }
  }

  set pauseOnHover(value) {
    const handleMouseover = () => {
      this.#isPaused = true
      this.#mouseoverTime = new Date()
    }
    const handleMouseleave = () => {
      this.#isPaused = false
      this.#mouseleaveTime = new Date()
      this.#totalMouseoverTime += (this.#mouseleaveTime - this.#mouseoverTime)
    }
    if (typeof value === 'boolean' && !!value) {
      this.#toastElem.addEventListener('mouseover', handleMouseover)
      this.#toastElem.addEventListener('mouseleave', handleMouseleave)
    }
    else {
      this.#toastElem.removeEventListener('mouseover', handleMouseover)
      this.#toastElem.removeEventListener('mouseleave', handleMouseleave)
    }
  }

  set showProgress(value) {
    if (value === true) {
      this.#toastElem.classList.add('progress')
      this.#toastElem.style.setProperty('--progress', 1)

      const func = (time) => {
        if(!this.#isPaused) {
          this.#toastElem.style.setProperty('--progress', this.#remainingProgress)
          this.#progressBarAnimationFrame = requestAnimationFrame(func)
        }
        else {
        this.#progressBarAnimationFrame = requestAnimationFrame(func)
        }
      }
      this.#progressBarAnimationFrame = requestAnimationFrame(func)
    } 
  }

  update(options) {
    Object.entries(options).forEach(([key, value]) => {
      this[key] = value
    })
  }

  remove(value) {
    cancelAnimationFrame(this.#progressBarAnimationFrame)
    cancelAnimationFrame(this.#remainingProgressAnimationFrame)

    const currentContainer = this.#toastElem.parentElement
    this.#toastElem.classList.remove('show')
    this.#toastElem.addEventListener('transitionend', () => {
      this.#toastElem.remove()
      if (!currentContainer.hasChildNodes()) {
        currentContainer.remove()
      }
    })
    this.onClose()
  }
}

function createContainer(position) {
  const container = document.createElement('div')
  container.classList.add('toast-container')
  container.dataset.position = position
  document.body.append(container)
  return container
}
