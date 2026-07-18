import type { Control, UseFormReturn } from 'react-hook-form';

/**
 * Props for the UI Layer (Dumb Components).
 * These components should only contain input fields.
 */
export interface BaseUIFormProps<T extends Record<string, unknown>> {
  /** The react-hook-form control object */
  control: Control<T>;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
}

/**
 * Props for the Bridge Layer (Drawers/Modals).
 * These components coordinate between the Page and the UI Layer.
 */
export interface BaseDrawerProps<T extends Record<string, unknown>> {
  /** The react-hook-form return object from useForm */
  form: UseFormReturn<T>;
  /** Whether the drawer/modal is visible */
  isOpen: boolean;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** Whether the form is in 'Edit' mode or 'Create' mode */
  isEditMode: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
  /** Callback to handle form submission */
  onSubmit: (data: T) => void;
}
