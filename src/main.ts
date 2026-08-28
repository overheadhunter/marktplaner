import { createApp } from 'vue'
import { config as faConfig } from '@fortawesome/fontawesome-svg-core'
import './style.css'

// icons are sized explicitly (Tailwind classes in HTML, width/height attributes inside the map SVG), so skip FontAwesome's injected CSS
faConfig.autoAddCss = false
import App from './App.vue'
import { router } from './router'

createApp(App).use(router).mount('#app')
