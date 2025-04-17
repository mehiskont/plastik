import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export function ApiUnavailable() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>API Unavailable</AlertTitle>
      <AlertDescription>
        We're currently unable to fetch data from our record database. This could be due to a temporary issue or
        maintenance. Please try again later or contact support if the problem persists.
      </AlertDescription>
    </Alert>
  )
}

