export function log(message: string | any, details?: any, level: "info" | "error" | "warn" = "info") {
  const timestamp = new Date().toISOString();
  
  // Handle case where message is an object or error
  let logMessage = "";
  if (message === null) {
    logMessage = `[${timestamp}] [${level.toUpperCase()}] null`;
  } else if (typeof message === 'object') {
    if (message instanceof Error) {
      logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message.message}\n${message.stack || ''}`;
    } else {
      try {
        logMessage = `[${timestamp}] [${level.toUpperCase()}] ${JSON.stringify(message)}`;
      } catch (e) {
        logMessage = `[${timestamp}] [${level.toUpperCase()}] [Object cannot be stringified]`;
      }
    }
  } else {
    logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }
  
  // If details are provided, append them
  if (details !== undefined) {
    if (details === null) {
      logMessage += ` Details: null`;
    } else if (typeof details === 'object') {
      try {
        logMessage += ` Details: ${JSON.stringify(details)}`;
      } catch (e) {
        logMessage += ` Details: [Object cannot be stringified]`;
      }
    } else {
      logMessage += ` Details: ${details}`;
    }
  }

  // Always log in all environments for critical functionality like cart persistence
  // This ensures we can debug cart issues in production
  switch (level) {
    case "error":
      console.error(logMessage);
      break;
    case "warn":
      console.warn(logMessage);
      break;
    default:
      console.log(logMessage);
  }
}

