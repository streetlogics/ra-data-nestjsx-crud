"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crud_request_1 = require("@dataui/crud-request");
const lodash_omitby_1 = __importDefault(require("lodash.omitby"));
const ra_core_1 = require("ra-core");
const query_string_1 = require("query-string");
const countDiff = (o1, o2) => (0, lodash_omitby_1.default)(o1, (v, k) => o2[k] === v);
const composeFilter = (paramsFilter) => {
    const flatFilter = ra_core_1.fetchUtils.flattenObject(paramsFilter);
    return Object.keys(flatFilter).map((key) => {
        const splitKey = key.split(/\|\||:/);
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/gi;
        let field = splitKey[0];
        let ops = splitKey[1];
        if (!ops) {
            if (typeof flatFilter[key] === "boolean" ||
                typeof flatFilter[key] === "number" ||
                (typeof flatFilter[key] === "string" &&
                    flatFilter[key].match(/^\d+$/)) ||
                flatFilter[key].match(uuidRegex)) {
                ops = crud_request_1.CondOperator.EQUALS;
            }
            else {
                ops = crud_request_1.CondOperator.CONTAINS_LOW;
            }
        }
        if (field.startsWith("_") && field.includes(".")) {
            field = field.split(/\.(.+)/)[1];
        }
        return { field, operator: ops, value: flatFilter[key] };
    });
};
const composeQueryParams = (queryParams = {}) => {
    return (0, query_string_1.stringify)(ra_core_1.fetchUtils.flattenObject(queryParams), { skipNull: true });
};
const mergeEncodedQueries = (...encodedQueries) => encodedQueries.map((query) => query).join("&");
exports.default = (apiUrl, httpClient = ra_core_1.fetchUtils.fetchJson) => ({
    getList: (resource, params) => {
        const { page, perPage } = params.pagination;
        const _a = params.filter || {}, { q: queryParams, $OR: orFilter } = _a, filter = __rest(_a, ["q", "$OR"]);
        const encodedQueryParams = composeQueryParams(queryParams);
        const encodedQueryFilter = crud_request_1.RequestQueryBuilder.create({
            filter: composeFilter(filter),
            or: composeFilter(orFilter || {}),
        })
            .setLimit(perPage)
            .setPage(page)
            .sortBy(params.sort)
            .setOffset((page - 1) * perPage)
            .query();
        const query = mergeEncodedQueries(encodedQueryParams, encodedQueryFilter);
        const url = `${apiUrl}/${resource}?${query}`;
        return httpClient(url).then(({ json }) => ({
            data: json.data,
            total: json.total,
        }));
    },
    getOne: (resource, params) => httpClient(`${apiUrl}/${resource}/${params.id}`).then(({ json }) => ({
        data: json,
    })),
    getMany: (resource, params) => {
        const query = crud_request_1.RequestQueryBuilder.create()
            .setFilter({
            field: "id",
            operator: crud_request_1.CondOperator.IN,
            value: `${params.ids}`,
        })
            .query();
        const url = `${apiUrl}/${resource}?${query}`;
        return httpClient(url).then(({ json }) => ({ data: json.data || json }));
    },
    getManyReference: (resource, params) => {
        const { page, perPage } = params.pagination;
        const _a = params.filter || {}, { q: queryParams } = _a, otherFilters = __rest(_a, ["q"]);
        const filter = composeFilter(otherFilters);
        filter.push({
            field: params.target,
            operator: crud_request_1.CondOperator.EQUALS,
            value: params.id,
        });
        const encodedQueryParams = composeQueryParams(queryParams);
        const encodedQueryFilter = crud_request_1.RequestQueryBuilder.create({
            filter,
        })
            .sortBy(params.sort)
            .setLimit(perPage)
            .setOffset((page - 1) * perPage)
            .query();
        const query = mergeEncodedQueries(encodedQueryParams, encodedQueryFilter);
        const url = `${apiUrl}/${resource}?${query}`;
        return httpClient(url).then(({ json }) => ({
            data: json.data,
            total: json.total,
        }));
    },
    update: (resource, params) => {
        const data = countDiff(params.data, params.previousData);
        return httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }).then(({ json }) => ({ data: json }));
    },
    updateMany: (resource, params) => Promise.all(params.ids.map((id) => httpClient(`${apiUrl}/${resource}/${id}`, {
        method: "PUT",
        body: JSON.stringify(params.data),
    }))).then((responses) => ({
        data: responses.map(({ json }) => json),
    })),
    create: (resource, params) => httpClient(`${apiUrl}/${resource}`, {
        method: "POST",
        body: JSON.stringify(params.data),
    }).then(({ json }) => ({
        data: Object.assign(Object.assign({}, params.data), { id: json.id }),
    })),
    delete: (resource, params) => httpClient(`${apiUrl}/${resource}/${params.id}`, {
        method: "DELETE",
    }).then(({ json }) => ({ data: Object.assign(Object.assign({}, json), { id: params.id }) })),
    deleteMany: (resource, params) => Promise.all(params.ids.map((id) => httpClient(`${apiUrl}/${resource}/${id}`, {
        method: "DELETE",
    }))).then((responses) => ({ data: responses.map(({ json }) => json) })),
});
//# sourceMappingURL=index.js.map