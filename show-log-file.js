const { join } = require('path')
const { existsSync, mkdirSync } = require('fs')

// Create logs directory in project root
const logDir = join(process.cwd(), 'logs')
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true })
}

// Create log file with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const logFile = join(logDir, `badge-debug-${timestamp}.log`)

console.log('=== BADGE DEBUG LOGGING SETUP ===')
console.log('Log directory:', logDir)
console.log('Log file will be created at:', logFile)
console.log('')
console.log('To view the log file in real-time, run:')
console.log(`tail -f "${logFile}"`)
console.log('')
console.log('Or to view the entire log file:')
console.log(`cat "${logFile}"`) 