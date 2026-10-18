import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

if (import.meta.env.VITE_TEST_HOOKS === 'true') {
  void import('./lib/test-hooks').then((m) => m.install())
}

export default app
