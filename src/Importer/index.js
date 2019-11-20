import { logger } from '../utils';

export function bundleImporter({ RefClass, root, parent, routeData }) {
    if (typeof RefClass === 'function') {
        // Get component instance
        this.ref = new RefClass({ root, parent, routeData });
        if (typeof this.ref.init === 'function') {
            this.ref.init();
            logger.log(`[Webpack]: component "${this.name}" has been initialized.`);
        } else {
            logger.error(`[Webpack]: component "${this.name}" does not have an init method.`);
        }
    }
}