import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Chip } from './Chip';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(1, 'Description is required').max(2000),
  logo: z.string().optional(),
  metadata: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface OfferingSettingsGeneralTabProps {
  initialData: FormData;
  onSave: (data: FormData) => void;
}

export const OfferingSettingsGeneralTab: React.FC<OfferingSettingsGeneralTabProps> = ({
  initialData,
  onSave,
}) => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { isDirty, errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  const [previewData, setPreviewData] = useState<FormData>(initialData);
  const formData = watch();

  useEffect(() => {
    const handler = setTimeout(() => {
      setPreviewData(formData);
    }, 300);

    return () => clearTimeout(handler);
  }, [formData]);

  const handleSave = (data: FormData) => {
    onSave(data);
    reset(data);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(handleSave)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <fieldset className="space-y-6">
          <legend className="text-lg font-semibold mb-4 flex items-center gap-2">
            General Information
            {isDirty && <Chip label="Unsaved changes" />}
          </legend>
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">Offering Name</label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="name"
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className="w-full p-2 border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              )}
            />
            {errors.name && <p id="name-error" className="text-red-400 text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium">Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="description"
                  rows={4}
                  aria-describedby={errors.description ? "description-error" : undefined}
                  className="w-full p-2 border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              )}
            />
            {errors.description && <p id="description-error" className="text-red-400 text-xs">{errors.description.message}</p>}
          </div>
        </fieldset>

        <fieldset className="space-y-6">
          <legend className="text-lg font-semibold mb-4">Metadata</legend>
          <div className="space-y-2">
            <label htmlFor="metadata" className="block text-sm font-medium">Public Metadata</label>
            <Controller
              name="metadata"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="metadata"
                  className="w-full p-2 border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              )}
            />
          </div>
        </fieldset>

        <aside className="glass-card p-6" aria-label="Live Preview">
          <h3 className="text-sm font-medium mb-4 text-muted uppercase tracking-wider">Live Preview</h3>
          <div className="border border-slate-700 rounded-lg p-4 bg-slate-800">
            <h4 className="text-lg font-bold">{previewData.name || 'Offering Name'}</h4>
            <p className="text-sm text-muted mt-2">{previewData.description || 'Description will appear here...'}</p>
            {previewData.metadata && <p className="text-xs text-accent mt-2">{previewData.metadata}</p>}
          </div>
        </aside>
      </form>

      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950 border-t border-slate-700 flex justify-end gap-4 shadow-lg z-50">
          <button type="button" onClick={() => reset(initialData)} className="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
            Discard
          </button>
          <button type="submit" onClick={handleSubmit(handleSave)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};
