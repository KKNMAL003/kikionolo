import { getStorybookUI, configure } from '@storybook/react-native';
import './.storybook/main.js';

// Import stories
configure(() => {
  require('../components/base/BaseText.stories');
  require('../components/base/BaseButton.stories');
  require('../components/base/BaseCard.stories');
  require('../components/base/BaseInput.stories');
}, module);

const StorybookUIRoot = getStorybookUI({});
export default StorybookUIRoot; 