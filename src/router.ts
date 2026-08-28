import { createRouter, createWebHashHistory } from 'vue-router'
import ProjectListView from './views/ProjectListView.vue'
import NewProjectView from './views/NewProjectView.vue'
import EditorView from './views/EditorView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: ProjectListView },
    { path: '/new', component: NewProjectView },
    { path: '/p/:id', component: EditorView, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
