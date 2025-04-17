"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import Select from "react-select"
import countryList from "react-select-country-list"
import { useSession } from "next-auth/react"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().or(z.literal('')), // Allow empty string
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().optional().or(z.literal('')), // Allow empty string
  country: z.string().min(2, "Country must be at least 2 characters"),
  postalCode: z.string().min(2, "Postal code must be at least 2 characters"),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileFormProps {
  initialData: ProfileFormValues
}

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(8, "Current password must be at least 8 characters"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

// Password change form component
function PasswordChangeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });
  
  const onSubmitPassword = async (data: PasswordFormValues) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to change password");
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
      
      // Reset the form
      passwordForm.reset();
      
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was a problem changing your password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Only show for users who can use password authentication
  if (!session?.user.email) return null;
  
  return (
    <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
      <h3 className="text-lg font-medium">Change Password</h3>
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input 
          id="currentPassword" 
          type="password"
          {...passwordForm.register("currentPassword")} 
        />
        {passwordForm.formState.errors.currentPassword && (
          <p className="text-sm text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input 
          id="newPassword" 
          type="password"
          {...passwordForm.register("newPassword")} 
        />
        {passwordForm.formState.errors.newPassword && (
          <p className="text-sm text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input 
          id="confirmPassword" 
          type="password"
          {...passwordForm.register("confirmPassword")} 
        />
        {passwordForm.formState.errors.confirmPassword && (
          <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Updating..." : "Change Password"}
      </Button>
    </form>
  );
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()
  
  // Country options for the Select component
  const countryOptions = useMemo(() => countryList().getData(), [])
  
  // Custom styles for the Select component to match theme
  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: "var(--background)",
      borderColor: "var(--border)",
      height: "40px",
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: "var(--background)",
    }),
    option: (provided: any, state: { isSelected: any; isFocused: any }) => ({
      ...provided,
      backgroundColor: state.isSelected ? "var(--primary)" : state.isFocused ? "var(--accent)" : "transparent",
      color: state.isSelected ? "var(--primary-foreground)" : "var(--foreground)",
    }),
  }

  // Log the initial data to debug
  useEffect(() => {
    console.log("ProfileForm initialData:", initialData);
  }, [initialData]);

  // Set up the form with React Hook Form
  // defaultValues is not enough; we need to add values prop too
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
    values: initialData,
  });
  
  // Manually update form whenever initialData changes
  useEffect(() => {
    if (initialData) {
      console.log("Updating form with data:", initialData);
      
      // Reset the form with new values
      form.reset({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        country: initialData.country || '',
        postalCode: initialData.postalCode || '',
      });
      
      // Log form values after update
      console.log("Form values after reset:", form.getValues());
      
      // Set each field directly to handle any edge cases
      Object.keys(initialData).forEach(key => {
        if (initialData[key as keyof ProfileFormValues] !== undefined) {
          form.setValue(key as keyof ProfileFormValues, initialData[key as keyof ProfileFormValues] as string);
        }
      });
      
      console.log("Form values after setting fields:", form.getValues());
    }
  }, [initialData, form]);

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })

      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "There was a problem updating your profile.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-12">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <h3 className="text-lg font-medium">Profile Information</h3>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input 
            id="name" 
            defaultValue={initialData.name}
            {...form.register("name")} 
          />
          {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            defaultValue={initialData.email}
            {...form.register("email")} 
          />
          {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input 
            id="phone" 
            type="tel" 
            defaultValue={initialData.phone || ''}
            {...form.register("phone")} 
          />
          {form.formState.errors.phone && <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input 
            id="address" 
            defaultValue={initialData.address}
            {...form.register("address")} 
          />
          {form.formState.errors.address && (
            <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input 
            id="city" 
            defaultValue={initialData.city}
            {...form.register("city")} 
          />
          {form.formState.errors.city && <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State/Province</Label>
          <Input 
            id="state" 
            defaultValue={initialData.state || ''}
            {...form.register("state")} 
          />
          {form.formState.errors.state && <p className="text-sm text-red-500">{form.formState.errors.state.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Controller
            name="country"
            control={form.control}
            render={({ field }) => (
              <Select
                inputId="country"
                options={countryOptions}
                value={countryOptions.find((option) => option.value === field.value)}
                onChange={(option) => field.onChange(option ? option.value : '')}
                styles={customStyles}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            )}
          />
          {form.formState.errors.country && (
            <p className="text-sm text-red-500">{form.formState.errors.country.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input 
            id="postalCode" 
            defaultValue={initialData.postalCode}
            {...form.register("postalCode")} 
          />
          {form.formState.errors.postalCode && (
            <p className="text-sm text-red-500">{form.formState.errors.postalCode.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Profile"}
        </Button>
      </form>
      
      {/* Separator between profile and password forms */}
      <Separator className="my-8" />
      
      {/* Password Change Section */}
      <PasswordChangeForm />
    </div>
  )
}

