import { defaultSettings } from './default-settings.js';
import { Styler } from './styler';

export const clientStorageKey = 'cachedSettings';

export class Config {
  // 通用设置
  addPrevToDescription: boolean;
  framesPerSection: number;
  textsPerSection: number;
  notificationTimeout: number;
  updateUsingLocalStyles: boolean;
  partialMatch: boolean;
  reverseLayers: boolean;

  // 样式器
  texter: Styler;
  grider: Styler;
  filler: Styler;
  strokeer: Styler;
  effecter: Styler;
  allStylers: Styler[];
  stylersWithoutTexter: Styler[];
  texterOnly: Styler[];

  constructor(options = defaultSettings) {
    const {
      // 通用设置
      addPrevToDescription = defaultSettings.addPrevToDescription,
      framesPerSection = defaultSettings.framesPerSection,
      textsPerSection = defaultSettings.textsPerSection,
      notificationTimeout = defaultSettings.notificationTimeout,
      updateUsingLocalStyles = defaultSettings.updateUsingLocalStyles,
      partialMatch = defaultSettings.partialMatch,
      reverseLayers = defaultSettings.reverseLayers,

      // 样式器
      texterPrefix = defaultSettings.texterPrefix,
      texterSuffix = defaultSettings.texterSuffix,
      griderPrefix = defaultSettings.griderPrefix,
      griderSuffix = defaultSettings.griderSuffix,
      fillerPrefix = defaultSettings.fillerPrefix,
      fillerSuffix = defaultSettings.fillerSuffix,
      strokeerPrefix = defaultSettings.strokeerPrefix,
      strokeerSuffix = defaultSettings.strokeerSuffix,
      effecterPrefix = defaultSettings.effecterPrefix,
      effecterSuffix = defaultSettings.effecterSuffix,
    } = options;

    this.addPrevToDescription = addPrevToDescription;
    this.framesPerSection = framesPerSection;
    this.textsPerSection = textsPerSection;
    this.notificationTimeout = notificationTimeout;
    this.updateUsingLocalStyles = updateUsingLocalStyles;
    this.partialMatch = partialMatch;
    this.reverseLayers = reverseLayers;

    this.texter = new Styler({
      name: 'texter',
      styleType: 'text',
      styleProps: [
        'fontName',
        'fontSize',
        'letterSpacing',
        'lineHeight',
        'paragraphIndent',
        'paragraphSpacing',
        'textCase',
        'textDecoration',
        // 自 types 1.62.0 起添加
        'leadingTrim',
        'listSpacing',
        'hangingPunctuation',
        'hangingList',
      ],
      prefix: texterPrefix,
      suffix: texterSuffix,
    });
    this.grider = new Styler({
      name: 'grider',
      styleType: 'grid',
      styleProps: ['layoutGrids'],
      prefix: griderPrefix,
      suffix: griderSuffix,
    });
    this.filler = new Styler({
      name: 'filler',
      styleType: 'paint',
      styleProps: ['paints'],
      layerProps: ['fills'],
      layerPropType: 'fill',
      prefix: fillerPrefix,
      suffix: fillerSuffix,
    });
    this.strokeer = new Styler({
      name: 'strokeer',
      styleType: 'paint',
      styleProps: ['paints'],
      layerProps: ['strokes'],
      layerPropType: 'stroke',
      prefix: strokeerPrefix,
      suffix: strokeerSuffix,
    });
    this.effecter = new Styler({
      name: 'effecter',
      styleType: 'effect',
      styleProps: ['effects'],
      prefix: effecterPrefix,
      suffix: effecterSuffix,
    });

    this.allStylers = [this.texter, this.filler, this.strokeer, this.effecter, this.grider];
    this.stylersWithoutTexter = [this.filler, this.strokeer, this.effecter, this.grider];
    this.texterOnly = [this.texter];
  }
}
