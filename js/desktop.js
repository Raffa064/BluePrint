const commandKeys = {
    shift: false,
    control: false,
    alt: false,
    f: false
}

function onMouseDown(event) {
    if (commandKeys.control && !commandKeys.shift) {
        event.preventDefault()

        createBlock(event.x - transform.x, event.y - transform.y, state.globalId++)
        return
    }

    const clickedBlock = findBlock(event.x, event.y)

    if (commandKeys.control && commandKeys.shift) {
        if (clickedBlock) {
            deleteBlock(clickedBlock)

            updateCanvas()
        }
        return
    }

    if (clickedBlock && commandKeys.shift) {
        event.preventDefault()

        isDragging = true
        isBlockDragging = true

        const rect = getBlockRect(clickedBlock)
        dragOffset.x = transform.x + event.x - rect.x
        dragOffset.y = transform.y + event.y - rect.y

        select(clickedBlock)
        return
    }

    if (!clickedBlock && commandKeys.shift) {
        event.preventDefault()

        isDragging = true
        isBlockDragging = false

        dragOffset.x = event.x
        dragOffset.y = event.y
        return
    }

    if (commandKeys.alt) {
        if (!clickedBlock) {
            event.preventDefault()
            unselect()
            return
        }

        if (clickedBlock && !isConnecting) {
            event.preventDefault()

            isConnecting = true
            select(clickedBlock)
            return
        }

        if (isConnecting) {
            event.preventDefault()

            isConnecting = false

            if (clickedBlock) {
                if (clickedBlock === selectedBlock) {
                    unselect()
                    return
                }

                if (selectedBlock.connections.includes(clickedBlock)) { // Remove
                    selectedBlock.connections.splice(selectedBlock.connections.indexOf(clickedBlock), 1)
                    unselect()
                    updateCanvas()
                    return
                }

                if (clickedBlock.connections.includes(selectedBlock)) { // Invert
                    clickedBlock.connections.splice(clickedBlock.connections.indexOf(selectedBlock), 1)
                    selectedBlock.connections.push(clickedBlock)
                    unselect()
                    updateCanvas()
                    return
                }

                // Create
                selectedBlock.connections.push(clickedBlock)
                unselect()
                updateCanvas()
            }
        }
    }
}

function onMouseMove(event) {
    if (isDragging) {
        event.preventDefault()

        if (isBlockDragging) {
            selectedBlock.style.left = snapToGrid(event.x - dragOffset.x) + 'px'
            selectedBlock.style.top = snapToGrid(event.y - dragOffset.y) + 'px'
        } else {
            transform.x += (event.x - dragOffset.x)
            transform.y += (event.y - dragOffset.y)

            translateTo(transform.x, transform.y)

            dragOffset.x = event.x
            dragOffset.y = event.y
        }

        updateCanvas()
        return
    }
}

function onMouseUp() {
    if (isDragging) {
        event.preventDefault()
        isDragging = false
        if (isBlockDragging) {
            unselect()
        }
    }
}

function onKeyDown(event) {
    if (event.key == 'f' && commandKeys.control) {
        event.preventDefault()
    }

    const lowerCaseKey = event.key.toLowerCase()
    if (commandKeys[lowerCaseKey] !== undefined) {
        commandKeys[lowerCaseKey] = true
        updateCanvas()
    }
}

function onKeyUp(event) {
    if (event.key == 'f' && commandKeys.control) {
        event.preventDefault()
        toggleSearch()
    }

    const lowerCaseKey = event.key.toLowerCase()
    if (commandKeys[lowerCaseKey] !== undefined) {
        commandKeys[lowerCaseKey] = false
        updateCanvas()
    }
}

function renderDesktopKeys(x, y, lineHeight) {
    ctx.fillStyle = '#ccc'
    ctx.textAlign = 'center'
    ctx.fillText('Project: '+currentProject, x, lineHeight)
    
    var i = 1
    const drawKeyInfo = (label, _shift, _control, _alt, _f) => {
        const { shift, control, alt, f } = commandKeys
        const enabled = shift == _shift && control == _control && alt == _alt && _f == f
        ctx.fillStyle = enabled ? '#aaa' : '#777'
        ctx.textAlign = 'center'
        ctx.fillText(label, x, y + (i++ * lineHeight))
    }

    drawKeyInfo('Shift : Move', true, false, false, false)
    drawKeyInfo('Ctrl : Create', false, true, false, false)
    drawKeyInfo('Shift + Ctrl : Delete', true, true, false, false)
    drawKeyInfo('Ctrl + f : Toggle Search', false, true, false, true)
    drawKeyInfo('Alt : Connect', false, false, true, false)
}