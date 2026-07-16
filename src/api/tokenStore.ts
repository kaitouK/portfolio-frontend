
let _memoryToken: string | null = null;
export const setMemoryToken = (token: string | null) => {
    _memoryToken = token;
};
export const getMemoryToken = (): string | null => {
    return _memoryToken;
};