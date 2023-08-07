const { floor, PI, sqrt, min, max } = Math

const rootTheme = document.querySelector(':root')
const canvas = document.querySelector('#bp-canvas')
const ctx = canvas.getContext('2d')
const container = document.querySelector('#bp-container')
const searchContainer = document.querySelector('#bp-search-container')
const searchToggler = document.querySelector('#search-toggler')
const searchInput = document.querySelector('#search-input')
const nextButton = document.querySelector('#search-next-button')

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

setupInputEvents()
setupSaveLoadFeatures()
setupCanvas(viewport, canvasQuality)
updateCanvas()

function toggleSearch() {
    if (!searchContainer.classList.toggle('hidden')) {
        searchInput.focus()
    }
}

function setupInputEvents() {
    searchInput.oninput = searchBlocks
    nextButton.onclick = goToNextBlock
    
    if (isMobile.any) {
        searchContainer.classList.add('mobile')
        searchToggler.onclick = toggleSearch
        // TODO: implement mobile input 
        return    
    }
    
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
}

function save() {
    const data = {
        globalId: state.globalId,
        blocks: [],
        connections: []
    }

    state.blocks.forEach((block) => {
        const blockData = {
            id: block.id,
            x: block.offsetLeft,
            y: block.offsetTop,
            content: block.innerHTML
        }
        data.blocks.push(blockData)

        block.connections.forEach((other) => {
            data.connections.push([block.id, other.id])
        })
    })

    localStorage.data = JSON.stringify(data)
}

function load() {
    const data = localStorage.data

    if (data) {
        const json = JSON.parse(data)

        state.globalId = json.globalId
        const loadedBlocks = {}
        json.blocks.forEach((blockData) => {
            const { id, x, y, content } = blockData
            const block = createBlock(x, y, id)
            block.innerHTML = content
            loadedBlocks[id] = block
        })
        json.connections.forEach((connection) => {
            const [from, to] = connection
            loadedBlocks[from].connections.push(loadedBlocks[to])
        })
    }
}

function setupSaveLoadFeatures() {
    load()
    setInterval(save, 2000)
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
    searchResults = state.blocks.filter(block => block.innerHTML.includes(searchInput.value))
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
    block.innerHTML = '<span contenteditable="true">Block</span>'

    block.style.left = snapToGrid(x) + 'px'
    block.style.top = snapToGrid(y) + 'px'
    block.connections = []

    container.appendChild(block)
    state.blocks.push(block)

    return block
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

function renderHUD(fontSize) {
    const x = viewport.width / 2
    const y = 15
    const lineHeight = fontSize * 1.2
    ctx.font = fontSize + 'px Helvetica'

    ctx.fillStyle = '#aaa'
    ctx.textAlign = 'left'
    ctx.fillText('Center: [ ' + (-transform.x + viewport.width/2).toFixed(2) + ', ' + (transform.y + viewport.height/2).toFixed(2) + ' ]', lineHeight, lineHeight)
    ctx.textAlign = 'right'
    ctx.fillText('Blocks: ' + container.children.length, viewport.width - lineHeight, lineHeight)
    
    if (!isMobile.any) {
        renderMobileGestures(x, y, lineHeight)
    } else {
        renderDesktopKeys(x, y, lineHeight)
    }
}

function renderDot(x, y, radius, color) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * PI)
    ctx.fillStyle = color
    ctx.fill()
}

function renderConnection(from, to) {
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
    ctx.strokeStyle = 'gray'
    ctx.lineWidth = 4
    ctx.stroke()

    renderDot(transform.x + fromX, transform.y + fromY, 8, '#08f')
    renderDot(transform.x + toX, transform.y + toY, 5, '#f80')
}

function updateCanvas() {
    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, viewport.width, viewport.height)

    ctx.strokeStyle = '#333'
    ctx.lineWidth = 3
    ctx.rect(transform.x, transform.y, viewport.width, viewport.height)
    ctx.stroke()

    const displacement = (x) => x / grid - floor(x / grid)
    for (let x = displacement(transform.x); x < viewport.width / grid; x++) {
        for (let y = displacement(transform.y); y < viewport.height / grid; y++) {
            renderDot(x * grid, y * grid, 1, x % 2 == y % 2 ? '#666' : '#555')
        }
    }

    for (const from of state.blocks) {
        for (const to of from.connections) {
            renderConnection(from, to)
        }
    }
    
     const fontSize = 15
     renderHUD(fontSize)
}