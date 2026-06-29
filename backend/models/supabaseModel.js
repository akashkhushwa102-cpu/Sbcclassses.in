import { supabase, supabaseAdmin } from '../config/supabase.js';
import bcrypt from 'bcryptjs';

class ModelInstance {
  constructor(table, data) {
    this._table = table;
    Object.assign(this, data || {});
  }

  toObject() {
    const copy = { ...this };
    delete copy._table;
    return copy;
  }

  async save() {
    const id = this.id || this._id;
    const payload = { ...this.toObject() };
    delete payload.id;
    delete payload._id;
    const { data, error } = await supabase
      .from(this._table)
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    Object.assign(this, data);
    return this;
  }

  // bcrypt compare helper if password exists
  async comparePassword(candidate) {
    if (!this.password) return false;
    return bcrypt.compare(candidate, this.password);
  }
}

class Query {
  constructor(table, filter = {}) {
    this._table = table;
    this._filter = filter;
    this._includePassword = false;
  }

  select(sel) {
    if (typeof sel === 'string' && sel.includes('password')) this._includePassword = true;
    return this.exec();
  }

  async exec() {
    let q = supabase.from(this._table).select('*');
    for (const [k, v] of Object.entries(this._filter)) {
      q = q.eq(k, v);
    }
    // single result expected
    const { data, error } = await q.single();
    if (error && error.code !== 'PGRST116') throw error; // ignore no rows
    if (!data) return null;
    // remove password unless requested
    if (!this._includePassword && data.password) delete data.password;
    const inst = new ModelInstance(this._table, data);
    return inst;
  }

  // async lean() {
  //   const inst = await this.exec();
  //   return inst ? inst.toObject() : null;
  // }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

export function createModel(tableName, opts = {}) {
  return {
    // find one matching query
    findOne(query = {}) {
      return new Query(tableName, query);
    },

    // find multiple results with chaining (sort, limit, skip)
    find(query = {}) {
      const self = {
        _table: tableName,
        _filter: query,
        _order: null,
        _limit: null,
        _skip: null,
        sort(orderObj) {
          // accept { field: 1/-1 } or string field
          this._order = orderObj;
          return this;
        },
        limit(n) {
          this._limit = Number(n) || null;
          return this;
        },
        skip(n) {
          this._skip = Number(n) || null;
          return this;
        },
        async exec() {
          let q = supabase.from(this._table).select('*');
          for (const [k, v] of Object.entries(this._filter)) {
            // basic handling: $gt/$lt not supported here; exact match
            q = q.eq(k, v);
          }
          if (this._order) {
            const [field, dir] = Object.entries(this._order)[0];
            q = q.order(field, { ascending: dir === 1 });
          }
          if (this._limit != null && this._skip != null) {
            q = q.range(this._skip, this._skip + this._limit - 1);
          } else if (this._limit != null) {
            q = q.limit(this._limit);
          } else if (this._skip != null) {
            q = q.range(this._skip, this._skip + 999999);
          }
          const { data, error } = await q;
          if (error && error.code !== 'PGRST116') throw error;
          return data || [];
        },
        then(resolve, reject) {
          return this.exec().then(resolve, reject);
        },
      };
      return self;
    },

    // Count documents matching simple query (supports basic operators)
    async countDocuments(query = {}) {
      let q = supabase.from(tableName).select('id', { head: true, count: 'exact' });
      for (const [k, v] of Object.entries(query)) {
        if (v && typeof v === 'object') {
          if ('$gt' in v) q = q.gt(k, v.$gt);
          else if ('$gte' in v) q = q.gte(k, v.$gte);
          else if ('$lt' in v) q = q.lt(k, v.$lt);
          else if ('$lte' in v) q = q.lte(k, v.$lte);
          else if ('$in' in v) q = q.in(k, v.$in);
          else q = q.eq(k, v);
        } else {
          q = q.eq(k, v);
        }
      }
      const { count, error } = await q;
      if (error && error.code !== 'PGRST116') throw error;
      return Number(count || 0);
    },

    // Very small aggregate helper supporting simple $match + $group {$sum: '$field'}
    async aggregate(pipeline = []) {
      if (!Array.isArray(pipeline) || pipeline.length === 0) return [];
      const matchStage = pipeline.find((s) => s.$match) || {};
      const groupStage = pipeline.find((s) => s.$group) || {};
      const match = matchStage.$match || {};
      const group = groupStage.$group || {};
      // support only a single sum over a field
      const sumEntry = Object.entries(group).find(([, v]) => v && v.$sum);
      if (sumEntry) {
        const fieldToSum = sumEntry[1].$sum.replace(/\$/g, '');
        let q = supabase.from(tableName).select(`${fieldToSum}`, { count: 'exact' });
        for (const [k, v] of Object.entries(match)) {
          if (v && typeof v === 'object') {
            if ('$gte' in v) q = q.gte(k, v.$gte);
            else if ('$gt' in v) q = q.gt(k, v.$gt);
            else q = q.eq(k, v);
          } else {
            q = q.eq(k, v);
          }
        }
        const { data, error } = await q;
        if (error && error.code !== 'PGRST116') throw error;
        const total = (data || []).reduce((s, row) => s + Number(row[fieldToSum] || 0), 0);
        return [{ total }];
      }
      return [];
    },

    findById(id) {
      const obj = {
        _table: tableName,
        _id: id,
        _includePassword: false,
        select(sel) {
          if (typeof sel === 'string' && sel.includes('password')) this._includePassword = true;
          return this.exec();
        },
        async exec() {
          const { data, error } = await supabase.from(this._table).select('*').eq('id', this._id).single();
          if (error && error.code !== 'PGRST116') throw error;
          if (!data) return null;
          if (!this._includePassword && data.password) delete data.password;
          return new ModelInstance(this._table, data);
        },
        async lean() {
          const inst = await this.exec();
          return inst ? inst.toObject() : null;
        },
        then(resolve, reject) {
          return this.exec().then(resolve, reject);
        },
      };
      return obj;
    },

    async create(doc) {
      // allow hook to modify doc (e.g., hash password)
      const payload = { ...doc };
      if (opts.beforeCreate) {
        await opts.beforeCreate(payload);
      }
      const { data, error } = await supabase.from(tableName).insert([payload]).select().single();
      if (error) throw error;
      if (data.password) delete data.password;
      return new ModelInstance(tableName, data);
    },

    async update(id, updateData) {
      const { data, error } = await supabase.from(tableName).update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return new ModelInstance(tableName, data);
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    async findByIdAndUpdate(id, updateData, _opts = {}) {
      return this.update(id, updateData);
    },

    async findByIdAndDelete(id) {
      const item = await this.findById(id).exec();
      if (!item) return null;
      await this.delete(id);
      return item;
    },

    async findOneAndUpdate(filter = {}, updateData = {}, opts = {}) {
      const existing = await this.findOne(filter).exec();
      if (existing) {
        const id = existing.id || existing._id;
        const updated = await this.update(id, updateData);
        return updated;
      }
      if (opts.upsert) {
        const created = await this.create({ ...filter, ...updateData });
        return created;
      }
      return null;
    },
  };
}
