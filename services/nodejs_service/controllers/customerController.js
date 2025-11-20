const customers = require('../models/customerModel');

class CustomerController {
  getAllCustomers(req, res) {
    try {
      const allCustomers = customers.getAll();
      res.json({
        success: true,
        count: allCustomers.length,
        data: allCustomers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  getCustomerById(req, res) {
    try {
      const customer = customers.getById(req.params.id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  createCustomer(req, res) {
    try {
      const newCustomer = customers.create(req.body);
      res.status(201).json({
        success: true,
        data: newCustomer
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  updateCustomer(req, res) {
    try {
      const updated = customers.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  deleteCustomer(req, res) {
    try {
      const deleted = customers.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  searchCustomers(req, res) {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }
      const results = customers.search(query);
      res.json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CustomerController();
