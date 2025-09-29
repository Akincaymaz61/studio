"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import Image from 'next/image';

// Use a generic type for the form data to be more flexible
type FormData = {
  [key: string]: any;
};

// Accept the field name as a prop
type LogoUploaderProps = {
  logoFieldName: keyof FormData;
};

export function LogoUploader({ logoFieldName }: LogoUploaderProps) {
  const { setValue, watch } = useFormContext<FormData>();
  const logo = watch(logoFieldName as string);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue(logoFieldName as string, reader.result as string, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={logoFieldName as string}>Firma Logosu</Label>
      <div className="relative flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
        <Input
          id={logoFieldName as string}
          type="file"
          className="absolute w-full h-full opacity-0 cursor-pointer"
          accept="image/*"
          onChange={handleFileChange}
        />
        {logo ? (
          <Image src={logo} alt="Company Logo" layout="fill" objectFit="contain" className="p-2" />
        ) : (
          <div className="text-center text-muted-foreground">
            <Upload className="mx-auto h-8 w-8" />
            <p className="mt-2 text-sm">Logo yüklemek için tıklayın veya sürükleyin</p>
            <p className="text-xs">(max 2MB)</p>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => setValue(logoFieldName as string, '', { shouldDirty: true })} disabled={!logo}>Logoyu Kaldır</Button>
      </div>
    </div>
  );
}
