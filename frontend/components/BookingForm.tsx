import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import FormFieldText from "@/components/ui/form-field-text";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PatientInfo } from "@/lib/api";
import { Loader2 } from "lucide-react";

const phoneRegex =
  /^(?:\+?1\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .regex(simpleEmailRegex, "Invalid email address"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(phoneRegex, "Invalid phone number format"),
  reason: z.string().min(1, "Reason for visit is required"),
});

type BookingFormValues = z.infer<typeof formSchema>;

interface BookingFormProps {
  onSubmit: (patient: PatientInfo, reason: string) => Promise<void>;
  onBack: () => void;
}

export function BookingForm({ onSubmit, onBack }: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(formSchema),
    // validate as the user types so email (and other fields) show inline errors immediately
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      reason: "",
    },
  });

  const handleSubmit = async (values: BookingFormValues) => {
    setLoading(true);
    try {
      const patient: PatientInfo = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        // normalize email to lowercase before sending
        email: values.email.trim().toLowerCase(),
        // Normalize phone to digits-only with leading '1' when sending to backend
        phone: normalizePhoneForSend(values.phone.trim()),
      };
      await onSubmit(patient, values.reason.trim());
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format helpers used for the phone input display
  function formatPhoneDisplay(input?: string) {
    const digits = (input || "").replace(/\D/g, "");
    if (!digits) return "";
    let country = "";
    let rest = digits;
    if (digits.startsWith("1")) {
      country = "1";
      rest = digits.slice(1);
    }

    const area = rest.slice(0, 3);
    const prefix = rest.slice(3, 6);
    const line = rest.slice(6, 10);

    let out = "";
    if (country) out += country + " ";
    if (area) {
      out += "(" + area;
      if (area.length === 3) out += ")";
    }
    if (prefix) out += (area.length === 3 ? " " : " ") + prefix;
    if (line) out += " " + line;
    return out.trim();
  }

  function normalizePhoneForSend(formatted?: string) {
    const digits = (formatted || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 10) return `1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return digits;
    // Fallback: return digits as-is
    return digits;
  }

  return (
    <Form {...form}>
      <form aria-busy={loading} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" aria-label="Booking form">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormFieldText control={form.control} name="first_name" label="First Name" placeholder="John" autoComplete="given-name" />
          <FormFieldText control={form.control} name="last_name" label="Last Name" placeholder="Doe" autoComplete="family-name" />
        </div>

        <FormFieldText control={form.control} name="email" label="Email" placeholder="john.doe@example.com" autoComplete="email" inputMode="email" type="email" />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="1 (555) 555-0123"
                  autoComplete="tel"
                  inputMode="tel"
                  aria-required={true}
                  value={formatPhoneDisplay(field.value)}
                  onChange={(e) => {
                    const input = e.target.value;
                    const formatted = formatPhoneDisplay(input);
                    field.onChange(formatted);
                  }}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Visit</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please describe the reason for your visit..."
                  rows={4}
                  autoComplete="off"
                  aria-required={true}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 rounded-full"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={loading || !form.formState.isValid}
            className="flex-1 rounded-full font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
