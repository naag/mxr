import { parseHash, type Route } from './router'

/** Reactive view of `location.hash`. */
class Router {
  route = $state<Route>(parseHash(location.hash))

  constructor() {
    window.addEventListener('hashchange', () => {
      this.route = parseHash(location.hash)
    })
  }
}

export const router = new Router()
