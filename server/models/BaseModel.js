/**
 * Base Model — Shared database operations for all models
 * No hard-coding, fully dynamic query builder
 */
const { getMySQLPool } = require('../config/db.mysql');
const { v4: uuidv4 } = require('uuid');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  get pool() {
    return getMySQLPool();
  }

  /**
   * Find a single record by ID (tenant-scoped)
   */
  async findById(id, tenantId = null) {
    const conditions = ['id = ?'];
    const params = [id];
    if (tenantId) {
      conditions.push('tenant_id = ?');
      params.push(tenantId);
    }
    const [rows] = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE ${conditions.join(' AND ')} LIMIT 1`,
      params
    );
    return rows[0] || null;
  }

  /**
   * Find records matching conditions
   */
  async findWhere(conditions = {}, options = {}) {
    const { orderBy = 'created_at', order = 'DESC', limit, offset } = options;
    const where = [];
    const params = [];

    for (const [key, val] of Object.entries(conditions)) {
      if (val === null) {
        where.push(`${key} IS NULL`);
      } else if (Array.isArray(val)) {
        where.push(`${key} IN (${val.map(() => '?').join(',')})`);
        params.push(...val);
      } else {
        where.push(`${key} = ?`);
        params.push(val);
      }
    }

    let sql = `SELECT * FROM ${this.tableName}`;
    if (where.length > 0) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ` ORDER BY ${orderBy} ${order}`;
    if (limit) {
      sql += ` LIMIT ?`;
      params.push(limit);
    }
    if (offset) {
      sql += ` OFFSET ?`;
      params.push(offset);
    }

    const [rows] = await this.pool.query(sql, params);
    return rows;
  }

  /**
   * Count records matching conditions
   */
  async count(conditions = {}) {
    const where = [];
    const params = [];

    for (const [key, val] of Object.entries(conditions)) {
      if (val === null) {
        where.push(`${key} IS NULL`);
      } else {
        where.push(`${key} = ?`);
        params.push(val);
      }
    }

    let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    if (where.length > 0) sql += ` WHERE ${where.join(' AND ')}`;

    const [[{ total }]] = await this.pool.query(sql, params);
    return total;
  }

  /**
   * Insert a new record
   */
  async create(data) {
    const id = data.id || uuidv4();
    data.id = id;

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.map(k => this.toSnakeCase(k)).join(', ');

    await this.pool.query(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
      values
    );

    return this.findById(id);
  }

  /**
   * Update a record by ID
   */
  async update(id, data, tenantId = null) {
    const sets = [];
    const params = [];

    for (const [key, val] of Object.entries(data)) {
      sets.push(`${this.toSnakeCase(key)} = ?`);
      params.push(val);
    }

    const conditions = ['id = ?'];
    params.push(id);
    if (tenantId) {
      conditions.push('tenant_id = ?');
      params.push(tenantId);
    }

    await this.pool.query(
      `UPDATE ${this.tableName} SET ${sets.join(', ')} WHERE ${conditions.join(' AND ')}`,
      params
    );

    return this.findById(id, tenantId);
  }

  /**
   * Soft delete (set is_active = 0) or hard delete
   */
  async delete(id, tenantId = null, soft = false) {
    const conditions = ['id = ?'];
    const params = [id];
    if (tenantId) {
      conditions.push('tenant_id = ?');
      params.push(tenantId);
    }

    if (soft) {
      await this.pool.query(
        `UPDATE ${this.tableName} SET is_active = 0 WHERE ${conditions.join(' AND ')}`,
        params
      );
    } else {
      await this.pool.query(
        `DELETE FROM ${this.tableName} WHERE ${conditions.join(' AND ')}`,
        params
      );
    }
    return true;
  }

  /**
   * Paginated list with search
   */
  async paginate(tenantId, { page = 1, limit = 20, search = '', searchFields = [], filters = {}, orderBy = 'created_at', order = 'DESC' }) {
    const where = ['tenant_id = ?'];
    const params = [tenantId];

    // Search
    if (search && searchFields.length > 0) {
      const searchConditions = searchFields.map(f => `${f} LIKE ?`);
      where.push(`(${searchConditions.join(' OR ')})`);
      searchFields.forEach(() => params.push(`%${search}%`));
    }

    // Filters
    for (const [key, val] of Object.entries(filters)) {
      if (val !== undefined && val !== '' && val !== null) {
        where.push(`${this.toSnakeCase(key)} = ?`);
        params.push(val);
      }
    }

    const whereClause = where.join(' AND ');
    const offset = (page - 1) * limit;

    // Count
    const [[{ total }]] = await this.pool.query(
      `SELECT COUNT(*) as total FROM ${this.tableName} WHERE ${whereClause}`,
      params
    );

    // Data
    const [rows] = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause} ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Execute raw query (for complex joins, aggregations)
   */
  async raw(sql, params = []) {
    const [rows] = await this.pool.query(sql, params);
    return rows;
  }

  /**
   * Convert camelCase to snake_case
   */
  toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = BaseModel;
