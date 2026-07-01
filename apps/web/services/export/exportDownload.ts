export function triggerDownload(url: string, fileName: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()

    setTimeout(() => {
        a.remove()
        URL.revokeObjectURL(url)
    }, 100)
}

export function generateTxt(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, fileName)
}
