import * as React from "react";
import {  ControllerProps, FieldPath, FieldValues } from "react-hook-form";
import {
  FormField as RHFFormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Pick<ControllerProps<TFieldValues, TName>, "control" | "name"> {
  label: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  textarea?: boolean;
  rows?: number;
  className?: string;
}

export function FormFieldText<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  autoComplete,
  inputMode,
  textarea = false,
  rows = 4,
  className,
}: Props<TFieldValues, TName>) {
  return (
    <RHFFormField
      control={control as any}
      name={name as any}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {textarea ? (
              <Textarea
                placeholder={placeholder}
                rows={rows}
                autoComplete={autoComplete}
                aria-required={true}
                {...field}
              />
            ) : (
              <Input
                type={type}
                placeholder={placeholder}
                autoComplete={autoComplete}
                inputMode={inputMode}
                aria-required={true}
                {...field}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default FormFieldText;
