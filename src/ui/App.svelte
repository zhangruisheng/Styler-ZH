<script>
  import { onMount } from 'svelte';
  import { defaultSettings } from '../code/modules/default-settings';
  import IconFrame from './assets/icons/frame-layers.svg';
  import IconText from './assets/icons/text-layers.svg';
  import Icon from './components/Icon';
  import Checkbox from './components/Checkbox';
  import Button from './components/Button';
  import NumberField from './components/NumberField';
  import Warning from './assets/icons/warning.svg';

  let uiSettings = { ...defaultSettings };
  let showAlert = false;

  onMount(() => {
    window.focus();
  });

  const updateSettings = (currentSettings, newSettings = defaultSettings) => {
    Object.keys(newSettings).map((key) => {
      currentSettings[key] = newSettings[key];
    });

    return currentSettings;
  };

  onmessage = async (e) => {
    const codeSettings = e.data.pluginMessage;
    // console.log('in ui msg:');
    // console.log(e.data.pluginMessage);

    uiSettings = updateSettings(uiSettings, codeSettings);
  };

  const saveSettings = () => {
    const { fillerPrefix, fillerSuffix, strokeerPrefix, strokeerSuffix } = uiSettings;
    if (fillerPrefix === strokeerPrefix && fillerSuffix === strokeerSuffix) {
      showAlert = true;
    } else {
      parent.postMessage(
        {
          pluginMessage: {
            type: 'save-settings',
            uiSettings,
          },
        },
        '*',
      );
    }
  };

  const resetToDefault = () => {
    uiSettings = updateSettings(uiSettings, defaultSettings);

    return uiSettings;
  };

  const cancelModalUsingEscape = (event) => {
    if (event.key === 'Escape') {
      parent.postMessage(
        {
          pluginMessage: {
            type: 'cancel-modal',
          },
        },
        '*',
      );
    }
  };
</script>

<style lang="scss">
  main {
    margin-bottom: 4.8rem;
  }
  main > div {
    padding: 0 var(--size-x-small);
    margin: 1.6rem 0;
  }

  footer {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: hsl(var(--color-neutral-0));
    box-shadow: 0px 0px 1.6rem hsla(var(--color-invert-0), 0.05);
    padding: 0.4rem 1.2rem;
  }

  footer :global(.col) {
    flex: 1 1 auto;
    margin: 0.4rem;
  }

  .helper {
    display: flex;
    color: hsl(var(--color-invert-3));
  }
  .helper :global(.icon-container) {
    flex: 0 0 2.4rem;
    height: auto;
    padding: 0.2rem;
  }

  .helper span {
    margin: 0.2rem 0.8rem;
  }
</style>

<main>
  <div>
    <h2 class="caption">通用设置</h2>
    <NumberField bind:value={uiSettings.notificationTimeout} step="1000">
      <span slot="textfield-label">通知持续时间</span>
      <span slot="unit-measure">毫秒</span>
    </NumberField>
  </div>

  <div>
    <h2 class="caption">生成样式</h2>
    <Checkbox bind:checked={uiSettings.addPrevToDescription}>
      <span slot="label">在描述中显示最后一个样式</span>
    </Checkbox>

    <Checkbox bind:checked={uiSettings.updateUsingLocalStyles} show>
      <span slot="label">使用本地样式更新</span>
    </Checkbox>

    <Checkbox bind:checked={uiSettings.partialMatch} show>
      <span slot="label">扩展名称匹配</span>
    </Checkbox>

    <Checkbox bind:checked={uiSettings.reverseLayers}>
      <span slot="label">反向生成顺序</span>
    </Checkbox>

    <div class="helper">
      <Icon iconName={Warning} class="icon-container" />
      <span class="small">
        实验性功能！
        <br />
        有时会产生意想不到的结果...
      </span>

    </div>
  </div>

  <div>
    <h2 class="caption">提取样式</h2>
    <NumberField bind:value={uiSettings.textsPerSection} iconName={IconText}>
      <span slot="textfield-label">每列文本数</span>
      <span slot="unit-measure">图层</span>
    </NumberField>

    <NumberField bind:value={uiSettings.framesPerSection} iconName={IconFrame}>
      <span slot="textfield-label">每行框架数</span>
      <span slot="unit-measure">图层</span>
    </NumberField>
  </div>

</main>
<footer>
  <Button on:click={resetToDefault} variant="secondary" class="col">重置为默认</Button>
  <Button on:click={saveSettings} class="col">保存设置</Button>
</footer>

<svelte:window on:keydown={cancelModalUsingEscape} />
