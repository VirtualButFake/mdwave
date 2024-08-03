// https://vitepress.dev/guide/custom-theme
import Theme from 'vitepress/theme';
import './styles/tailwind.css';
import './styles/style.css';
import './styles/vpdoc.css';
import './styles/vpdoc-home.css';

export default {
    extends: Theme,
};
