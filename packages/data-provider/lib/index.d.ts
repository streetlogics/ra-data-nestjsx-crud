import { DataProvider, fetchUtils } from 'ra-core';
declare const _default: (apiUrl: string, httpClient?: (url: any, options?: fetchUtils.Options) => Promise<{
    status: number;
    headers: Headers;
    body: string;
    json: any;
}>) => DataProvider;
export default _default;
