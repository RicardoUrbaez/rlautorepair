class AppointmentModel {
  constructor() {
    this.appointments = [
      {
        id: '1',
        customerId: '1',
        vehicleId: 'v1',
        serviceType: 'Oil Change',
        scheduledDate: '2025-01-20',
        scheduledTime: '10:00 AM',
        status: 'scheduled',
        notes: 'Regular maintenance'
      },
      {
        id: '2',
        customerId: '2',
        vehicleId: 'v2',
        serviceType: 'Brake Repair',
        scheduledDate: '2025-01-21',
        scheduledTime: '2:00 PM',
        status: 'confirmed',
        notes: 'Customer reported squeaking noise'
      }
    ];
  }

  getAll() {
    return [...this.appointments];
  }

  getById(id) {
    return this.appointments.find(apt => apt.id === id);
  }

  create(appointmentData) {
    const newAppointment = {
      id: String(this.appointments.length + 1),
      ...appointmentData,
      createdAt: new Date().toISOString()
    };
    this.appointments.push(newAppointment);
    return newAppointment;
  }

  update(id, updates) {
    const index = this.appointments.findIndex(apt => apt.id === id);
    if (index === -1) return null;
    
    this.appointments[index] = {
      ...this.appointments[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.appointments[index];
  }

  delete(id) {
    const index = this.appointments.findIndex(apt => apt.id === id);
    if (index === -1) return null;
    
    const deleted = this.appointments.splice(index, 1)[0];
    return deleted;
  }

  getByCustomerId(customerId) {
    return this.appointments.filter(apt => apt.customerId === customerId);
  }

  getByStatus(status) {
    return this.appointments.filter(apt => apt.status === status);
  }
}

module.exports = new AppointmentModel();
