export const validIdentifier = (name: string) => {
    return !!name.match(/[A-Za-z_][A-Za-z_0-9]*/);
};
