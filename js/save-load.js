// lista de projetos
const projectList = loadProjectList()
const SAVE_DELAY = 1000

var saveInterval
var currentProject

function loadProjectList() {
    var list

    if (localStorage['project-list']) {
        list = JSON.parse(localStorage['project-list'])
    } else {
        list = []
    }

    list.getProject = function(projectName) {
        return this.find(p => p.name === projectName)
    }

    return list
}

function createProject(projectName) {
    const project = {
        name: projectName.trim(),
        globalId: 0,
        blocks: [],
        connections: []
    }

    projectList.push(project)

    return project
}

function isValidProjectName(name) {
    return name.match(/^[A-z_]{1,}[A-z_0-9]*$/)
}

function renameProject(project, newName) {
    if (project.name == newName) return
    
    if (projectList.getProject(newName) == null && isValidProjectName(newName)) {
        if (currentProject === project.name) {
            currentProject = newName
            localStorage.currentProject = currentProject
            updateCanvas()
        }

        project.name = newName
        return true
    }

    return false
}

function loadProject(projectName) {
    const project = projectList.getProject(projectName)

    if (!project) return false

    if (saveInterval) {
        save()
        clearInterval(saveInterval)
        saveInterval = null
    }

    currentProject = projectName
    localStorage.currentProject = currentProject
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
            block.innerHTML = content
            loadedBlocks[id] = block
        })
        project.connections.forEach((connection) => {
            const [from, to] = connection
            loadedBlocks[from].connections.push(loadedBlocks[to])
        })
    } else {
        console.log('ERROR: load() for a null project "' + currentProject + '"')
    }
}

function save() {
    const data = {
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
            content: block.innerHTML
        }
        data.blocks.push(blockData)
        block.connections.forEach((other) => {
            data.connections.push([block.id, other.id])
        })
    })

    const project = projectList.getProject(currentProject)
    projectList.splice(projectList.indexOf(project), 1, data)

    localStorage['project-list'] = JSON.stringify(projectList)

    localStorage.saveCount = parseInt(localStorage.saveCount || 0) + 1
}