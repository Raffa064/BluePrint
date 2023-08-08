const DOUBLE_CLICK_DURATION = 180
const HOLD_DURATION = 200

var waitingForDoubleClick = false
var holdTimeoutId
var holdingBlock // before selection
var targetBlock

function onTouchDown(event) {
    if (event.touches.length > 1) return
    
    if (waitingForDoubleClick) {
        //Double click
        waitingForDoubleClick = false
        createBlock(event.touches[0].clientX - transform.x, event.touches[0].clientY - transform.y, state.globalId++)
        return
    }

    waitingForDoubleClick = true
    setTimeout(() => {
        waitingForDoubleClick = false
    }, DOUBLE_CLICK_DURATION)

    holdingBlock = findBlock(event.touches[0].clientX, event.touches[0].clientY)
    holdTimeoutId = setTimeout(() => {
        if (holdingBlock) {
            select(holdingBlock)
            targetBlock = holdingBlock
            updateCanvas()
        }
    }, DOUBLE_CLICK_DURATION)
}

function onTouchMove(event) {
    if (event.touches.length > 1) return
    
    clearTimeout(holdTimeoutId)

    if (!isDragging) {
        if (!selectedBlock && !holdingBlock) {
            isDragging = true
            isBlockDragging = false
            updateCanvas()

            dragOffset.x = event.touches[0].clientX
            dragOffset.y = event.touches[0].clientY
        }

        if (!selectedBlock && holdingBlock) {
            isDragging = true
            isBlockDragging = true
            updateCanvas()

            const rect = getBlockRect(holdingBlock)
            dragOffset.x = transform.x + event.touches[0].clientX - rect.x
            dragOffset.y = transform.y + event.touches[0].clientY - rect.y
        }

    }
    
    if (selectedBlock) {
        targetBlock = findBlock(event.touches[0].clientX, event.touches[0].clientY)
        updateCanvas()
    }

    if (isDragging) {
        if (isBlockDragging) {
            holdingBlock.style.left = snapToGrid(event.touches[0].clientX - dragOffset.x) + 'px'
            holdingBlock.style.top = snapToGrid(event.touches[0].clientY - dragOffset.y) + 'px'
            updateCanvas()
            return
        }

        transform.x += (event.touches[0].clientX - dragOffset.x)
        transform.y += (event.touches[0].clientY - dragOffset.y)

        translateTo(transform.x, transform.y)

        dragOffset.x = event.touches[0].clientX
        dragOffset.y = event.touches[0].clientY
        updateCanvas()
    }
}

function onTouchUp(event) {
    if (event.changedTouches.length > 1) return
    
    isDragging = false
    targetBlock = null
    updateCanvas()

    if (holdingBlock) {
        holdingBlock = null

        if (isBlockDragging) {
            isBlockDragging = false
        }

        const endBlock = findBlock(event.changedTouches[0].clientX, event.changedTouches[0].clientY)

        if (selectedBlock && !endBlock) {
            unselect()
            return
        }

        if (selectedBlock && endBlock) {
            if (selectedBlock == endBlock) {
                unselect()
                deleteBlock(endBlock)
                updateCanvas()
                return
            }

            if (selectedBlock.connections.includes(endBlock)) { // Remove
                selectedBlock.connections.splice(selectedBlock.connections.indexOf(endBlock), 1)
                unselect()
                updateCanvas()
                return
            }

            if (endBlock.connections.includes(selectedBlock)) { // Invert
                endBlock.connections.splice(endBlock.connections.indexOf(selectedBlock), 1)
                selectedBlock.connections.push(endBlock)
                unselect()
                updateCanvas()
                return
            }

            // Create
            selectedBlock.connections.push(endBlock)
            unselect()
            updateCanvas()
            return
        }
    }
}

function renderMobileGestures(x, y, lineHeight) {
    const labels = [
        'Move : Drag',
        'Create : Double click',
        'Connect : Hold + drag to',
        'Delete : Hold',
    ]

    for (let i = 0; i < labels.length; i++) {
        ctx.fillStyle = '#777'
        ctx.textAlign = 'center'
        ctx.fillText(labels[i], x, y + (i * lineHeight))
    }
}