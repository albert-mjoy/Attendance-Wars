import { ComponentType, FC, ReactNode } from "react";
type CaseComponent = ReactNode | ComponentType;
export interface SwitchProps {
    /** List of case components to be rendered when case matches */
    components: Record<string | number, CaseComponent>;
    /** Default component to be rendered if the value does not match any of the given cases */
    defaultComponent: CaseComponent;
    /** Value to check with the cases to render the corresponding component */
    value: string | number;
}
/**
 * A component that renders one of the provided case components based on the value.
 */
export declare const Switch: FC<SwitchProps>;
export {};
