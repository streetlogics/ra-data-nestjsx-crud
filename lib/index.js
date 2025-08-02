"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var crud_request_1 = require("@dataui/crud-request");
var lodash_omitby_1 = __importDefault(require("lodash.omitby"));
var ra_core_1 = require("ra-core");
var query_string_1 = require("query-string");
/**
 * Maps react-admin queries to a nestjsx/crud powered REST API
 *
 * @see https://github.com/nestjsx/crud
 *
 * @example
 *
 * import React from 'react';
 * import { Admin, Resource } from 'react-admin';
 * import crudProvider from 'ra-data-nestjsx-crud';
 *
 * import { PostList } from './posts';
 *
 * const dataProvider = crudProvider('http://localhost:3000');
 * const App = () => (
 *     <Admin dataProvider={dataProvider}>
 *         <Resource name="posts" list={PostList} />
 *     </Admin>
 * );
 *
 * export default App;
 */
var countDiff = function (o1, o2) { return (0, lodash_omitby_1.default)(o1, function (v, k) { return o2[k] === v; }); };
var composeFilter = function (paramsFilter) {
    var flatFilter = ra_core_1.fetchUtils.flattenObject(paramsFilter);
    return Object.keys(flatFilter).map(function (key) {
        var splitKey = key.split(/\|\||:/);
        var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/gi;
        var field = splitKey[0];
        var ops = splitKey[1];
        if (!ops) {
            if (typeof flatFilter[key] === 'boolean' ||
                typeof flatFilter[key] === 'number' ||
                (typeof flatFilter[key] === 'string' &&
                    flatFilter[key].match(/^\d+$/)) ||
                flatFilter[key].match(uuidRegex)) {
                ops = crud_request_1.CondOperator.EQUALS;
            }
            else {
                ops = crud_request_1.CondOperator.CONTAINS_LOW;
            }
        }
        if (field.startsWith('_') && field.includes('.')) {
            field = field.split(/\.(.+)/)[1];
        }
        return { field: field, operator: ops, value: flatFilter[key] };
    });
};
var composeQueryParams = function (queryParams) {
    if (queryParams === void 0) { queryParams = {}; }
    return (0, query_string_1.stringify)(ra_core_1.fetchUtils.flattenObject(queryParams), { skipNull: true });
};
var mergeEncodedQueries = function () {
    var encodedQueries = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        encodedQueries[_i] = arguments[_i];
    }
    return encodedQueries.map(function (query) { return query; }).join('&');
};
exports.default = (function (apiUrl, httpClient) {
    if (httpClient === void 0) { httpClient = ra_core_1.fetchUtils.fetchJson; }
    return ({
        getList: function (resource, params) {
            var _a = params.pagination, page = _a.page, perPage = _a.perPage;
            var _b = params.filter || {}, queryParams = _b.q, orFilter = _b.$OR, filter = __rest(_b, ["q", "$OR"]);
            var encodedQueryParams = composeQueryParams(queryParams);
            var encodedQueryFilter = crud_request_1.RequestQueryBuilder.create({
                filter: composeFilter(filter),
                or: composeFilter(orFilter || {}),
            })
                .setLimit(perPage)
                .setPage(page)
                .sortBy(params.sort)
                .setOffset((page - 1) * perPage)
                .query();
            var query = mergeEncodedQueries(encodedQueryParams, encodedQueryFilter);
            var url = "".concat(apiUrl, "/").concat(resource, "?").concat(query);
            return httpClient(url).then(function (_a) {
                var json = _a.json;
                return ({
                    data: json.data,
                    total: json.total,
                });
            });
        },
        getOne: function (resource, params) {
            return httpClient("".concat(apiUrl, "/").concat(resource, "/").concat(params.id)).then(function (_a) {
                var json = _a.json;
                return ({
                    data: json,
                });
            });
        },
        getMany: function (resource, params) {
            var query = crud_request_1.RequestQueryBuilder.create()
                .setFilter({
                field: 'id',
                operator: crud_request_1.CondOperator.IN,
                value: "".concat(params.ids),
            })
                .query();
            var url = "".concat(apiUrl, "/").concat(resource, "?").concat(query);
            return httpClient(url).then(function (_a) {
                var json = _a.json;
                return ({ data: json.data || json });
            });
        },
        getManyReference: function (resource, params) {
            var _a = params.pagination, page = _a.page, perPage = _a.perPage;
            var _b = params.filter || {}, queryParams = _b.q, otherFilters = __rest(_b, ["q"]);
            var filter = composeFilter(otherFilters);
            filter.push({
                field: params.target,
                operator: crud_request_1.CondOperator.EQUALS,
                value: params.id,
            });
            var encodedQueryParams = composeQueryParams(queryParams);
            var encodedQueryFilter = crud_request_1.RequestQueryBuilder.create({
                filter: filter,
            })
                .sortBy(params.sort)
                .setLimit(perPage)
                .setOffset((page - 1) * perPage)
                .query();
            var query = mergeEncodedQueries(encodedQueryParams, encodedQueryFilter);
            var url = "".concat(apiUrl, "/").concat(resource, "?").concat(query);
            return httpClient(url).then(function (_a) {
                var json = _a.json;
                return ({
                    data: json.data,
                    total: json.total,
                });
            });
        },
        update: function (resource, params) {
            // no need to send all fields, only updated fields are enough
            var data = countDiff(params.data, params.previousData);
            return httpClient("".concat(apiUrl, "/").concat(resource, "/").concat(params.id), {
                method: 'PATCH',
                body: JSON.stringify(data),
            }).then(function (_a) {
                var json = _a.json;
                return ({ data: json });
            });
        },
        updateMany: function (resource, params) {
            return Promise.all(params.ids.map(function (id) {
                return httpClient("".concat(apiUrl, "/").concat(resource, "/").concat(id), {
                    method: 'PUT',
                    body: JSON.stringify(params.data),
                });
            })).then(function (responses) { return ({
                data: responses.map(function (_a) {
                    var json = _a.json;
                    return json;
                }),
            }); });
        },
        create: function (resource, params) {
            return httpClient("".concat(apiUrl, "/").concat(resource), {
                method: 'POST',
                body: JSON.stringify(params.data),
            }).then(function (_a) {
                var json = _a.json;
                return ({
                    data: __assign(__assign(__assign({}, params.data), json), { id: json.id || params.data.id }),
                });
            });
        },
        delete: function (resource, params) {
            return httpClient("".concat(apiUrl, "/").concat(resource, "/").concat(params.id), {
                method: 'DELETE',
            }).then(function (_a) {
                var json = _a.json;
                return ({ data: __assign(__assign({}, json), { id: params.id }) });
            });
        },
        deleteMany: function (resource, params) {
            return Promise.all(params.ids.map(function (id) {
                return httpClient("".concat(apiUrl, "/").concat(resource, "/").concat(id), {
                    method: 'DELETE',
                });
            })).then(function (responses) { return ({ data: responses.map(function (_a) {
                    var json = _a.json;
                    return json;
                }) }); });
        },
    });
});
