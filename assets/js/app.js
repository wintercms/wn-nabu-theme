import CodeBlock from './src/CodeBlock';
import CodeBlockStyle from './src/CodeBlockStyle';
import DarkMode from './src/DarkMode';
import DocPageLoader from './src/DocPageLoader';
import Hashbangs from './src/Hashbangs';
import MobileMenu from './src/MobileMenu';
import Popover from './src/Popover';
import PositionTracker from './src/PositionTracker';
import StickyElement from './src/StickyElement';
import UiHandler from './src/UiHandler';
import Overlay from './src/Overlay';
import CollapsibleMenu from './src/CollapsibleMenu';
import ScrollPosition from './src/ScrollPosition';
import BackendPreviewer from './src/BackendPreviewer';
import Modal from './src/Modal';
import MobileTocMenu from './src/MobileTocMenu';

// Set up UI scripts
((Snowboard) => {
    Snowboard.addPlugin('stickyElement', StickyElement);
    Snowboard.addPlugin('darkMode', DarkMode);
    Snowboard.addPlugin('codeBlock', CodeBlock);
    Snowboard.addPlugin('codeBlockStyle', CodeBlockStyle);
    Snowboard.addPlugin('backendPreviewer', BackendPreviewer);
    Snowboard.addPlugin('hashbangs', Hashbangs);
    Snowboard.addPlugin('scrollPosition', ScrollPosition);
    Snowboard.addPlugin('positionTracker', PositionTracker);
    Snowboard.addPlugin('docPageLoader', DocPageLoader);
    Snowboard.addPlugin('popover', Popover);
    Snowboard.addPlugin('uiHandler', UiHandler);
    Snowboard.addPlugin('overlay', Overlay);
    Snowboard.addPlugin('collapsibleMenu', CollapsibleMenu);
    Snowboard.addPlugin('mobileMenu', MobileMenu);
    Snowboard.addPlugin('mobileToc', MobileTocMenu);
    Snowboard.addPlugin('modal', Modal);
})(window.Snowboard);

// Disable Prism from automatically rendering
window.Prism = window.Prism || {};
window.Prism.manual = true;
