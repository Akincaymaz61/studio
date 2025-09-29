
'use client';

import React, { useRef, useEffect } from 'react';
import { useFormContext, useController } from 'react-hook-form';
import { Bold, Italic, List, Underline, AlignLeft, AlignCenter, AlignRight, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Quote } from '@/lib/schema';

// A simple toolbar for the rich text editor
const EditorToolbar = ({ editor, onFormat }: { editor: HTMLDivElement | null, onFormat: () => void }) => {

  const format = (command: string, value?: string) => {
    if (editor) {
      document.execCommand(command, false, value);
      onFormat();
      editor.focus();
    }
  };

  const createList = () => {
    format('insertUnorderedList');
  };

  return (
    <div className="border border-b-0 rounded-t-md p-2 bg-muted/50 flex flex-wrap items-center gap-1">
      <Button type="button" size="sm" variant="outline" onMouseDown={(e) => { e.preventDefault(); format('bold'); }} className="h-8 w-8 p-0">
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" variant="outline" onMouseDown={(e) => { e.preventDefault(); format('italic'); }} className="h-8 w-8 p-0">
        <Italic className="h-4 w-4" />
      </Button>
       <Button type="button" size="sm" variant="outline" onMouseDown={(e) => { e.preventDefault(); format('underline'); }} className="h-8 w-8 p-0">
        <Underline className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" variant="outline" onMouseDown={(e) => { e.preventDefault(); createList(); }} className="h-8 w-8 p-0">
        <List className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Button type="button" size="sm" variant="outline" onMouseDown={(e) => { e.preventDefault(); format('justifyLeft'); }} className="h-8 w-8 p-0">
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" variant="outline" onMouseDown={(e) => { e.preventDefault(); format('justifyCenter'); }} className="h-8 w-8 p-0">
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" variant="outline" onMouseDown={(e) => { e.preventDefault(); format('justifyRight'); }} className="h-8 w-8 p-0">
        <AlignRight className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Button type="button" size="sm" variant="outline" onMouseDown={(e) => { e.preventDefault(); format('removeFormat'); }} className="h-8 w-8 p-0">
        <Eraser className="h-4 w-4" />
      </Button>
    </div>
  );
};


// The rich text editor component
export const RichTextEditor = ({ name }: { name: keyof Quote }) => {
  const { control } = useFormContext<Quote>();
  const { field } = useController({ name, control });
  const editorRef = useRef<HTMLDivElement>(null);

  // Set the initial content when the component mounts or the value changes externally
  useEffect(() => {
    if (editorRef.current && field.value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = field.value as string || '';
    }
  }, [field.value]);

  const updateFieldValue = () => {
    if (editorRef.current) {
      field.onChange(editorRef.current.innerHTML);
    }
  };

  const handleBlur = () => {
    updateFieldValue();
    field.onBlur();
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateFieldValue();
  };

  return (
    <div>
      <EditorToolbar editor={editorRef.current} onFormat={updateFieldValue} />
      <div
        ref={editorRef}
        contentEditable
        onBlur={handleBlur}
        onPaste={handlePaste}
        className="min-h-[120px] w-full rounded-b-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      />
    </div>
  );
};
