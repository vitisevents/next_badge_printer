// Client-side logging utility that sends data to server

class ClientLogger {
  private isEnabled = true
  private lastLogTime = 0
  private logCount = 0
  private maxLogsPerSecond = 10

  async log(category: string, data: any) {
    if (!this.isEnabled) return

    // Rate limiting to prevent infinite loops
    const now = Date.now()
    if (now - this.lastLogTime < 100) { // Only log once every 100ms
      return
    }
    
    this.logCount++
    if (this.logCount > this.maxLogsPerSecond) {
      return // Stop logging if too many logs
    }
    
    this.lastLogTime = now

    try {
      await fetch('/api/debug-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          data,
          type: 'log'
        })
      })
    } catch (error) {
      // Fallback to console if server logging fails
      console.log(`[${category}]`, data)
    }
  }

  async error(category: string, error: any) {
    if (!this.isEnabled) return

    try {
      await fetch('/api/debug-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          data: error,
          type: 'error'
        })
      })
    } catch (err) {
      // Fallback to console if server logging fails
      console.error(`[ERROR:${category}]`, error)
    }
  }

  async section(title: string) {
    if (!this.isEnabled) return

    try {
      await fetch('/api/debug-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'SECTION',
          data: title,
          type: 'log'
        })
      })
    } catch (error) {
      console.log(`=== ${title.toUpperCase()} ===`)
    }
  }

  disable() {
    this.isEnabled = false
  }

  enable() {
    this.isEnabled = true
    this.logCount = 0
    this.lastLogTime = 0
  }

  reset() {
    this.logCount = 0
    this.lastLogTime = 0
  }
}

// Create singleton instance
const clientLogger = new ClientLogger()

export default clientLogger 