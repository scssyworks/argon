import { $ } from '../Selector';
import { bundleImporter } from '../Importer';
import { ROOT_EVENT } from '../constants';
import { logger } from '../utils';

const $body = $(document.body);

const componentImports = [];

function diff(newImports, currentRoot) {
    const existingImports = componentImports.filter(imp => imp.parent === currentRoot);
    existingImports.forEach(imp => {
        componentImports.splice(componentImports.indexOf(imp), 1);
    });
    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (newImports.length === 0) {
            break;
        }
        const curr = newImports.splice(0, 1);
        const prev = existingImports.filter(imp => (
            imp.root === curr[0].root
            && imp.name === curr[0].name
        ));
        if (prev.length) {
            prev.forEach(imp => {
                componentImports.push(...existingImports.splice(existingImports.indexOf(imp), 1));
            });
        } else {
            componentImports.push(...curr);
        }
    }
    if (existingImports.length) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (existingImports.length === 0) {
                break;
            }
            existingImports.splice(0, 1).forEach(imp => {
                if (imp.ref && typeof imp.ref.doDestroy === 'function') {
                    imp.ref.doDestroy();
                    logger.log(`[Webpack]: component "${imp.name}" has been destroyed.`);
                }
            });
        }
    }
    return componentImports.filter(imp => !imp.imported);
}

function initializeModule(root = $(document), bundleImport) {
    const newImports = [];
    const currentRoot = $(root);
    currentRoot.find('[data-module]').each(el => {
        const dataModule = $(el).data('module');
        if (typeof dataModule === 'string') {
            dataModule.split(',').forEach(mod => {
                mod = mod.trim();
                if (!newImports.filter(imp => imp.root === el && imp.name === mod).length) {
                    newImports.push({
                        root: el,
                        parent: root,
                        name: mod
                    });
                }
            });
        }
    });

    const components = diff(newImports, root); // Adds new imports and removes redundant imports

    // Fetch component bundles
    if (components.length) {
        components.forEach(component => {
            component.imported = true;
            bundleImport(component, function (args) {
                this.chunked = true;
                bundleImporter.call(component, {
                    RefClass: args.default,
                    root: this.root,
                    parent: this.parent
                });
            });
        });
    }
}

export class Core {
    static init(currentRoot, bundleImport) {
        initializeModule.apply(this, [currentRoot, bundleImport]);
        $body.on(ROOT_EVENT, (...args) => {
            const [, currRoot] = args;
            initializeModule.apply(this, [currRoot, bundleImport]);
        });
    }
}