const { floor, PI, sqrt, min, max, random } = Math

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
const manager = document.querySelector('#manager')
const managerModal = document.querySelector('#manager .modal')
const managerSearchBar = document.querySelector('#manager #search-bar')
const managerProjectList = document.querySelector('#manager #project-list')
const managerProjectCreate = document.querySelector('#manager #project-create')

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
setupProjectManager()
setupCanvas()
updateCanvas()

function resetState() {
    container.innerHTML = ''
    state.globalId = 0
    state.blocks = []
    translateTo(0, 0)
}

function handleMenuOption(option) {
    const options = {
        'project': function() {
            toggleManager()
            searchProject('')
        },
        'export': function() {
            save()
            const projectJson = JSON.stringify(projectList.getProject(currentProject))
            const blob = new Blob([projectJson], { type: 'application/json' })
            const downloadUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = 'BluePrint-'+currentProject+'-' + floor(Date.now() / 1000) + '.json'
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
                    const projectData = JSON.parse(e.target.result)
                    while (projectList.getProject(projectData.name)) {
                        projectData.name += '_imported_'+floor(Date.now()/1000)
                    }
                    projectList.push(projectData)
                    resetState()
                    loadProject(projectData.name)
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
        console.log('Check is mobile: ' + isMobile.any)
    } catch {
        console.log("Error on load isMobile.js")
        window.isMobile = {
            any: window.screen.width < 600
        }
    }

    console.log('isMobile: ' + isMobile.any)
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

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
}

function setupSaveLoadFeatures() {
    const current = localStorage.currentProject || 'new-project'
    if (!loadProject(current)) {
        createProject(current)
        loadProject(current)
    }
}

function searchProject(query) {
    managerProjectList.innerHTML = ''

    const projects = projectList.filter((p) => {
        return p.name.toLowerCase().includes(query.trim().toLowerCase())
    })

    projects.forEach((project) => {
        const projectItem = document.createElement('li')
        projectItem.classList.add('project-item')
        managerProjectList.appendChild(projectItem)

        const projectName = document.createElement('p')
        projectName.classList.add('project-name')
        projectName.innerText = project.name
        projectName.contentEditable = 'true'
        projectName.oninput = () => {
            if (renameProject(project, projectName.innerText)) {
                projectName.classList.remove('error')
                return
            }

            projectName.classList.add('error')
        }
        projectItem.appendChild(projectName)

        const projectDelete = document.createElement('button')
        projectDelete.classList.add('project-option')
        projectDelete.innerText = 'Delete'
        var clickCount = 0
        projectDelete.onclick = () => {
            clickCount++
            projectDelete.innerText = 'Twice!'

            setTimeout(() => {
                if (clickCount > 2) {
                    projectList.splice(project, 1)
                    searchProject(query)
                    return
                }

                projectDelete.innerText = 'Delete'
            }, 180)
        }

        if (project.name != currentProject) {
            projectItem.appendChild(projectDelete)
        }

        const projectOpen = document.createElement('button')
        projectOpen.classList.add('project-option')
        projectItem.appendChild(projectOpen)
        projectOpen.onclick = () => {
            loadProject(project.name)
            toggleManager()
        }
        projectOpen.innerText = 'Open'
    })
}

function toggleManager() {
    manager.classList.toggle('openned')
}

function generateHash(size) {
    var hash = ''
    for (let i = 0; i < size; i++) {
        hash += floor(random() * 16).toString(16)
    }
    
    return hash
}

function setupProjectManager() {
    manager.onclick = (event) => {
        if (event.target == manager) {
            event.preventDefault()
            toggleManager()
        }
    }

    managerSearchBar.oninput = () => {
        searchProject(managerSearchBar.value)
    }
    
    managerProjectCreate.onclick = () => {
        const newProjectName = 'New-Project-'+generateHash(10)
        createProject(newProjectName)
        searchProject(newProjectName)
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
    
    const content = block.querySelector('.content')
        
    block.style.left = snapToGrid(x) + 'px'
    block.style.top = snapToGrid(y) + 'px'
    block.connections = []
    block.setContent = (contentStr) => {
        content.innerHTML = contentStr
    }
    block.getContent = () => {
        return content.innerHTML
    }

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