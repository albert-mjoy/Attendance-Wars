import { jsx as _jsx } from "react/jsx-runtime";
import { render } from '@testing-library/react';
import { Switch } from '../utils/Switch';
const ComponentA = () => _jsx("div", { children: "Component A" });
const ComponentB = () => _jsx("div", { children: "Component B" });
const DefaultComponent = () => _jsx("div", { children: "Default Component" });
var TestCases;
(function (TestCases) {
    TestCases["A"] = "a";
    TestCases["B"] = "b";
    TestCases["DEFAULT"] = "default";
})(TestCases || (TestCases = {}));
const renderSwitch = (value) => {
    return render(_jsx(Switch, { value: value, components: {
            [TestCases.A]: ComponentA,
            [TestCases.B]: ComponentB
        }, defaultComponent: DefaultComponent }));
};
describe('Switch Component', () => {
    it('should render the correct component based on value', () => {
        const { getByText, asFragment } = renderSwitch(TestCases.A);
        expect(getByText('Component A')).toBeInTheDocument();
        expect(asFragment()).toMatchSnapshot();
    });
    it('should render the default component if value does not match any case', () => {
        const { getByText, asFragment } = renderSwitch(TestCases.DEFAULT);
        expect(getByText('Default Component')).toBeInTheDocument();
        expect(asFragment()).toMatchSnapshot();
    });
});
