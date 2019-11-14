import 'core-js/features/promise';
import Logger from 'argon-logger';
import { INVALID_RESPONSE_OBJECT, TARGET_MISSING, INVALID_RENDER_OBJECT, ROOT_EVENT } from '../constants';
import { $, resolveData } from '../Selector';

const logger = new Logger();

const $body = $(document.body);

function _renderHTML(response, target) {
    const $ref = $(target ? target : this.root);
    $ref[$ref.data('rendered') ? 'append' : 'html'](response);
    $ref.data('rendered', true);
}

function _resolveTargetRef(target) {
    const $ref = $(target);
    if ($ref.length === 1 && $ref[0] === this.root) {
        return $(this.root);
    }
    return $(this.root).find(target);
}

function _renderTemplate(response) {
    try {
        const target = _resolveTargetRef.apply(this, [response.target]);
        const data = response.data || response.error;
        const template = response.template;
        let html = response.html;
        if (target.length) {
            if (!template) {
                html = resolveData(data);
            } else {
                html = template(data);
            }
            _renderHTML.apply(this, [html, target]);
            $body.trigger(ROOT_EVENT, [this.root]);
        } else {
            throw new Error(TARGET_MISSING);
        }
    } catch (e) {
        logger.error('[Argon]:', e);
    }
}

function _processResponses(response) {
    const responses = Array.isArray(response) ? response : [response];
    responses.forEach(resp => {
        if (typeof resp === 'string') {
            _renderHTML.apply(this, [resp]);
            $body.trigger(ROOT_EVENT, [this.root]);
        } else if (typeof resp === 'function') {
            _renderHTML.apply(this, [resp()]);
            $body.trigger(ROOT_EVENT, [this.root]);
        } else if (resp && typeof resp === 'object') {
            if (Array.isArray(resp)) {
                throw new TypeError(INVALID_RESPONSE_OBJECT);
            }
            _renderTemplate.apply(this, [resp]);
        }
    });
}

function _resolvePromise(promise) {
    promise.then((response) => {
        _processResponses.apply(this, [response]);
    }).catch((response) => {

        if (typeof this.onError === 'function') {
            _processResponses.apply(this, [response]);
            this.onError(response);
        }
    });
}

function _doRender(response) {
    try {
        if (typeof response === 'string') {
            // Assuming response is a valid HTML
            _renderHTML.apply(this, [response]);
        } else if (typeof response === 'function') {
            _renderHTML.apply(this, [response()]);
        } else if (Array.isArray(response) || response.then) {
            response = response.length ? response : [response];
            response.forEach(resp => {
                if (typeof resp === 'string') {
                    _renderHTML.apply(this, [resp]);
                } else if (typeof resp === 'function') {
                    _renderHTML.apply(this, [resp()]);
                } else if (resp.then) {
                    _resolvePromise.apply(this, [resp]);
                } else {
                    throw new TypeError(INVALID_RENDER_OBJECT);
                }
            });
        } else {
            throw new TypeError(INVALID_RENDER_OBJECT);
        }
    } catch (e) {
        logger.error('[Argon]:', e);
    }
}

export class Component {
    constructor({ root, parent }) {
        this.root = root;
        this.parent = parent;
    }
    init() {
        if (typeof this.doInit === 'function') {
            this.doInit(this.root, this.parent);
        }
        if (typeof this.render === 'function') {
            _doRender.apply(this, [this.render()]);
        }
    }
}
