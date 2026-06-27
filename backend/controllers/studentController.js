import { StudentModel } from '../models/student.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const studentController = {
  // Get all students
  async getAll(req, res) {
    try {
      const students = await StudentModel.getAll();
      res.json(successResponse(students, 'Students retrieved successfully'));
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json(errorResponse('Failed to retrieve students'));
    }
  },

  // Get student by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const student = await StudentModel.getById(id);
      res.json(successResponse(student, 'Student retrieved successfully'));
    } catch (error) {
      console.error('Error:', error);
      res.status(404).json(errorResponse('Student not found'));
    }
  },

  // Update student
  async update(req, res) {
    try {
      const { id } = req.params;
      const student = await StudentModel.update(id, req.body);
      res.json(successResponse(student, 'Student updated successfully'));
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json(errorResponse('Failed to update student'));
    }
  },

  // Delete student
  async delete(req, res) {
    try {
      const { id } = req.params;
      await StudentModel.delete(id);
      res.json(successResponse(null, 'Student deleted successfully'));
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json(errorResponse('Failed to delete student'));
    }
  },

  // Get students by batch
  async getByBatch(req, res) {
    try {
      const { batchId } = req.params;
      const students = await StudentModel.getByBatch(batchId);
      res.json(successResponse(students, 'Students retrieved successfully'));
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json(errorResponse('Failed to retrieve students'));
    }
  }
};
