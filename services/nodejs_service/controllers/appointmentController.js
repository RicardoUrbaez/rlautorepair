const appointments = require('../models/appointmentModel');

class AppointmentController {
  getAllAppointments(req, res) {
    try {
      const allAppointments = appointments.getAll();
      res.json({
        success: true,
        count: allAppointments.length,
        data: allAppointments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  getAppointmentById(req, res) {
    try {
      const appointment = appointments.getById(req.params.id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }
      res.json({
        success: true,
        data: appointment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  createAppointment(req, res) {
    try {
      const newAppointment = appointments.create(req.body);
      res.status(201).json({
        success: true,
        data: newAppointment
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  updateAppointment(req, res) {
    try {
      const updated = appointments.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
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

  deleteAppointment(req, res) {
    try {
      const deleted = appointments.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }
      res.json({
        success: true,
        message: 'Appointment deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AppointmentController();
