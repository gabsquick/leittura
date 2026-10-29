// Capa de livro gerada (nunca thumbnail): título + cor sólida de lombada.
// Recriação fiel de Cover.dc.html.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, fonts } from '../theme';

type Size = 'lg' | 'sm';

type Props = {
  title: string;
  author: string;
  color: string;
  size?: Size;
  width?: number;
  height?: number;
  titleSize?: number;
};

export function BookCover({ title, author, color, size = 'lg', width, height, titleSize }: Props) {
  const big = size === 'lg';
  const w = width ?? (big ? 168 : 120);
  const h = height ?? (big ? 244 : 174);
  const tSize = titleSize ?? (big ? 25 : 17);
  const authorSize = big ? 14 : 11;
  const stampSize = big ? 9 : 7.5;
  const ruleW = big ? 34 : 24;
  const innerPad = big ? 18 : 13;
  const framePad = big ? 13 : 10;
  const frameInset = big ? 14 : 11;
  const topGap = big ? 14 : 10;
  const botGap = big ? 8 : 6;

  return (
    <View style={[styles.cover, { width: w, height: h, backgroundColor: color }]}>
      {/* lombada: gradiente vertical de 7px na borda esquerda */}
      <Svg width={7} height={h} style={styles.spine}>
        <Defs>
          <LinearGradient id="spine" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#000000" stopOpacity={0.28} />
            <Stop offset="0.6" stopColor="#000000" stopOpacity={0.05} />
            <Stop offset="1" stopColor="#ffffff" stopOpacity={0.1} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={7} height={h} fill="url(#spine)" />
      </Svg>
      {/* fio de 1px ao lado da lombada */}
      <View style={[styles.spineLine, { height: h }]} />

      {/* moldura interna */}
      <View
        style={[
          styles.frame,
          { top: frameInset, bottom: frameInset, left: framePad, right: framePad, padding: innerPad },
        ]}
      >
        <View style={{ gap: topGap }}>
          <View style={[styles.rule, { width: ruleW }]} />
          <Text style={[styles.title, { fontSize: tSize, lineHeight: tSize * 1.12 }]}>{title}</Text>
        </View>
        <View style={{ gap: botGap }}>
          <Text style={[styles.author, { fontSize: authorSize }]}>{author}</Text>
          <Text style={[styles.stamp, { fontSize: stampSize }]}>LEITTURA</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 3,
    overflow: 'hidden',
    // sombra de capa
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 6,
  },
  spine: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  spineLine: {
    position: 'absolute',
    top: 0,
    left: 7,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  frame: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 1,
    justifyContent: 'space-between',
  },
  rule: {
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  title: {
    fontFamily: fonts.serif,
    color: '#fdfcf9',
    letterSpacing: 0.1,
  },
  author: {
    fontFamily: fonts.serifItalic,
    color: 'rgba(253,252,249,0.78)',
  },
  stamp: {
    fontFamily: fonts.sansSemiBold,
    letterSpacing: 1.5,
    color: 'rgba(253,252,249,0.5)',
  },
});
