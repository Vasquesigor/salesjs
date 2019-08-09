/**
 *
 */
import Connection from './connection';
import { Record, RetrieveOptions, DmlOptions } from './types';

/**
 * Remote reference to record information
 */
export default class RecordReference {
  type: string;
  id: string;
  _conn: Connection;

  /**
   *
   */
  constructor(conn: Connection, type: string, id: string) {
    this._conn = conn;
    this.type = type;
    this.id = id;
  }

  /**
   * Retrieve record field information
   */
  retrieve(options?: RetrieveOptions) {
    return this._conn.retrieve(this.type, this.id, options);
  }

  /**
   * Update record field information
   */
  async update(record: Record, options?: DmlOptions) {
    const _record = { ...record, Id: this.id };
    return this._conn.update(this.type, _record, options);
  }

  /**
   * Delete record field
   */
  destroy(options?: DmlOptions) {
    return this._conn.destroy(this.type, this.id, options);
  }

  /**
   * Synonym of Record#destroy()
   */
  delete = this.destroy;

  /**
   * Synonym of Record#destroy()
   */
  del = this.destroy;

  /**
   * Get blob field as stream
   *
   * @param {String} fieldName - Blob field name
   * @returns {stream.Stream}
   */
  blob(fieldName: string) {
    const url = [
      this._conn._baseUrl(),
      'sobjects',
      this.type,
      this.id,
      fieldName,
    ].join('/');
    return this._conn.request(url).stream();
  }
}