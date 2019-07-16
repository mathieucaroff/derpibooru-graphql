// export const keys = (obj) => Object.keys(obj)
// export const values = (obj) => Object.values(obj)
export const entries = <T>(obj: Record<any, T>): [string, T][] => {
   return Object.entries(obj)
}
// export const objlen = (obj) => Object.keys(obj).length
