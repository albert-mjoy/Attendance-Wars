import { type ReactNode } from 'react';
type RenderFn<T> = (item: T, index?: number) => ReactNode;
export declare const For: <T>({ render, each, }: {
    render: RenderFn<T>;
    each?: T[] | undefined;
}) => (string | number | import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | import("react").ReactPortal)[];
export {};
