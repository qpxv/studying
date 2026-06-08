'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { Compartment } from '@codemirror/state';

export interface SqlEditorHandle {
  getValue: () => string;
  clear: () => void;
  focus: () => void;
}

interface SqlEditorProps {
  onSubmit: () => void;
  disabled?: boolean;
}

const SqlEditor = forwardRef<SqlEditorHandle, SqlEditorProps>(({ onSubmit, disabled }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const editableCompartment = useRef(new Compartment());
  const onSubmitRef = useRef(onSubmit);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  });

  useImperativeHandle(ref, () => ({
    getValue: () => viewRef.current?.state.doc.toString() ?? '',
    clear: () => {
      if (!viewRef.current) return;
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: '' },
      });
    },
    focus: () => viewRef.current?.focus(),
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      parent: containerRef.current,
      extensions: [
        basicSetup,
        sql(),
        oneDark,
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              onSubmitRef.current();
              return true;
            },
          },
        ]),
        editableCompartment.current.of(EditorView.editable.of(true)),
        EditorView.theme({
          '&': { height: '100%', backgroundColor: '#282c34' },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '13px',
          },
          '.cm-content': { padding: '12px 0' },
          '.cm-focused': { outline: 'none' },
        }),
      ],
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: editableCompartment.current.reconfigure(
        EditorView.editable.of(!disabled)
      ),
    });
  }, [disabled]);

  return <div ref={containerRef} className="h-full" />;
});

SqlEditor.displayName = 'SqlEditor';

export default SqlEditor;
