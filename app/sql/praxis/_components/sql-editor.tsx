'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { sql } from '@codemirror/lang-sql';
import { keymap } from '@codemirror/view';
import { Prec, Compartment } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';
import { indentWithTab } from '@codemirror/commands';
import { tal7aouy } from './theme-tal7aouy';

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
        ...tal7aouy,
        indentUnit.of('  '),
        Prec.highest(keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              onSubmitRef.current();
              return true;
            },
          },
          indentWithTab,
        ])),
        editableCompartment.current.of(EditorView.editable.of(true)),
        EditorView.theme({ '&': { height: '100%' } }),
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
