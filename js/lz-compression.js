function compress(input) {
    return LZUTF8.compress(input, {
        outputEncoding: 'StorageBinaryString'
    })
}

function decompress(input) {
    return LZUTF8.decompress(input, {
        inputEncoding: 'StorageBinaryString'
    })
}