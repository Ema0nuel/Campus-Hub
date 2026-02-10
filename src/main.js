// @ts-nocheck
import { mount } from 'svelte'
import '@fontsource/montserrat'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import './app.css'
import './assets/css/reset.css'
import '@fortawesome/fontawesome-free/css/all.min.css';
import App from './App.svelte';

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app