import bcrypt from 'bcryptjs';
import { createModel } from './supabaseModel.js';

const beforeCreate = async (payload) => {
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 12);
  }
  if (payload.email) payload.email = String(payload.email).toLowerCase();
};

const UserModel = createModel('users', { beforeCreate });

// Expose helper methods used by controllers to mimic Mongoose API
export default {
  ...UserModel,
  findById(id) {
    return UserModel.findById(id);
  },
  findOne(q = {}) {
    return UserModel.findOne(q);
  },
  async create(doc) {
    return UserModel.create(doc);
  },
};
