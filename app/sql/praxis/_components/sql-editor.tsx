'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  EditorView, keymap,
  lineNumbers, highlightActiveLineGutter, highlightSpecialChars,
  drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine,
} from '@codemirror/view';
import { EditorState, Prec, Compartment } from '@codemirror/state';
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  indentUnit, indentOnInput, syntaxHighlighting, defaultHighlightStyle,
  bracketMatching, foldGutter, foldKeymap,
} from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { sql } from '@codemirror/lang-sql';
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
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
        ]),
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
          {
            key: 'Enter',
            run: (view) => {
              const { state } = view;
              const { from } = state.selection.main;
              const line = state.doc.lineAt(from);
              const indent = line.text.match(/^(\s*)/)?.[1] ?? '';
              view.dispatch({
                changes: { from, insert: '\n' + indent },
                selection: { anchor: from + 1 + indent.length },
              });
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
