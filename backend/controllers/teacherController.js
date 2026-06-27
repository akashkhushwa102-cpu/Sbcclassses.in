import { TeacherModel } from '../models/teacher.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const teacherController = {
  // Get all teachers
  async getAll(req, res) {
    try {
      const teachers = await TeacherModel.getAll();
      res.json(successResponse(teachers, 'Teachers retrieved successfully'));
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json(errorResponse('Failed to retrieve teachers'));
    }
  },

  // Get teacher by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const teacher = await TeacherModel.getById(id);
      res.json(successResponse(teacher, 'Teacher retrieved successfully'));
    } catch (error) {
      console.error('Error:', error);
      res.status(404).json(errorResponse('Teacher not found'));
    }
  },

  // Update teacher
  async update(req, res) {
    try {
      const { id } = req.params;
      const teacher = await TeacherModel.update(id, req.body);
      res.json(successResponse(teacher, 'Teacher updated successfully'));
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json(errorResponse('Failed to update teacher'));
    }
  },

  // Delete teacher
  async delete(req, res) {
    try {
      const { id } = req.params;
      await TeacherModel.delete(id);
      res.json(successResponse(null, 'Teacher deleted successfully'));
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json(errorResponse('Failed to delete teacher'));
    }
  }
};
