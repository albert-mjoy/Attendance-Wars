import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * A component that renders one of the provided case components based on the value.
 */
export const Switch = ({ components, defaultComponent, value }) => {
    let RenderedComponent = (components[value] || defaultComponent);
    if (typeof RenderedComponent === "function") {
        return _jsx(RenderedComponent, {});
    }
    return _jsx(_Fragment, { children: RenderedComponent });
};
