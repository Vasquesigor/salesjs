/**
 *
 */
import { Logger, getLogger } from './util/logger';
import {
  Record,
  DescribeLayoutResult,
  DescribeCompactLayoutsResult,
  DescribeApprovalLayoutsResult,
  Optional,
  DmlOptions,
  SaveResult,
  RetrieveOptions,
} from './types';
import Connection from './connection';
import RecordReference from './record-reference';
import Query, { ResponseTargets } from './query';
import QuickAction from './quick-action';
import { QueryFieldsParam, QueryOptions, QueryConfigParam } from './query';
import { QueryCondition, SortConfig } from './soql-builder';
import { CachedFunction } from './cache';

export type FindOptions = Partial<
  QueryOptions & {
    limit: number;
    offset: number;
    sort: SortConfig;
    includes: { [name: string]: QueryConfigParam };
  }
>;

/**
 * A class for organizing all SObject access
 */
export default class SObject {
  static _logger = getLogger('sobject');

  type: string;
  _conn: Connection;
  _logger: Logger;

  // layouts: (ln?: string) => Promise<DescribeLayoutResult>;
  layouts$: CachedFunction<(ln?: string) => Promise<DescribeLayoutResult>>;
  layouts$$: CachedFunction<(ln?: string) => DescribeLayoutResult>;
  // compactLayouts: () => Promise<DescribeCompactLayoutsResult>;
  compactLayouts$: CachedFunction<() => Promise<DescribeCompactLayoutsResult>>;
  compactLayouts$$: CachedFunction<() => DescribeCompactLayoutsResult>;
  // approvalLayouts: () => Promise<DescribeApprovalLayoutsResult>;
  approvalLayouts$: CachedFunction<
    () => Promise<DescribeApprovalLayoutsResult>
  >;
  approvalLayouts$$: CachedFunction<() => DescribeCompactLayoutsResult>;

  /**
   *
   */
  constructor(conn: Connection, type: string) {
    this.type = type;
    this._conn = conn;
    this._logger = conn._logLevel
      ? SObject._logger.createInstance(conn._logLevel)
      : SObject._logger;
    const cache = this._conn.cache;
    const layoutCacheKey = (layoutName: string) =>
      layoutName
        ? `layouts.namedLayouts.${layoutName}`
        : `layouts.${this.type}`;
    const layouts = SObject.prototype.layouts;
    this.layouts = cache.createCachedFunction(layouts, this, {
      key: layoutCacheKey,
      strategy: 'NOCACHE',
    });
    this.layouts$ = cache.createCachedFunction(layouts, this, {
      key: layoutCacheKey,
      strategy: 'HIT',
    });
    this.layouts$$ = cache.createCachedFunction(layouts, this, {
      key: layoutCacheKey,
      strategy: 'IMMEDIATE',
    }) as any;
    const compactLayoutCacheKey = `compactLayouts.${this.type}`;
    const compactLayouts = SObject.prototype.compactLayouts;
    this.compactLayouts = cache.createCachedFunction(compactLayouts, this, {
      key: compactLayoutCacheKey,
      strategy: 'NOCACHE',
    });
    this.compactLayouts$ = cache.createCachedFunction(compactLayouts, this, {
      key: compactLayoutCacheKey,
      strategy: 'HIT',
    });
    this.compactLayouts$$ = cache.createCachedFunction(compactLayouts, this, {
      key: compactLayoutCacheKey,
      strategy: 'IMMEDIATE',
    }) as any;
    const approvalLayoutCacheKey = `approvalLayouts.${this.type}`;
    const approvalLayouts = SObject.prototype.approvalLayouts;
    this.approvalLayouts = cache.createCachedFunction(approvalLayouts, this, {
      key: approvalLayoutCacheKey,
      strategy: 'NOCACHE',
    });
    this.approvalLayouts$ = cache.createCachedFunction(approvalLayouts, this, {
      key: approvalLayoutCacheKey,
      strategy: 'HIT',
    });
    this.approvalLayouts$$ = cache.createCachedFunction(approvalLayouts, this, {
      key: approvalLayoutCacheKey,
      strategy: 'IMMEDIATE',
    }) as any;
  }

  /**
   * Create records
   */
  create(records: Record, options?: DmlOptions): Promise<SaveResult>;
  create(records: Record[], options?: DmlOptions): Promise<SaveResult[]>;
  create(
    records: Record | Record[],
    options?: DmlOptions,
  ): Promise<SaveResult | SaveResult[]>;
  async create(records: Record | Record[], options?: DmlOptions) {
    return this._conn.create(this.type, records, options);
  }

  /**
   * Synonym of SObject#create()
   */
  insert = this.create;

  /**
   * Retrieve specified records
   */
  retrieve(ids: string, options?: RetrieveOptions): Promise<Record>;
  retrieve(ids: string[], options?: RetrieveOptions): Promise<Record[]>;
  retrieve(
    ids: string | string[],
    options?: RetrieveOptions,
  ): Promise<Record | Record[]>;
  retrieve(ids: string | string[], options?: Object) {
    return this._conn.retrieve(this.type, ids, options);
  }

  /**
   * Update records
   */
  update(records: Record, options?: DmlOptions): Promise<SaveResult>;
  update(records: Record[], options?: DmlOptions): Promise<SaveResult[]>;
  update(
    records: Record | Record[],
    options?: DmlOptions,
  ): Promise<SaveResult | SaveResult[]>;
  update(records: Record | Record[], options?: DmlOptions) {
    return this._conn.update(this.type, records, options);
  }

  /**
   * Upsert records
   */
  upsert(
    records: Record,
    extIdField: string,
    options?: DmlOptions,
  ): Promise<SaveResult>;
  upsert(
    records: Record[],
    extIdField: string,
    options?: DmlOptions,
  ): Promise<SaveResult[]>;
  upsert(
    records: Record | Record[],
    extIdField: string,
    options?: DmlOptions,
  ): Promise<SaveResult | SaveResult[]>;
  upsert(records: Record | Record[], extIdField: string, options?: DmlOptions) {
    return this._conn.upsert(this.type, records, extIdField, options);
  }

  /**
   * Delete records
   */
  destroy(ids: string, options?: DmlOptions): Promise<SaveResult>;
  destroy(ids: string[], options?: DmlOptions): Promise<SaveResult[]>;
  destroy(
    ids: string | string[],
    options?: DmlOptions,
  ): Promise<SaveResult | SaveResult[]>;
  destroy(ids: string | string[], options?: DmlOptions) {
    return this._conn.destroy(this.type, ids, options);
  }

  /**
   * Synonym of SObject#destroy()
   */
  delete = this.destroy;

  /**
   * Synonym of SObject#destroy()
   */
  del = this.destroy;

  /**
   * Describe SObject metadata
   */
  describe() {
    return this._conn.describe(this.type);
  }

  /**
   *
   */
  describe$() {
    return this._conn.describe$(this.type);
  }

  /**
   *
   */
  describe$$() {
    return this._conn.describe$$(this.type);
  }

  /**
   * Get record representation instance by given id
   */
  record(id: string) {
    return new RecordReference(this._conn, this.type, id);
  }

  /**
   * Retrieve recently accessed records
   */
  recent() {
    return this._conn.recent(this.type);
  }

  /**
   * Retrieve the updated records
   */
  updated(start: string | Date, end: string | Date) {
    return this._conn.updated(this.type, start, end);
  }

  /**
   * Retrieve the deleted records
   */
  deleted(start: string | Date, end: string | Date) {
    return this._conn.deleted(this.type, start, end);
  }

  /**
   * Describe layout information for SObject
   */
  async layouts(layoutName?: string): Promise<DescribeLayoutResult> {
    const url = `/sobjects/${this.type}/describe/${
      layoutName ? `namedLayouts/${layoutName}` : 'layouts'
    }`;
    const body = await this._conn.request(url);
    return body as DescribeLayoutResult;
  }

  /**
   * @typedef {Object} CompactLayoutInfo
   * @prop {Array.<Object>} compactLayouts - Array of compact layouts
   * @prop {String} defaultCompactLayoutId - ID of default compact layout
   * @prop {Array.<Object>} recordTypeCompactLayoutMappings - Array of record type mappings
   */
  /**
   * Describe compact layout information defined for SObject
   *
   * @param {Callback.<CompactLayoutInfo>} [callback] - Callback function
   * @returns {Promise.<CompactLayoutInfo>}
   */
  async compactLayouts(): Promise<DescribeCompactLayoutsResult> {
    const url = `/sobjects/${this.type}/describe/compactLayouts`;
    const body = await this._conn.request(url);
    return body as DescribeCompactLayoutsResult;
  }

  /**
   * Describe compact layout information defined for SObject
   *
   * @param {Callback.<ApprovalLayoutInfo>} [callback] - Callback function
   * @returns {Promise.<ApprovalLayoutInfo>}
   */
  async approvalLayouts(): Promise<DescribeApprovalLayoutsResult> {
    const url = `/sobjects/${this.type}/describe/approvalLayouts`;
    const body = await this._conn.request(url);
    return body as DescribeApprovalLayoutsResult;
  }

  /**
   * Find and fetch records which matches given conditions
   */
  find(
    conditions?: Optional<QueryCondition>,
    fields?: Optional<QueryFieldsParam>,
    options: FindOptions = {},
  ): Query {
    const { sort, limit, offset, ...qoptions } = options;
    const config: QueryConfigParam = {
      fields: fields === null ? undefined : fields,
      includes: options.includes,
      table: this.type,
      conditions: conditions === null ? undefined : conditions,
      sort,
      limit,
      offset,
    };
    const query = new Query(this._conn, config, null, qoptions);
    query.setResponseTarget(ResponseTargets.Records);
    return query;
  }

  /**
   * Fetch one record which matches given conditions
   */
  findOne(
    conditions?: QueryCondition,
    fields?: QueryFieldsParam,
    options: Partial<QueryOptions> = {},
  ): Query {
    const query = this.find(
      conditions,
      fields,
      Object.assign({}, options, { limit: 1 }),
    );
    query.setResponseTarget(ResponseTargets.SingleRecord);
    return query;
  }

  /**
   * Find and fetch records only by specifying fields to fetch.
   */
  select(fields: QueryFieldsParam) {
    return this.find(null, fields);
  }

  /**
   * Count num of records which matches given conditions
   */
  count(conditions?: Optional<QueryCondition>) {
    const query = this.find(conditions, { 'count()': true });
    query.setResponseTarget(ResponseTargets.Count);
    return query;
  }

  /**
   * Returns the list of list views for the SObject
   *
   * @param {Callback.<ListViewsInfo>} [callback] - Callback function
   * @returns {Promise.<ListViewsInfo>}
   */
  listviews() {
    const url = `${this._conn._baseUrl()}/sobjects/${this.type}/listviews`;
    return this._conn.request(url);
  }

  /**
   * Returns the list view info in specifed view id
   *
   * @param {String} id - List view ID
   * @returns {ListView}
   */
  listview(id: string) {
    return new ListView(this._conn, this.type, id); // eslint-disable-line no-use-before-define
  }

  /**
   * Returns all registered quick actions for the SObject
   *
   * @param {Callback.<Array.<QuickAction~QuickActionInfo>>} [callback] - Callback function
   * @returns {Promise.<Array.<QuickAction~QuickActionInfo>>}
   */
  quickActions() {
    return this._conn.request(`/sobjects/${this.type}/quickActions`);
  }

  /**
   * Get reference for specified quick aciton in the SObject
   *
   * @param {String} actionName - Name of the quick action
   * @returns {QuickAction}
   */
  quickAction(actionName: string) {
    return new QuickAction(
      this._conn,
      `/sobjects/${this.type}/quickActions/${actionName}`,
    );
  }
}

/**
 * A class for organizing list view information
 *
 * @protected
 * @class ListView
 * @param {Connection} conn - Connection instance
 * @param {SObject} type - SObject type
 * @param {String} id - List view ID
 */
class ListView {
  _conn: Connection;
  type: string;
  id: string;

  /**
   *
   */
  constructor(conn: Connection, type: string, id: string) {
    this._conn = conn;
    this.type = type;
    this.id = id;
  }

  /**
   * Executes query for the list view and returns the resulting data and presentation information.
   */
  results() {
    const url = `${this._conn._baseUrl()}/sobjects/${this.type}/listviews/${
      this.id
    }/results`;
    return this._conn.request(url);
  }

  /**
   * Returns detailed information about a list view
   */
  describe(options: { headers?: { [name: string]: string } } = {}) {
    const url = `${this._conn._baseUrl()}/sobjects/${this.type}/listviews/${
      this.id
    }/describe`;
    return this._conn.request({ method: 'GET', url, headers: options.headers });
  }

  /**
   * Explain plan for executing list view
   */
  explain() {
    const url = `/query/?explain=${this.id}`;
    return this._conn.request(url);
  }
}

// TODO Bulk