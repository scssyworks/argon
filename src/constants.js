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