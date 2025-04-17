"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

export default function EmailTestPage() {
  const [email, setEmail] = useState("")
  const [emailType, setEmailType] = useState("confirmation")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{success?: boolean; message?: string; error?: string}>({})
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to send the test email.",
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)
    setResult({})
    
    try {
      // First try the simple direct endpoint
      const simpleResponse = await fetch(`/api/email/send?to=${encodeURIComponent(email)}&subject=Test Email&text=This is a test email from Plastik Records.`)
      const simpleData = await simpleResponse.json()
      
      if (!simpleResponse.ok) {
        setResult({
          success: false,
          error: `Simple email test failed: ${simpleData.error || "Unknown error"}`
        })
        
        toast({
          title: "Basic Email Test Failed",
          description: "Something is wrong with your email configuration. Check server logs for details.",
          variant: "destructive",
        })
        
        setIsLoading(false)
        return
      }
      
      // Then try the template email
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          type: emailType,
        }),
      })
      
      const data = await response.json()
      
      setResult({
        success: response.ok,
        message: data.message,
        error: data.error,
      })
      
      if (response.ok) {
        toast({
          title: "Test Email Sent",
          description: data.message,
        })
      } else {
        toast({
          title: "Error Sending Template Email",
          description: data.error || "Failed to send test email with template.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred"
      })
      
      toast({
        title: "Request Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Email Testing Tool</CardTitle>
          <CardDescription>Send test emails to verify your email setup</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter recipient email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email Type</Label>
              <RadioGroup 
                value={emailType} 
                onValueChange={setEmailType}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="confirmation" id="confirmation" />
                  <Label htmlFor="confirmation">Order Confirmation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="simple" id="simple" />
                  <Label htmlFor="simple">Simple Direct Email</Label>
                </div>
              </RadioGroup>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Test Email"}
            </Button>
            
            {result.success === false && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Email Error</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}
            
            {result.success === true && (
              <Alert className="mt-4">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
            
            <div className="text-xs text-muted-foreground mt-4">
              <p>Having trouble sending emails?</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Check that your Resend API key is properly set</li>
                <li>Verify that the 'from' email domain is verified in Resend</li>
                <li>Check server logs for detailed error messages</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}