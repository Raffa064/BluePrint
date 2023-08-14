const DOUBLE_CLICK_DURATION = 200
const HOLD_DURATION = 300

var waitingForDoubleClick = false
var holdTimeoutId
var holdingBlock
var targetBlock

function onTouchDown(event) {
    if (event.touches.length > 1) {
        return
    }

    if (waitingForDoubleClick) { // Double click
        waitingForDoubleClick = false
        createBlock(event.touches[0].clientX - transform.x, event.touches[0].clientY - transform.y, state.globalId++)
        return
    }

    waitingForDoubleClick = true
    setTimeout(() => {
        waitingForDoubleClick = false
    }, DOUBLE_CLICK_DURATION)

    holdingBlock = findBlock(event.touches[0].clientX, event.touches[0].clientY)

    if (holdingBlock) {
        holdTimeoutId = setTimeout(() => { //Hold selection (This timeout can be canceled by touching up or touch dragging)
            select(holdingBlock)
            targetBlock = holdingBlock
            updateCanvas()
        }, HOLD_DURATION)
    }
}

function onTouchMove(event) {
    if (event.touches.length > 1) {
        return
    }

    clearTimeout(holdTimeoutId)

    if (!isDragging) {
        if (!selectedBlock && !holdingBlock) { // Move camera mode
            isDragging = true
            isBlockDragging = false
            updateCanvas()

            dragOffset.x = event.touches[0].clientX
            dragOffset.y = event.touches[0].clientY
        }

        if (!selectedBlock && holdingBlock) { // Move block mode
            isDragging = true
            isBlockDragging = true
            updateCanvas()

            const rect = holdingBlock.getBoundingClientRect()
            dragOffset.x = transform.x + event.touches[0].clientX - rect.x
            dragOffset.y = transform.y + event.touches[0].clientY - rect.y
        }

    }

    if (selectedBlock) { // Change target (used for "fake connections")
        targetBlock = findBlock(event.touches[0].clientX, event.touches[0].clientY)
        updateCanvas()
    }

    if (isDragging) {
        if (isBlockDragging) { // Move block
            holdingBlock.style.left = snapToGrid(event.touches[0].clientX - dragOffset.x) + 'px'
            holdingBlock.style.top = snapToGrid(event.touches[0].clientY - dragOffset.y) + 'px'
            updateCanvas()
            return
        }

        //Move camera
        transform.x += (event.touches[0].clientX - dragOffset.x)
        transform.y += (event.touches[0].clientY - dragOffset.y)

        translateTo(transform.x, transform.y)

        dragOffset.x = event.touches[0].clientX
        dragOffset.y = event.touches[0].clientY

        updateCanvas()
    }
}

function onTouchUp(event) {
    if (event.changedTouches.length > 1) {
        return
    }

    isDragging = false
    isBlockDragging = false
    targetBlock = null
    updateCanvas()

    if (holdingBlock) {
        holdingBlock = null

        const releasedBlock = findBlock(event.changedTouches[0].clientX, event.changedTouches[0].clientY)

        if (selectedBlock && !releasedBlock) { // Nothing (release on void)
            unselect()
            return
        }

        if (selectedBlock && releasedBlock) {
            if (selectedBlock == releasedBlock) { // Delete (Release at same block)
                unselect()
                deleteBlock(releasedBlock)
                updateCanvas()
                return
            }

            if (selectedBlock.connections.includes(releasedBlock)) { // Remove connection
                const releasedIndex = selectedBlock.connections.indexOf(releasedBlock)
                selectedBlock.connections.splice(releasedIndex, 1)
                unselect()
                updateCanvas()
                return
            }

            if (releasedBlock.connections.includes(selectedBlock)) { // Invert connnection
                const selectedIndex = releasedBlock.connections.indexOf(selectedBlock)
                releasedBlock.connections.splice(selectedIndex, 1)
                selectedBlock.connections.push(releasedBlock)
                unselect()
                updateCanvas()
                return
            }

            // Create connection
            selectedBlock.connections.push(releasedBlock)
            unselect()
            updateCanvas()
            return
        }
    }
}