export const ROOT_EVENT = 'init.core';
export const INVALID_RESPONSE_OBJECT = `Promise returned an invalid response.
Following are the valid signatures:
1. { template, target, data }
2. { template, target, error },
3. { target, html }`;
export const TARGET_MISSING = `Couldn't resolve target reference.`;
export const INVALID_RENDER_OBJECT = `HTML or Promise returned by "render" method is invalid.
Hint: If you are using "render.fn" module to render components, use spread operator while combining it with regular HTML:
e.g. return ['<div>Regular HTML</div>', ...render.fn({ ... })];`;
export const INVALID_OBJECT = `Function "fn" expects a valid configuration object.`;
export const PARSE_ERROR = 'Block data could not be parsed.';
export const TEMPLATE_MISSING = 'Target template is missing.';
export const INVALID_URL = 'Provided URL is invalid.';
export const INVALID_SCHEMA = 'Invalid schema for URL object. Allowed fields are "path" and "data".';
export const INVALID_TEMPLATE_NAME = 'Please provide a valid template name.';
export const INVALID_SELECTOR = 'Please provide a valid selector.';
export const INVALID_TEMPLATE_MAP = 'Render requires a template object.';
export const INVALID_ROUTES = `Invalid route object. Routes should be passed using below format:
[
    {
        route: '/path/to/route',
        component: 'ComponentClassName'
    },
    ...
]`;