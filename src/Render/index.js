import 'core-js/features/array/includes';
import 'core-js/features/object/assign';
import 'core-js/features/promise';
import { param } from 'silkrouter';
import { INVALID_URL, INVALID_SCHEMA, INVALID_TEMPLATE_NAME, TEMPLATE_MISSING, INVALID_SELECTOR, INVALID_TEMPLATE_MAP } from '../constants';
import { isValidSelector } from '../Selector';
import { logger } from '../utils';
import { request } from '../Fetch';

export const methods = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    HEAD: 'HEAD'
};

/**
 * Returns true if input value is an object
 * @param {*} ob
 */
function isValidObject(ob) {
    return ob && typeof ob === 'object' && !Array.isArray(ob);
}

/**
 * Returns true if current data or content type is JSON
 * @param {object} config
 */
function isContentTypeJson(config) {
    const fetchOptions = config.fetchOptions;
    return config.requestDataType === 'json' || (fetchOptions && fetchOptions.headers && fetchOptions.headers['Content-Type'] === 'application/json');
}

/**
 * Resolves input URL data to a valid string based on data type
 * @param {object} url
 */
function resolveURLData(url) {
    const { config } = this;
    const { data } = url;
    if (typeof data !== 'string') {
        if (data && typeof data === 'object') {
            if (isContentTypeJson(config)) {
                url.data = JSON.stringify(data);
            } else {
                url.data = param(data);
            }
        }
    }
}

/**
 * Validates URL schema if it's an object
 * @param {*} url
 */
function validateSchema(url) {
    const keys = Object.keys(url);
    if ((keys.length === 1 && keys[0] === 'path')) {
        return url;
    } else if (keys.length === 2 && keys.includes('path') && keys.includes('data')) {
        resolveURLData.apply(this, [url]);
        return url;
    }
    throw new Error(INVALID_SCHEMA);
}

/**
 * Resolves a URL to a valid consumable object
 * @param {*} path
 */
function resolveURL(path) {
    if (typeof path === 'string') {
        const [pathString, data] = path.split('?');
        return [{ path: pathString, data }];
    } else if (path && typeof path === 'object') {
        if (Array.isArray(path)) {
            return path.map(url => {
                if (typeof url === 'string') {
                    const [path, data] = url.split('?');
                    return { path, data };
                } else if (isValidObject(url)) {
                    return validateSchema.apply(this, [url]);
                }
            });
        } else if (isValidObject(path)) {
            return [validateSchema.apply(this, [path])];
        }
    }
    throw new TypeError(INVALID_URL);
}

/**
 * Returns a promise with template, target and data information
 */
function renderData() {
    const { config } = this;
    const { template } = config;
    if (typeof config.beforeRender === 'function') {
        config.beforeRender.apply(config, [config.data]);
    }
    return new Promise((resolve, reject) => {
        const responseObj = {
            template: null,
            target: config.target
        };
        if (template) {
            if (this.templateMap[template]) {
                resolve(Object.assign(responseObj, {
                    template: this.templateMap[template],
                    data: config.data
                }));
            } else {
                reject(Object.assign(responseObj, {
                    error: TEMPLATE_MISSING
                }));
            }
        } else {
            reject(Object.assign(responseObj, {
                error: INVALID_TEMPLATE_NAME
            }));
        }
    });
}

/**
 * Resolves input value to an array based on length
 * @param {string} inputStr
 * @param {number} length
 * @param {string} type
 */
function resolveToArray(inputStr, length, type) {
    const error = type === 'template' ? INVALID_TEMPLATE_NAME : INVALID_SELECTOR;
    if (
        (inputStr && typeof inputStr === 'string')
        || (type === 'target' && isValidSelector(inputStr))
    ) {
        const list = [];
        for (let i = 0; i < length; i++) {
            list.push(inputStr);
        }
        return list;
    } else if (Array.isArray(inputStr)) {
        return inputStr.map(str => {
            if (
                (str && typeof str === 'string')
                || (type === 'target' && isValidSelector(str))
            ) {
                return str;
            }
            throw new TypeError(error);
        });
    } else {
        throw new TypeError(error);
    }
}

function doRequest(URL, method, fetchOptions) {
    if ([methods.GET, methods.DELETE].includes(method)) {
        const requestPath = URL.data ? `${URL.path}?${URL.data}` : URL.path;
        return request(requestPath, Object.assign({}, fetchOptions));
    } else {
        return request(URL.path, Object.assign({}, fetchOptions, { body: URL.data }));
    }
}

function renderAjaxData(template, target, data, resolve, reject) {
    renderData.apply({
        config: {
            template,
            target,
            data
        },
        templateMap: this.templateMap
    }).then(resolve).catch(reject);
}

function renderError(template, target, error, reject) {
    if (!template) {
        template = null;
        error = TEMPLATE_MISSING;
    }
    reject({ template, target, error });
}

/**
 * Executes single or multiple requests in parallel
 */
function parallel() {
    const { config, URLs } = this;
    let { fetchOptions, template, target } = config;
    template = resolveToArray(template, URLs.length, 'template');
    target = resolveToArray(target, URLs.length, 'target');
    const method = fetchOptions.method || methods.GET;
    const requestPromises = URLs.map((URL, index) => new Promise((resolve, reject) => {
        doRequest(URL, method, fetchOptions)
            .then(res => res.json())
            .then(data => {
                renderAjaxData.apply(this, [template[index], target[index], data, resolve, reject]);
            })
            .catch(error => {
                renderError.apply(this, [this.templateMap[template[index]], target[index], error, reject]);
            });
    }));
    URLs.length = 0;
    return requestPromises;
}

function sequence(returnPromises, inputTemplates, targets, upResolve, upReject) {
    const { config, URLs } = this;
    let { fetchOptions } = config;
    if (URLs.length >= 1) {
        const method = fetchOptions.method || methods.GET;
        returnPromises.push(
            new Promise((resolve, reject) => {
                const current = URLs.splice(0, 1)[0];
                const template = inputTemplates.splice(0, 1)[0];
                const target = targets.splice(0, 1)[0];
                doRequest(current, method, fetchOptions)
                    .then(res => res.json())
                    .then(data => {
                        renderAjaxData.apply(this, [template, target, data, resolve, reject]);
                        sequence.apply(this, [returnPromises, inputTemplates, targets, upResolve, upReject]);
                    })
                    .catch(error => {
                        renderError.apply(this, [this.templateMap[template], target, error, reject]);
                    });
            })
        );
    } else {
        Promise.all(returnPromises)
            .then(upResolve)
            .catch(upReject);
    }
}

function renderAjax() {
    const { config } = this;
    try {
        this.URLs = resolveURL.apply(this, [config.url]);
        if (this.URLs.length) {
            if (config.parallel) {
                return parallel.apply(this);
            }
            let { template, target } = config;
            template = resolveToArray(template, this.URLs.length, 'template');
            target = resolveToArray(target, this.URLs.length, 'target');
            return [new Promise((resolve, reject) => {
                sequence.apply(this, [[], template, target, resolve, reject]);
            })];
        }
        throw new TypeError(INVALID_URL);
    } catch (e) {
        logger.error('[Webpack]:', e);
    }
}

function fnPrivate(config = {}) {
    if (!config.fetchOptions) {
        config.fetchOptions = {};
    }
    this.config = Object.assign({ parallel: true }, config);
    if (config.url) {
        return renderAjax.apply(this);
    }
    return [renderData.apply(this)];
}

function getPrivate(name) {
    if (typeof name === 'string') {
        if (this.templateMap[name]) {
            return this.templateMap[name];
        }
        throw new TypeError(TEMPLATE_MISSING);
    }
    throw new TypeError(INVALID_TEMPLATE_NAME);
}

export class Render {
    constructor(templateMap) {
        if (!templateMap) {
            throw new TypeError(INVALID_TEMPLATE_MAP);
        }
        this.templateMap = templateMap;
        this.URLs = [];
        this.config = {};
    }
    fn() {
        return fnPrivate.apply(this, arguments);
    }
    get() {
        return getPrivate.apply(this, arguments);
    }
}
