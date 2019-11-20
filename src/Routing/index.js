import { router, route, unroute } from 'silkrouter';
import 'core-js/features/array/includes';
import { INVALID_ROUTES } from '../constants';
import { hasOwn } from '../utils';

class Router {
    constructor(routes, hashMode) {
        this.subscriptions = [];
        if (Array.isArray(routes)) {
            const normalRoutes = [];
            const errorRoutes = [];
            routes.forEach(routeObj => {
                if (hasOwn(routeObj, 'component')) {
                    if (hasOwn(routeObj, 'route')) {
                        const routeString = `${hashMode ? '#' : ''}${routeObj.route}`;
                        if (!normalRoutes.includes(routeString)) {
                            normalRoutes.push(routeString);
                        }
                    } else if (hasOwn(routeObj, 'error')) {
                        const routeString = `${hashMode ? '#' : ''}${routeObj.error}`;
                        if (!normalRoutes.includes(routeString)) {
                            normalRoutes.push(routeString);
                        }
                        if (!errorRoutes.includes(routeString)) {
                            errorRoutes.push(routeString);
                        }
                    }
                } else {
                    throw new TypeError(INVALID_ROUTES);
                }
            });
            this.routeList = routes;
            this.routeFn = (evt) => {
                if (normalRoutes.includes(evt.route)) {
                    const { data, params, query, route } = evt;
                    this.currentRoute = {
                        route, data, params, query
                    };
                    this.subscriptions.forEach(fn => {
                        fn.apply(this, [this.currentRoute]);
                    });
                } else if (errorRoutes.length) {
                    router.set(errorRoutes[0], true); // Replace existing route with error route
                }
            }
            route(this.routeFn);
            if (!window.location.hash && hashMode) {
                router.set('#/', true);
            }
        } else {
            throw new TypeError(INVALID_ROUTES);
        }
    }
    routes() {
        return this.routeList;
    }
    destroy() {
        this.subscriptions.length = 0;
        unroute(this.routeFn);
    }
    navigate() {
        router.set(...arguments);
        return this;
    }
    subscribe(callback) {
        if (typeof callback === 'function' && !this.subscriptions.includes(callback)) {
            this.subscriptions.push(callback);
        }
        return this;
    }
}

function routerFn() {
    return new Router(...arguments);
}

export { Router, routerFn };