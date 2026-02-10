import React from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  boldStyle?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<TextStyle>;
};

type Token =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'highlight'; value: string };

function parseRichText(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const pushText = (value: string) => {
    if (!value) return;
    const last = tokens[tokens.length - 1];
    if (last?.type === 'text') {
      last.value += value;
    } else {
      tokens.push({ type: 'text', value });
    }
  };

  while (i < input.length) {
    // Highlight: **text**
    if (input[i] === '*' && input[i + 1] === '*') {
      const end = input.indexOf('**', i + 2);
      if (end !== -1) {
        const value = input.slice(i + 2, end);
        tokens.push({ type: 'highlight', value });
        i = end + 2;
        continue;
      }
    }

    // Bold: *text*
    if (input[i] === '*') {
      const end = input.indexOf('*', i + 1);
      if (end !== -1) {
        const value = input.slice(i + 1, end);
        tokens.push({ type: 'bold', value });
        i = end + 1;
        continue;
      }
    }

    pushText(input[i] ?? '');
    i += 1;
  }

  return tokens;
}

export default function RichText({ text, style, boldStyle, highlightStyle }: Props) {
  const tokens = React.useMemo(() => parseRichText(text), [text]);
  return (
    <Text style={style}>
      {tokens.map((t, idx) => {
        if (t.type === 'bold') {
          return (
            <Text key={idx} style={boldStyle}>
              {t.value}
            </Text>
          );
        }
        if (t.type === 'highlight') {
          return (
            <Text key={idx} style={highlightStyle}>
              {t.value}
            </Text>
          );
        }
        return <Text key={idx}>{t.value}</Text>;
      })}
    </Text>
  );
}

