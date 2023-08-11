if (location.host.startsWith('localhost')) {
    console.log('DEBUG ENABLED')
    
    logData()
    
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
    }
    
    function logData() {
        const blockCount = container.children.length
        var connectionCount = 0
        const projectCount = projectList.length
        const totalStorage = (localStorage.saveCount + localStorage.currentProject + localStorage['project-list']).length
        const { saveCount } = localStorage
        const avgTime = ((saveCount * SAVE_DELAY) / 1000) / 60
        
        document.querySelectorAll('.block').forEach((block) => {
            connectionCount += block.connections.length
        })
        
        console.log(
            'Current project: ' + currentProject + '\n' +
            'Block count: ' + blockCount + '\n' +
            'Connection count: ' + connectionCount + '\n' +
            'Project count: ' + projectCount + '\n' +
            'Total stored data: ' + totalStorage + ' bytes' + '\n' +
            'Save count: ' + (saveCount || 0) + '\n' +
            'Average time: ' + avgTime.toFixed(2) + ' minutes'
        )
    }
}