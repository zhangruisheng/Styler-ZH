import {
  allStylers,
  CMD,
  colors,
  counter,
  effecter,
  filler,
  framesPerContainer,
  grider,
  notificationTimeout,
  strokeer,
  stylersWithoutTexter,
  texter,
} from './globals';
import { changeColor, cleanSelection, createFrameLayer, createTextLayer, ungroupToCanvas } from './layers';
import { addAffixTo, chunk, figmaNotifyAndClose, groupBy, isArrayEmpty, ucFirst, uniq } from './utils';

interface StylerOptions {
  name?: string;
  styleType?: string;
  styleProps?: string[];
  layerProps?: string[];
  layerPropType?: string;
  prefix?: string;
  suffix?: string;
}

export class Styler {
  name: string;
  styleType: string;
  styleProps: string[];
  layerProps: string[];
  layerPropType: string;
  layerStyleID: string;
  prefix: string;
  suffix: string;

  constructor(options: StylerOptions = {}) {
    const {
      name = 'styler',
      styleType = '',
      layerPropType = styleType,
      prefix = '',
      suffix = '',
      styleProps,
      layerProps,
    } = options;

    this.name = name;
    this.styleType = styleType.toLocaleUpperCase();
    this.styleProps = styleProps || layerProps;
    this.layerProps = layerProps || styleProps;
    this.layerPropType = layerPropType.toLocaleUpperCase();
    this.layerStyleID = addAffixTo(layerPropType.toLocaleLowerCase(), '', 'StyleId');
    this.prefix = prefix;
    this.suffix = suffix;
  }

  applyStyle = (layer: SceneNode, style: BaseStyle) => {
    if (!style || layer[this.layerStyleID] === undefined) {
      console.log(`Apply: ${this.layerStyleID} not found || No style found for ${layer.name}`);
      return;
    }

    layer[this.layerStyleID] = style.id;
    counter.applied++;
  };

  createStyle = (layer: SceneNode) => {
    const newStyle = figma[addAffixTo(ucFirst(this.styleType), 'create', 'Style')]();

    this.renameStyle(layer, newStyle);
    this.updateStyle(layer, newStyle);

    return newStyle;
  };

  detachStyle = (layer) => {
    if (!layer[this.layerStyleID]) {
      console.log(`Detach: ${this.layerPropType} not found.`);
      return;
    }

    layer[this.layerStyleID] = '';
    counter.detached++;
  };

  getLocalStyles = () => {
    const getCommand = addAffixTo(ucFirst(this.styleType), 'getLocal', 'Styles');
    return figma[getCommand]();
  };

  getStyleById = (layer) => figma.getStyleById(layer[this.layerStyleID]);

  getStyleByName = (name) => {
    const stylesByType = this.getLocalStyles();
    return stylesByType.find((style) => style.name === addAffixTo(name, this.prefix, this.suffix));
  };

  changeStyleDescription = (layer: SceneNode, style: BaseStyle) => {
    const idMatch = this.getStyleById(layer);
    let previousName;
    !idMatch ? (previousName = '') : (previousName = idMatch.name);

    return (style.description = `Previous named style:\n${previousName}`);
  };

  renameStyle = (layer: SceneNode, style: BaseStyle) => {
    if (!style) {
      console.log(`Rename: No style found for ${layer.name}`);
      return;
    }

    style.name = addAffixTo(layer.name, this.prefix, this.suffix);
  };

  updateStyle = (layer: SceneNode, style: BaseStyle) => {
    this.changeStyleDescription(layer, style);

    this.detachStyle(layer);
    this.styleProps.map((prop, index) => {
      if (!style || layer[this.layerProps[index]] === undefined) {
        console.log(`Update: ${this.layerProps[index]} not found || No style found for ${layer.name}`);
        return;
      }

      style[prop] = layer[this.layerProps[index]];
    });
    this.applyStyle(layer, style);
  };

  removeStyle = (style: BaseStyle) => {
    if (!style) {
      return;
    }

    const cmdType = CMD.split('-')[1];
    if (cmdType === this.layerPropType.toLocaleLowerCase() || cmdType === 'all') {
      style.remove();
      counter.removed++;
    }
  };

  generateStyle = (layer: SceneNode, { nameMatch, idMatch }: any = {}) => {
    if (this.isPropMixed(layer) || this.isPropEmpty(layer)) {
      console.log(`Generate: We have some mixed or empty props.`);
      return;
    }

    if (!idMatch && !nameMatch) {
      this.createStyle(layer);
      counter.created++;
    } else if (idMatch && !nameMatch) {
      this.renameStyle(layer, idMatch);
      counter.renamed++;
    } else if (idMatch !== nameMatch) {
      this.updateStyle(layer, nameMatch);
      counter.updated++;
    } else {
      counter.ignored++;
    }
    counter.generated++;
  };

  isPropEmpty = (layer: SceneNode) => isArrayEmpty(layer[this.layerProps[0]]);
  isPropMixed = (layer: SceneNode) => this.layerProps.some((prop) => layer[prop] === figma.mixed);
}

export const showMessage = (counter, messages: any = {}) => {
  const { empty = '', single = '', multiple = '' } = messages;

  if (counter === 0) {
    figmaNotifyAndClose(empty, notificationTimeout);
  } else if (counter === 1) {
    figmaNotifyAndClose(single, notificationTimeout);
  } else {
    figmaNotifyAndClose(multiple, notificationTimeout);
  }
};

export const showNofication = () => {
  const generateMessage = `
    🔨 Created: ${counter.created} -
    ✨ Updated: ${counter.updated} -
    🌈 Renamed: ${counter.renamed} -
    😶 No changes: ${counter.ignored}
  `;

  const messages = {
    applied: {
      empty: `🤔 There is no style that has this layer name. Maybe? Renam...`,
      single: `✌️ Applied only ${counter.applied} style. He he...`,
      multiple: `✌️ Applied ${counter.applied} styles. He he...`,
    },
    detached: {
      empty: `🤔 No style was applied on any of the selected layers. Idk...`,
      single: `💔 Detached only ${counter.detached} style. Layers will miss you...`,
      multiple: `💔 Detached ${counter.detached} styles. Layers will miss you...`,
    },
    extracted: {
      empty: `😵 There is no style in this file. Ouch...`,
      single: `😺 Created only ${counter.extracted} layer. Uhuu...`,
      multiple: `😺 Created ${counter.extracted} layers. Uhuu...`,
    },
    generated: {
      empty: `😭 We do not support empty or mixed properties. Oh, Noo...`,
      single: generateMessage,
      multiple: generateMessage,
    },
    removed: {
      empty: `🤔 No style was applied on any of the selected layers. Yep, it's not weird...`,
      single: `🔥 Removed only ${counter.removed} style. Rrr...`,
      multiple: `🔥 Removed ${counter.removed} styles. Rrr...`,
    },
  };

  if (CMD === 'extract-all-styles') {
    showMessage(counter.extracted, messages.extracted);
  } else if (CMD === 'generate-all-styles') {
    showMessage(counter.generated, messages.generated);
  } else if (CMD === 'apply-all-styles') {
    showMessage(counter.applied, messages.applied);
  } else if (CMD === 'detach-all-styles') {
    showMessage(counter.detached, messages.detached);
  } else if (CMD.includes('remove')) {
    showMessage(counter.removed, messages.removed);
  }
};

export const getUniqueStylesName = (styles: BaseStyle[]) => {
  const names = styles.map((style) => style.name);
  const affixes = allStylers
    .map((styler) => [styler.prefix, styler.suffix])
    .flat()
    .filter(Boolean)
    .join('|');

  const regexAffixes = new RegExp('\\b(?:' + affixes + ')\\b', 'g');
  const namesWithoutAffixes = names.map((style) => style.replace(regexAffixes, ''));

  return uniq(namesWithoutAffixes) as string[];
};

export const getStylersByLayerType = (layer: SceneNode): Styler[] => {
  return layer.type === 'TEXT' ? [texter] : [filler, strokeer, effecter, grider];
};

export const getStyleguides = (styles) => {
  const uniqueStylesNames = getUniqueStylesName(styles);

  return uniqueStylesNames.map((name) => {
    const nameMatch = texter.getStyleByName(name);
    const type = !nameMatch ? 'FRAME' : 'TEXT';

    return {
      name,
      type,
    };
  });
};

export const changeAllStyles = async () => {
  const selection = cleanSelection();

  if (!selection) {
    figmaNotifyAndClose(`🥰 You must select at least 1 layer. Yea...`, notificationTimeout);
    return;
  }

  await Promise.all(
    selection.map(async (layer) => {
      const stylers = getStylersByLayerType(layer);

      if (layer.type === 'TEXT') {
        await figma.loadFontAsync(layer.fontName as FontName);
      }

      stylers.map((styler) => {
        const idMatch = styler.getStyleById(layer);
        const nameMatch = styler.getStyleByName(layer.name);

        if (CMD === 'generate-all-styles') {
          styler.generateStyle(layer, { nameMatch, idMatch });
        } else if (CMD === 'apply-all-styles') {
          styler.applyStyle(layer, nameMatch);
        } else if (CMD === 'detach-all-styles') {
          styler.detachStyle(layer);
        } else if (CMD.includes('remove')) {
          styler.removeStyle(idMatch);
        }
      });
    }),
  );

  showNofication();
};

export const extractAllStyles = async () => {
  const styles = [
    ...figma.getLocalPaintStyles(),
    ...figma.getLocalEffectStyles(),
    ...figma.getLocalGridStyles(),
    ...figma.getLocalTextStyles(),
  ];

  const selection = [];
  const styleguides = getStyleguides(styles);

  if (styleguides.length > 0) {
    const canvas = figma.currentPage;
    const styleguidesByType = groupBy(styleguides, 'type');

    changeColor(canvas, 'backgrounds', colors.black);

    const mainContainer = createFrameLayer({
      layoutProps: { layoutMode: 'HORIZONTAL', itemSpacing: 128 },
    });

    if (!!styleguidesByType.TEXT) {
      const textsContainer = createFrameLayer({
        layoutProps: { layoutMode: 'VERTICAL', itemSpacing: 32 },
        parent: mainContainer,
      });

      await Promise.all(
        styleguidesByType.TEXT.map(async (styleguide) => {
          const newLayer = await createTextLayer({
            characters: styleguide.name,
            color: colors.white,
            parent: textsContainer,
          });

          const nameMatch = texter.getStyleByName(newLayer.name);
          texter.applyStyle(newLayer, nameMatch);

          selection.push(newLayer);
          counter.extracted++;
        }),
      );
    }

    if (!!styleguidesByType.FRAME) {
      const visualsContainer = createFrameLayer({
        layoutProps: { layoutMode: 'VERTICAL', itemSpacing: 32 },
        parent: mainContainer,
      });

      chunk(styleguidesByType.FRAME, framesPerContainer).map((styleguides) => {
        const chunkContainer = createFrameLayer({
          layoutProps: { layoutMode: 'HORIZONTAL', itemSpacing: 32 },
          parent: visualsContainer,
        });

        styleguides.map((styleguide) => {
          const newLayer = createFrameLayer({ name: styleguide.name, size: 80, parent: chunkContainer });

          stylersWithoutTexter.map((styler) => {
            const nameMatch = styler.getStyleByName(newLayer.name);

            styler.applyStyle(newLayer, nameMatch);
          });

          selection.push(newLayer);
          counter.extracted++;
        });
      });
    }
  }
  ungroupToCanvas(selection);

  showNofication();
};