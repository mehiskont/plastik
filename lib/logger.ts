import fs from "fs"
import path from "path"

const logDir = path.join(process.cwd(), "logs")

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

function getLogFile() {
  const date = new Date().toISOString().split("T")[0]
  return path.join(logDir, `${date}.log`)
}

export function log(message: string | any, details?: any, level: "info" | "error" | "warn" = "info") {
  const timestamp = new Date().toISOString();
  
  // Handle case where message is an object or error
  let logMessage = "";
  if (message === null) {
    logMessage = `[${timestamp}] [${level.toUpperCase()}] null\n`;
  } else if (typeof message === 'object') {
    if (message instanceof Error) {
      logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message.message}\n${message.stack || ''}\n`;
    } else {
      try {
        logMessage = `[${timestamp}] [${level.toUpperCase()}] ${JSON.stringify(message)}\n`;
      } catch (e) {
        logMessage = `[${timestamp}] [${level.toUpperCase()}] [Object cannot be stringified]\n`;
      }
    }
  } else {
    logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  }
  
  // If details are provided, append them
  if (details !== undefined) {
    if (details === null) {
      logMessage += `Details: null\n`;
    } else if (typeof details === 'object') {
      try {
        logMessage += `Details: ${JSON.stringify(details)}\n`;
      } catch (e) {
        logMessage += `Details: [Object cannot be stringified]\n`;
      }
    } else {
      logMessage += `Details: ${details}\n`;
    }
  }

  // Write to file
  try {
    fs.appendFileSync(getLogFile(), logMessage);
  } catch (err) {
    // Fallback to console if file write fails
    console.error("Failed to write to log file:", err);
  }

  // Also log to console in development with appropriate method
  if (process.env.NODE_ENV === "development") {
    switch (level) {
      case "error":
        console.error(message, details || '');
        break;
      case "warn":
        console.warn(message, details || '');
        break;
      default:
        console.log(message, details || '');
    }
  }
}

