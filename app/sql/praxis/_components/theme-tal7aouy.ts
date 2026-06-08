import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';

// Colors pulled directly from Theme.json by Mhammed Talhaouy (tal7aouy.theme v3)
const BG            = '#282c34';
const FG            = '#abb2bf';
const LINE_HL       = '#2c313c';
const SELECTION     = '#67769660';
const CURSOR        = '#528bff';
const GUTTER_BG     = '#21252b';
const LINE_NUM      = '#495162';
const LINE_NUM_ACT  = '#abb2bf';
const BRACKET_MATCH = '#515a6b';
const INDENT_GUIDE  = '#3b4048';

// Token colors
const KEYWORD   = '#d55fde';   // keyword / keyword.control / storage
const STRING    = '#89ca78';   // string
const NUMBER    = '#d19a66';   // constant.numeric
const COMMENT   = '#7f848e';   // comment
const FUNCTION  = '#61afef';   // entity.name.function / support.function
const TYPE      = '#e5c07b';   // entity.name.type / support.class
const VARIABLE  = '#ef596f';   // variable
const OPERATOR  = '#2bbac5';   // keyword.operator.arithmetic / comparison
const PUNCT     = '#abb2bf';   // punctuation (same as foreground)

const editorTheme = EditorView.theme(
  {
    '&': {
      color: FG,
      backgroundColor: BG,
      height: '100%',
    },
    '.cm-content': {
      caretColor: CURSOR,
      padding: '12px 0',
      fontFamily: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '13px',
    },
    '.cm-focused': {
      outline: 'none',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: CURSOR,
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: SELECTION,
    },
    '.cm-selectionMatch': {
      backgroundColor: '#ffffff10',
      outline: `1px solid #dddddd40`,
    },
    '.cm-activeLine': {
      backgroundColor: LINE_HL,
    },
    '.cm-gutters': {
      backgroundColor: GUTTER_BG,
      color: LINE_NUM,
      border: 'none',
      borderRight: `1px solid ${INDENT_GUIDE}`,
    },
    '.cm-gutter.cm-lineNumbers': {
      minWidth: '3em',
    },
    '.cm-activeLineGutter': {
      backgroundColor: LINE_HL,
      color: LINE_NUM_ACT,
    },
    '.cm-matchingBracket': {
      backgroundColor: BRACKET_MATCH,
      outline: 'none',
    },
    '.cm-nonmatchingBracket': {
      backgroundColor: '#9A353D40',
    },
    '.cm-scroller': {
      overflow: 'auto',
    },
    '.cm-tooltip': {
      backgroundColor: '#21252b',
      border: `1px solid #181a1f`,
      color: FG,
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: '#2c313a',
    },
  },
  { dark: true }
);

const highlightStyle = HighlightStyle.define([
  { tag: t.keyword,                         color: KEYWORD },
  { tag: [t.controlKeyword, t.modifier],    color: KEYWORD },
  { tag: t.string,                          color: STRING },
  { tag: t.special(t.string),              color: STRING },
  { tag: [t.number, t.integer, t.float],   color: NUMBER },
  { tag: t.bool,                            color: NUMBER },
  { tag: t.null,                            color: NUMBER },
  { tag: t.comment,                         color: COMMENT, fontStyle: 'italic' },
  { tag: t.lineComment,                     color: COMMENT, fontStyle: 'italic' },
  { tag: t.blockComment,                    color: COMMENT, fontStyle: 'italic' },
  { tag: t.function(t.name),               color: FUNCTION },
  { tag: t.function(t.variableName),       color: FUNCTION },
  { tag: [t.typeName, t.className],         color: TYPE },
  { tag: t.variableName,                    color: VARIABLE },
  { tag: t.propertyName,                    color: VARIABLE },
  { tag: [t.operator, t.punctuation],       color: PUNCT },
  { tag: t.arithmeticOperator,              color: OPERATOR },
  { tag: t.compareOperator,                 color: OPERATOR },
  { tag: t.logicOperator,                   color: OPERATOR },
  { tag: t.bitwiseOperator,                 color: OPERATOR },
  { tag: t.name,                            color: FG },
  { tag: t.definition(t.name),             color: FUNCTION },
  { tag: t.escape,                          color: OPERATOR },
  { tag: t.invalid,                         color: '#ffffff', textDecoration: 'underline' },
]);

export const tal7aouy: Extension[] = [
  editorTheme,
  syntaxHighlighting(highlightStyle),
];
