const DEBUG_MODE = location.host.startsWith('localhost')

if (DEBUG_MODE) {
    console.log('DEBUG ENABLED')
    
    //logData()
    
    function testProjectNames() {
        const names = [
            ['Project', true],
            ['Proj3ct', true],
            ['Pro_ject', true],
            ['_Project', true],
            ['Project_', true],
            ['Pro ject', false],
            ['Pro-ject', false],
            ['120Pro-ject', false],
            ['#Project', false],
            ['P roject', false],
            [' Project', false]
        ]
        
        for (test of names) {
            if (isValidProjectName(test[0]) != test[1]) {
                console.log('REGEX ERROR ON isValidProjectName()')
                return
            }
        }
    }
    
    function wipeData() {
        clearInterval(saveInterval)
        delete localStorage['saveCount']
        delete localStorage['project-list']
        delete localStorage['currentProject']
    }
    
    function reload() {
        window.location.reload()
    }
    
    function toggleMobile() {
        isMobile.any = !isMobile.any
        
        if (isMobile.any) {
            container.removeEventListener('mousedown', onMouseDown)
            container.removeEventListener('mousemove', onMouseMove)
            container.removeEventListener('mouseup', onMouseUp)
            container.removeEventListener('keydown', onKeyDown)
            container.removeEventListener('keyup', onKeyUp)
        } else {
            container.removeEventListener('touchstart', onTouchDown)
            container.removeEventListener('touchmove', onTouchMove)
            container.removeEventListener('touchend', onTouchUp)
        }
        
        setupInputEvents()
        updateCanvas()
    }
    
    function logData() {
        const project = projectList.getProject(currentProject)
        const blockCount = project.blocks.length
        const connectionCount = project.connections.length
        const projectCount = projectList.length
        var totalBlockCount = projectList.reduce((acc, prj) => acc + prj.blocks.length, 0)
        var totalConnectionCount = projectList.reduce((acc, prj) => acc + prj.connections.length, 0)
        const totalStorage = (localStorage.saveCount + localStorage.currentProject + localStorage['project-list']).length
        const jsonLength = JSON.stringify(projectList).length
        const compressedJsonLength = localStorage['project-list'].length
        const compressPercentage = (100-(compressedJsonLength / (jsonLength/100))).toFixed(2)
        const savedStorage = jsonLength - compressedJsonLength
        const { saveCount } = localStorage
        const avgTime = ((saveCount * SAVE_DELAY) / 1000) / 60
        
        console.log(
            'Current project: ' + currentProject + '\n' +
            '  Project block count: ' + blockCount + '\n' +
            '  Project connection count: ' + connectionCount + '\n' +
            'Project count: ' + projectCount + '\n' +
            '  Total project block count: ' + totalBlockCount + '\n' +
            '  Total project connection count: ' + totalConnectionCount + '\n' +
            'Total stored data: ' + totalStorage + ' bytes' + '\n' +
            'Json length: ' + jsonLength + ' bytes' + '\n' +
            'Compressed json length: ' + compressedJsonLength + ' bytes ('+compressPercentage+'%)' + '\n' +
            'Saved storage (by LZ77): ' + savedStorage + ' bytes' + '\n' +
            'Save count: ' + (saveCount || 0) + '\n' +
            'Average time: ' + avgTime.toFixed(2) + ' minutes'
        )
    }
}