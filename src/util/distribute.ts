export type Distribute = <TI>(
    obj: TI,
    matcher: {
        [key in keyof TI]:
            | ((arg: Exclude<TI[key], undefined>) => void)
            | undefined;
    },
    otherwise?: (arg: TI) => any,
) => void;

/**
 * Distribute the properties of the object to the functioned of the same name
 * @param obj An object with some properties
 * @param matcher An object of functions, ready to accept the value of each corresponding property in the object
 * @param otherwise A function called if no function was matched.
 */
export const distribute: Distribute = (obj, matcher, otherwise = () => {}) => {
    let found = false;
    Object.entries(obj).forEach(([key, value]) => {
        const callback = matcher[key];
        if (callback && value !== undefined) {
            callback(value);
            found = true;
        }
    });
    if (!found) {
        otherwise(obj);
    }
};
