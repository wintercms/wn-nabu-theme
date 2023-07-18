import BackendPreviewer from './src/BackendPreviewer';
import CodeBlock from './src/CodeBlock';
import CodeBlockStyle from './src/CodeBlockStyle';
import CollapsibleMenu from './src/CollapsibleMenu';
import DarkMode from './src/DarkMode';
import DocPageLoader from './src/DocPageLoader';
import Hashbangs from './src/Hashbangs';
import MobileMenu from './src/MobileMenu';
import MobileTocMenu from './src/MobileTocMenu';
import Modal from './src/Modal';
import Overlay from './src/Overlay';
import Popover from './src/Popover';
import PositionTracker from './src/PositionTracker';
import ScrollPosition from './src/ScrollPosition';
import StickyElement from './src/StickyElement';
import UiHandler from './src/UiHandler';

// Set up UI scripts
((Snowboard) => {
    Snowboard.addPlugin('stickyElement', StickyElement);
    Snowboard.addPlugin('darkMode', DarkMode);
    Snowboard.addPlugin('codeBlock', CodeBlock);
    Snowboard.addPlugin('codeBlockStyle', CodeBlockStyle);
    Snowboard.addPlugin('backendPreviewer', BackendPreviewer);
    Snowboard.addPlugin('hashbangs', Hashbangs);
    Snowboard.addPlugin('docPageLoader', DocPageLoader);
    Snowboard.addPlugin('popover', Popover);
    Snowboard.addPlugin('overlay', Overlay);
    Snowboard.addPlugin('collapsibleMenu', CollapsibleMenu);
    Snowboard.addPlugin('mobileMenu', MobileMenu);
    Snowboard.addPlugin('mobileToc', MobileTocMenu);
    Snowboard.addPlugin('modal', Modal);

    if (document.getElementById('content') !== null) {
        Snowboard.addPlugin('scrollPosition', ScrollPosition);
        Snowboard.addPlugin('positionTracker', PositionTracker);
        Snowboard.addPlugin('uiHandler', UiHandler);
    }
})(window.Snowboard);

// Disable Prism from automatically rendering
window.Prism = window.Prism || {};
window.Prism.manual = true;
