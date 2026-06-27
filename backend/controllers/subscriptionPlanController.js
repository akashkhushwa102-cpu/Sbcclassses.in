import { SubscriptionPlanModel } from '../models/subscriptionPlan.js';

export const SubscriptionPlanController = {
  /**
   * GET /api/subscription-plans
   * Get all active subscription plans
   */
  async getAllPlans(req, res) {
    try {
      const plans = await SubscriptionPlanModel.getAll();
      
      return res.status(200).json({
        success: true,
        plans,
        count: plans.length
      });
    } catch (error) {
      console.error('Error fetching plans:', error);
      return res.status(500).json({
        error: 'Failed to fetch subscription plans',
        details: error.message
      });
    }
  },

  /**
   * GET /api/subscription-plans/:id
   * Get plan by ID
   */
  async getPlanById(req, res) {
    try {
      const { id } = req.params;
      
      const plan = await SubscriptionPlanModel.getById(id);
      
      if (!plan) {
        return res.status(404).json({
          error: 'Plan not found'
        });
      }

      return res.status(200).json({
        success: true,
        plan
      });
    } catch (error) {
      console.error('Error fetching plan:', error);
      return res.status(500).json({
        error: 'Failed to fetch plan',
        details: error.message
      });
    }
  },

  /**
   * POST /api/subscription-plans
   * Create new subscription plan (Admin only)
   * Body: { planType, displayName, description, priceInPaise, durationDays, displayOrder, features, isActive }
   */
  async createPlan(req, res) {
    try {
      const { planType, displayName, description, priceInPaise, durationDays, displayOrder = 999, features = [], isActive = true } = req.body;

      // Validate required fields
      if (!planType || !displayName || !priceInPaise || !durationDays) {
        return res.status(400).json({
          error: 'Missing required fields: planType, displayName, priceInPaise, durationDays'
        });
      }

      // Check if plan type already exists
      const existingPlan = await SubscriptionPlanModel.getByType(planType);
      if (existingPlan) {
        return res.status(409).json({
          error: `Plan type "${planType}" already exists`
        });
      }

      const plan = await SubscriptionPlanModel.create({
        planType,
        displayName,
        description: description || '',
        priceInPaise,
        durationDays,
        displayOrder,
        features: features || [],
        isActive,
        paymentMethods: ['paytm', 'upi', 'card', 'net_banking'], // Default payment methods
        currencyCode: 'INR'
      });

      return res.status(201).json({
        success: true,
        message: 'Plan created successfully',
        plan
      });
    } catch (error) {
      console.error('Error creating plan:', error);
      return res.status(500).json({
        error: 'Failed to create plan',
        details: error.message
      });
    }
  },

  /**
   * PUT /api/subscription-plans/:id
   * Update subscription plan (Admin only)
   */
  async updatePlan(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate plan exists
      const plan = await SubscriptionPlanModel.getById(id);
      if (!plan) {
        return res.status(404).json({
          error: 'Plan not found'
        });
      }

      const updatedPlan = await SubscriptionPlanModel.update(id, updateData);

      return res.status(200).json({
        success: true,
        message: 'Plan updated successfully',
        plan: updatedPlan
      });
    } catch (error) {
      console.error('Error updating plan:', error);
      return res.status(500).json({
        error: 'Failed to update plan',
        details: error.message
      });
    }
  },

  /**
   * DELETE /api/subscription-plans/:id
   * Delete subscription plan (Admin only)
   */
  async deletePlan(req, res) {
    try {
      const { id } = req.params;

      // Validate plan exists
      const plan = await SubscriptionPlanModel.getById(id);
      if (!plan) {
        return res.status(404).json({
          error: 'Plan not found'
        });
      }

      await SubscriptionPlanModel.delete(id);

      return res.status(200).json({
        success: true,
        message: 'Plan deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      return res.status(500).json({
        error: 'Failed to delete plan',
        details: error.message
      });
    }
  },

  /**
   * POST /api/subscription-plans/:id/restore
   * Restore deleted plan (Admin only)
   */
  async restorePlan(req, res) {
    try {
      const { id } = req.params;

      const plan = await SubscriptionPlanModel.restore(id);

      return res.status(200).json({
        success: true,
        message: 'Plan restored successfully',
        plan
      });
    } catch (error) {
      console.error('Error restoring plan:', error);
      return res.status(500).json({
        error: 'Failed to restore plan',
        details: error.message
      });
    }
  },

  /**
   * GET /api/subscription-plans/admin/all
   * Get all plans including inactive (Admin only)
   */
  async getAllPlansAdmin(req, res) {
    try {
      const plans = await SubscriptionPlanModel.getAllWithInactive();

      return res.status(200).json({
        success: true,
        plans,
        count: plans.length
      });
    } catch (error) {
      console.error('Error fetching all plans:', error);
      return res.status(500).json({
        error: 'Failed to fetch plans',
        details: error.message
      });
    }
  }
};
