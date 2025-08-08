import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

class Logger {
  private logFile: string
  private logDir: string

  constructor() {
    // Create logs directory in project root
    this.logDir = join(process.cwd(), 'logs')
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }
    
    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    this.logFile = join(this.logDir, `badge-debug-${timestamp}.log`)
    
    // Write header
    this.write('=== BADGE DEBUG LOG STARTED ===')
    this.write(`Timestamp: ${new Date().toISOString()}`)
    this.write('')
  }

  private write(message: string) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}`
    
    try {
      appendFileSync(this.logFile, logEntry + '\n')
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  log(category: string, data: any) {
    const message = `[${category}] ${JSON.stringify(data, null, 2)}`
    this.write(message)
    this.write('') // Empty line for readability
  }

  error(category: string, error: any) {
    const message = `[ERROR:${category}] ${error instanceof Error ? error.message : JSON.stringify(error)}`
    this.write(message)
    this.write('') // Empty line for readability
  }

  section(title: string) {
    this.write('')
    this.write(`=== ${title.toUpperCase()} ===`)
    this.write('')
  }

  getLogFilePath() {
    return this.logFile
  }
}

// Create singleton instance
const logger = new Logger()

export default logger 