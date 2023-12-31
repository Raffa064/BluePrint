const SAVE_DELAY = 1000
const projectList = loadProjectList()

var saveInterval
var currentProject

function loadProjectList() {
    var list = []

    const hasStoredData = localStorage['project-list'] !== undefined
    if (hasStoredData) {
        const decompressedJson = decompress(localStorage['project-list'])
        list = JSON.parse(decompressedJson)
    }

    list.getProject = (projectName) => {
        return list.find(project => {
            return project.name === projectName
        })
    }

    return list
}

function isValidProjectName(name) {
    return name.match(/^[A-z_]{1,}[A-z_0-9]*$/)
}

function createProject(projectName) {
    const projectData = {
        name: projectName.trim(),
        globalId: 0,
        blocks: [],
        connections: []
    }

    projectList.push(projectData)

    return project
}

function renameProject(project, newName) {
    if (project.name == newName) return

    const alreadyExists = projectList.getProject(newName) != null

    if (!alreadyExists && isValidProjectName(newName)) {
        if (currentProject === project.name) { // Rename openned project
            currentProject = newName
            updateCanvas()
        }

        project.name = newName
        return true
    }

    return false
}

function deleteProject(project) {
    const index = projectList.indexOf(project)
    if (index >= 0) {
        projectList.splice(index, 1)
    }
}

function loadProject(projectName) {
    const project = projectList.getProject(projectName)

    if (!project) return false

    if (saveInterval) { // Stop save interval
        save()
        clearInterval(saveInterval)
        saveInterval = null
    }

    currentProject = projectName
    resetState()
    loadState()
    updateCanvas()

    saveInterval = setInterval(save, SAVE_DELAY)

    return true
}

function loadState() {
    const project = projectList.getProject(currentProject)

    if (project) {
        state.globalId = project.globalId

        const loadedBlocks = {}
        project.blocks.forEach((blockData) => {
            const { id, x, y, content } = blockData
            const block = createBlock(x, y, id)
            block.setContent(content)

            loadedBlocks[id] = block
        })

        project.connections.forEach((connection) => {
            const [from, to] = connection
            loadedBlocks[from].connections.push(loadedBlocks[to])
        })
    } else {
        console.log('ERROR on loadState(): Project "' + currentProject + '" not exists ')
    }
}

function save() {
    const projectData = {
        name: currentProject,
        globalId: state.globalId,
        blocks: [],
        connections: []
    }

    state.blocks.forEach((block) => {
        const blockData = {
            id: block.id,
            x: block.offsetLeft,
            y: block.offsetTop,
            content: block.getContent()
        }

        projectData.blocks.push(blockData)

        block.connections.forEach((other) => {
            projectData.connections.push([block.id, other.id])
        })
    })

    if (DEBUG_MODE) {
        const project = projectList.getProject(currentProject)
        projectList.splice(projectList.indexOf(project), 1, projectData)
        localStorage.saveCount = parseInt(localStorage.saveCount || 0) + 1
    }

    localStorage.currentProject = currentProject
    localStorage['project-list'] = compress(JSON.stringify(projectList))
}