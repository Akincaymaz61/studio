
'use client';

import React, { useCallback } from 'react';
import { useFormContext, useController } from 'react-hook-form';
import { Bold, Italic, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Quote } from '@/lib/schema';

// A simple toolbar for the rich text editor
const EditorToolbar = ({ editor }: { editor: HTMLDivElement | null }) => {
  const { setValue, getValues } = useFormContext<Quote>();

  const format = (command: string, value?: string) => {
    if (editor) {
      document.execCommand(command, false, value);
      editor.focus();
      setValue('notes', editor.innerHTML, { shouldDirty: true });
    }
  };

  const createList = () => {
    document.execCommand('insertUnorderedList', false, undefined);
    if(editor) {
        setValue('notes', editor.innerHTML, { shouldDirty: true });
    }
  };

  return (
    <div className="border border-b-0 rounded-t-md p-2 bg-muted/50 flex items-center gap-2">
      <Button type="button" size="sm" variant="outline" onMouseDown={(e) => { e.preventDefault(); format('bold'); }} className="h-8 w-8 p-0">
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" variant="outline" onMouseDown={(e) => { e.preventDefault(); format('italic'); }} className="h-8 w-8 p-0">
        <Italic className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" variant="outline" onMouseDown={(e) => { e.preventDefault(); createList(); }} className="h-8 w-8 p-0">
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};


// The rich text editor component
export const RichTextEditor = ({ name }: { name: keyof Quote }) => {
  const { control, setValue } = useFormContext<Quote>();
  const { field } = useController({ name, control });
  const editorRef = React.useRef<HTMLDivElement>(null);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    field.onChange(e.currentTarget.innerHTML);
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div>
      <EditorToolbar editor={editorRef.current} />
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={field.onBlur}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: field.value as string || '' }}
        className="min-h-[120px] w-full rounded-b-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      />
    </div>
  );
};
