import 'core-js/features/promise';
import 'core-js/features/object/assign';
import 'core-js/features/string/includes';
import 'whatwg-fetch';
import 'abortcontroller-polyfill';
import { INVALID_URL } from '../constants';

const requestMap = [];

class Request {
    constructor(url, config) {
        if (!config) {
            config = {};
        }
        this.url = url;
        this.config = config;
        this.controller = new window.AbortController();
        const signal = this.controller.signal;
        this.fetch = window.fetch(url, Object.assign(config, { signal }));
    }
    abort() {
        this.controller.abort();
    }
    then(...args) {
        return this.fetch.then(...args);
    }
    catch(...args) {
        return this.fetch.catch(...args);
    }
}

function _removeExisting(url, abort) {
    const existing = requestMap.filter(req => {
        const existingUrl = req.url.split('?')[0];
        const incomingUrl = url.split('?')[0];
        return existingUrl === incomingUrl;
    });
    existing.forEach(req => {
        if (abort) {
            req.abort();
        }
        existing.splice(existing.indexOf(req), 1);
    });
}

function _request(url, config = {}) {
    if (url && typeof url === 'string') {
        if (config.cancellable) {
            _removeExisting(url, config.cancellable);
            delete config.cancellable;
        }
        const currentPromise = new Request(url, config);
        requestMap.push(currentPromise);
        currentPromise
            .then(() => _removeExisting(url))
            .catch(() => _removeExisting(url));
        return currentPromise;
    } else {
        throw new TypeError(INVALID_URL);
    }
}

export function request() {
    return _request.apply(this, arguments);
}
