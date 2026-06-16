import React from "react";
import { ResponsiveSliderField } from "@crediblemark/build";

export type ResponsiveValue = React.ComponentProps<typeof ResponsiveSliderField>['value'];

export const getVal = (val: ResponsiveValue | undefined, fallback: number) => {
    if (typeof val === 'number') return val;
    return val?.desktop ?? fallback;
};

export const getTabletVal = (val: ResponsiveValue | undefined, fallback: number) => {
    if (typeof val === 'number') return val;
    return val?.tablet ?? val?.desktop ?? fallback;
};

export const getMobileVal = (val: ResponsiveValue | undefined, fallback: number) => {
    if (typeof val === 'number') return val;
    return val?.mobile ?? val?.tablet ?? val?.desktop ?? fallback;
};
