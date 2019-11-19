declare class Selector {
    constructor(selectorRef: string | Node | NodeList[] | HTMLCollection[] | Selector, createMode?: boolean): void;
    const length: number;
    add(selector: Selector): Selector;
    attr(key: string | object, value?: string): Selector | string;
    data(key: string | object, value?: string): Selector | string;
    find(selectorRef: string | Selector): Selector;
    each(callback: Function): Selector;
    map(callback: Function): Selector[];
    clone(): Selector;
    filter(callback: Function): Selector;
    contains(selectorRef: string | Selector): Selector;
    has(selectorRef: string | Selector): Selector;
    children(): Selector;
    detach(): Selector;
    prepend(domString: string | Selector): Selector;
    append(domString: string | Selector): Selector;
    on(eventName: string, selector?: string | Selector, data?: object, callback: Function, useCapture?: boolean): Selector;
    trigger(eventName: string, data?: any[]): Selector;
}

declare class DocumentSelector extends Selector {
    ready(callback: Function): DocumentSelector;
    readyState(): string;
}

declare function $(selectorRef: string | Selector | Node | NodeList[] | HTMLCollection[]): Selector | DocumentSelector;

declare class Render {
    constructor(templates: Function[]): void;
    fn(options: RenderOptions): Promise<any>;
    get(templateName: string): Function;
}

declare interface RenderOptions {
    template: string;
    target: string | Selector;
    data?: any;
    url?: string | object | string[] | object[];
}

declare class Core {
    init(currentRoot?: Selector, bundleImport: Function): void;
}

declare class Component {
    init(): void;
    doInit(root?: Node, parent?: Node): void;
    render(): string | Promise<any>;
    doDestroy(): void;
}

export { Component, Render, Core, $ };