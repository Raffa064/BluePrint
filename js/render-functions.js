function renderCircle(x, y, radius, color) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * PI)
    ctx.fillStyle = color
    ctx.fill()
}

function renderConnection(from, to, fake) {
    const canvasRect = canvas.getBoundingClientRect()

    // Center positions (from/to)
    const x1 = from.offsetLeft + from.offsetWidth / 2
    const y1 = from.offsetTop + from.offsetHeight / 2
    const x2 = to.offsetLeft + to.offsetWidth / 2
    const y2 = to.offsetTop + to.offsetHeight / 2

    // Distance between from and to
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dst = sqrt(dx ** 2 + dy ** 2) // Euclidian distance (mag)

    // Connection line start/end positions
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

    renderCircle(transform.x + fromX, transform.y + fromY, 8, fake ? '#08fa' : '#08f')
    renderCircle(transform.x + toX, transform.y + toY, 5, fake ? '#f80a' : '#f80')
}

function renderBackground() {
    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, viewport.width, viewport.height)
}

function renderGuide() {
    // Screen bounds on (0,0)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 3
    ctx.rect(transform.x, transform.y, viewport.width - 1.5, viewport.height - 1.5)
    ctx.stroke()

    const displacement = (x) => x / grid - floor(x / grid)
    for (let x = displacement(transform.x); x < viewport.width / grid; x++) {
        for (let y = displacement(transform.y); y < viewport.height / grid; y++) {
            renderCircle(x * grid, y * grid, 1, "#666")
        }
    }
}

function renderMobileGestures(x, y, lineHeight) {
    const labels = [
        [currentProject, '#aaa'],
        ['Move : Drag', '#777'],
        ['Create : Double click', '#777'],
        ['Connect : Hold + drag to', '#777'],
        ['Delete : Hold', '#777']
    ]

    for (let i = 0; i < labels.length; i++) {
        const [labelText, labelColor] = labels[i]

        ctx.fillStyle = labelColor
        ctx.textAlign = 'center'
        ctx.fillText(labelText, x, y + (i * lineHeight))
    }
}

function renderDesktopKeys(x, y, lineHeight) {
    const labels = [
        ['Shift : Move', true, false, false, false],
        ['Ctrl : Create', false, true, false, false],
        ['Shift + Ctrl : Delete', true, true, false, false],
        ['Ctrl + f : Toggle Search', false, true, false, true],
        ['Alt : Connect', false, false, true, false]
    ]

    ctx.fillStyle = '#ccc'
    ctx.textAlign = 'center'
    ctx.fillText(currentProject, x, lineHeight)

    for (let i = 0; i < labels.length; i++) {
        const { shift, control, alt, f } = commandKeys
        const [label, _shift, _control, _alt, _f] = labels[i]

        const enabled = shift == _shift && control == _control && alt == _alt && f == _f

        ctx.fillStyle = enabled ? '#aaa' : '#777'
        ctx.textAlign = 'center'
        ctx.fillText(label, x, y + ((i + 1) * lineHeight))
    }
}

function renderHUD(fontSize) {
    const lineHeight = fontSize * 1.3
    ctx.font = fontSize + 'px Helvetica'
    ctx.fillStyle = '#aaa'

    const posX = (-transform.x + viewport.width / 2).toFixed(2)
    const posY = (transform.y + viewport.height / 2).toFixed(2)

    ctx.textAlign = 'left'
    ctx.fillText('[ ' + posX + ', ' + posY + ' ]', lineHeight, lineHeight)

    ctx.textAlign = 'right'
    ctx.fillText('Blocks: ' + container.children.length, viewport.width - lineHeight, lineHeight)

    const x = viewport.width / 2
    const y = lineHeight

    if (isMobile.any) {
        renderMobileGestures(x, y, lineHeight)
        return
    }
    
    renderDesktopKeys(x, y, lineHeight)
}