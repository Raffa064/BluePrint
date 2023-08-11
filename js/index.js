const { floor, PI, sqrt, min, max } = Math

const rootTheme = document.querySelector(':root')
const canvas = document.querySelector('#canvas')
const ctx = canvas.getContext('2d')
const container = document.querySelector('#container')
const searchContainer = document.querySelector('#search-container')
const searchToggler = document.querySelector('#search-toggler')
const searchInput = document.querySelector('#search-input')
const nextButton = document.querySelector('#search-next-button')
const menuContainer = document.querySelector('#menu-container')
const menuTogglers = document.querySelectorAll("#menu-container > span")

const state = {
    globalId: 0,
    blocks: []
}

var viewport = {}
var canvasQuality = window.devicePixelRatio
var grid = 20
var isDragging
var isBlockDragging
var dragOffset = { x: 0, y: 0 }
var transform = { x: 0, y: 0 }
var isConnecting;
var selectedBlock;
var searchResults = []
var searchIndex = 0

checkMobileDevice()
setupInputEvents()
setupSaveLoadFeatures()
setupCanvas(viewport, canvasQuality)
updateCanvas()

function handleMenuOption(option) {
    const options = {
        'project': function() {
            // TODO: create project dialog
        },
        'export': function() {
            save()
            const blob = new Blob([window.localStorage.data], { type: 'application/json' })
            const downloadUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = 'BluePrint-save-' + (Date.now() / 1000) + '.json'
            link.click()
            URL.revokeObjectURL(blob)
        },
        'import': function() {
            const input = document.createElement('input')
            input.type = 'file'
            input.onchange = (event) => {
                const file = event.target.files[0]
                reader = new FileReader()
                reader.onload = (e) => {
                    window.localStorage.data = e.target.result
                    container.innerHTML = ''
                    state.globalId = 0
                    state.blocks = []
                    load()
                    save()
                    updateCanvas()
                }
                reader.readAsText(file)
            }
            input.click()
        }
    }

    options[option]()
    toggleMenu()
}

function checkMobileDevice() {
    try {
        console.log(isMobile.any)
    } catch {
        console.log("Error on load isMobile.js")
        window.isMobile = {
            any: window.screen.width < 600
        }
    }
    
    console.log('isMobile: '+isMobile.any)
}

function toggleSearch() {
    if (!searchContainer.classList.toggle('hidden')) {
        searchInput.focus()
    }
}

function toggleMenu() {
    menuContainer.classList.toggle('openned')
}

function setupInputEvents() {
    searchInput.oninput = searchBlocks
    nextButton.onclick = goToNextBlock

    menuTogglers.forEach(toggler => {
        toggler.onclick = toggleMenu
    })

    if (isMobile.any) {
        searchContainer.classList.add('mobile')
        searchToggler.onclick = toggleSearch

        container.addEventListener('touchstart', onTouchDown)
        container.addEventListener('touchmove', onTouchMove)
        container.addEventListener('touchend', onTouchUp)
        return
    }

    container.addEventListener('mousedown', onMouseDown)
    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseup', onMouseUp)
    container.addEventListener('keydown', onKeyDown)
    container.addEventListener('keyup', onKeyUp)
}

function setupSaveLoadFeatures() {
    const current = localStorage.currentProject || 'new-project'
    if (!loadProject(current)) {
        createProject(current)
        loadProject(current)
    }
}

function setupCanvas() {
    const canvasRect = canvas.getBoundingClientRect()

    viewport = {
        width: canvasRect.width,
        height: canvasRect.height
    }

    canvas.width = viewport.width * canvasQuality
    canvas.height = viewport.height * canvasQuality
    ctx.scale(canvasQuality, canvasQuality)

    window.onresize = () => {
        setupCanvas()
        updateCanvas()
    }
}

function searchBlocks() {
    searchResults = state.blocks.filter(block => block.innerHTML.toLowerCase().includes(searchInput.value.toLowerCase()))
    searchIndex = 0
    nextButton.textContent = 'Next (0/' + searchResults.length + ')'

    if (searchResults.length <= 0) {
        searchInput.classList.add('error')
        return
    }

    searchInput.classList.remove('error')
}

function goToNextBlock() {
    if (searchResults.length <= 0) return

    block = searchResults[searchIndex]
    searchIndex = (searchIndex + 1) % searchResults.length
    nextButton.textContent = 'Next (' + searchIndex + '/' + searchResults.length + ')'
    if (block) {
        const rect = getBlockRect(block)

        translateTo(
            transform.x - rect.x - rect.width / 2 + viewport.width / 2,
            transform.y - rect.y - rect.height / 2 + viewport.height / 2
        )

        updateCanvas()
    }
}

function snapToGrid(n) {
    return floor(n / grid) * grid
}

function createBlock(x = 0, y = 0, id) {
    const block = document.createElement('div')
    block.id = id
    block.className = 'block'
    block.innerHTML = '<span class="content" contenteditable="true">Block</span>'

    block.style.left = snapToGrid(x) + 'px'
    block.style.top = snapToGrid(y) + 'px'
    block.connections = []

    container.appendChild(block)
    state.blocks.push(block)

    return block
}

function deleteBlock(block) {
    event.preventDefault()
    container.removeChild(block)
    state.blocks.splice(state.blocks.indexOf(block), 1)
    state.blocks.forEach(_block => {
        _block.connections = _block.connections.filter((b) => b !== block)
    })
}

function getBlockRect(block) {
    return block.getBoundingClientRect();
}

function findBlock(x, y) {
    for (let i = state.blocks.length - 1; i >= 0; i--) {
        const block = state.blocks[i]
        const rect = getBlockRect(block)
        if (x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height) {
            return block
        }
    }
}

function select(block) {
    selectedBlock = block
    selectedBlock.classList.add('selected')
}

function unselect() {
    selectedBlock.classList.remove('selected')
    selectedBlock = null
}

function translateTo(x, y) {
    transform.x = x
    transform.y = y
    rootTheme.style.setProperty('--translate-x', transform.x + 'px')
    rootTheme.style.setProperty('--translate-y', transform.y + 'px')
}

function renderDot(x, y, radius, color) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * PI)
    ctx.fillStyle = color
    ctx.fill()
}

function renderConnection(from, to, fake) {
    const canvasRect = canvas.getBoundingClientRect()

    const x1 = from.offsetLeft + from.offsetWidth / 2
    const y1 = from.offsetTop + from.offsetHeight / 2
    const x2 = to.offsetLeft + to.offsetWidth / 2
    const y2 = to.offsetTop + to.offsetHeight / 2

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dst = sqrt(dx ** 2 + dy ** 2)

    var fromX, fromY

    fromX = x1 + (dx * from.offsetWidth / dst)
    fromY = y1 + (dy * from.offsetHeight / dst)
    fromX = max(from.offsetLeft, min(from.offsetLeft + from.offsetWidth, fromX))
    fromY = max(from.offsetTop, min(from.offsetTop + from.offsetHeight, fromY))

    toX = x2 - (dx * to.offsetWidth / dst)
    toY = y2 - (dy * to.offsetHeight / dst)
    toX = max(to.offsetLeft, min(to.offsetLeft + to.offsetWidth, toX))
    toY = max(to.offsetTop, min(to.offsetTop + to.offsetHeight, toY))

    ctx.beginPath()
    ctx.moveTo(transform.x + fromX, transform.y + fromY)
    ctx.lineTo(transform.x + toX, transform.y + toY)
    ctx.strokeStyle = fake ? '#aaa3' : '#aaa6'
    ctx.lineWidth = 4
    ctx.stroke()

    renderDot(transform.x + fromX, transform.y + fromY, 8, fake ? '#08fa' : '#08f')
    renderDot(transform.x + toX, transform.y + toY, 5, fake ? '#f80a' : '#f80')
}

function renderBackground() {
    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, viewport.width, viewport.height)
}

function renderGuide() {
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 3
    ctx.rect(transform.x, transform.y, viewport.width - 1.5, viewport.height - 1.5)
    ctx.stroke()

    const displacement = (x) => x / grid - floor(x / grid)
    for (let x = displacement(transform.x); x < viewport.width / grid; x++) {
        for (let y = displacement(transform.y); y < viewport.height / grid; y++) {
            renderDot(x * grid, y * grid, 1, x % 2 == y % 2 ? '#666' : '#555')
        }
    }
}

function renderHUD(fontSize) {
    const lineHeight = fontSize * 1.2
    ctx.font = fontSize + 'px Helvetica'

    ctx.fillStyle = '#aaa'
    ctx.textAlign = 'left'
    ctx.fillText('[ ' + (-transform.x + viewport.width / 2).toFixed(2) + ', ' + (transform.y + viewport.height / 2).toFixed(2) + ' ]', lineHeight, lineHeight)
    ctx.textAlign = 'right'
    ctx.fillText('Blocks: ' + container.children.length, viewport.width - lineHeight, lineHeight)

    ctx.fillStyle = '#aaa'
    ctx.textAlign = 'left'
    ctx.fillText(currentProject, lineHeight, viewport.height - lineHeight)
    
    const x = viewport.width / 2
    const y = lineHeight

    if (isMobile.any) {
        renderMobileGestures(x, y, lineHeight)
    } else {
        renderDesktopKeys(x, y, lineHeight)
    }
}

function updateCanvas() {
    renderBackground()
    renderGuide()
    renderHUD(isMobile.any ? 13 : 15)

    for (const from of state.blocks) {
        for (const to of from.connections) {
            renderConnection(from, to)
        }
    }

    if (isMobile.any && selectedBlock && targetBlock) {
        if (targetBlock == selectedBlock) {
            const rect = getBlockRect(targetBlock)
            ctx.fillStyle = '#ed7'
            ctx.textAlign = 'center'
            ctx.fontSize = '20px'
            ctx.fillText('This block will be deleted', rect.x + rect.width / 2, rect.y - 10)
            return
        }

        renderConnection(selectedBlock, targetBlock, true)
    }

}