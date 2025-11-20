class Validator {
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone) {
    const phoneRegex = /^\d{3}-\d{4}$|^\d{10}$/;
    return phoneRegex.test(phone.replace(/[-()\s]/g, ''));
  }

  static isValidZipCode(zipCode) {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  }

  static isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  static sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
  }

  static validateAppointmentData(data) {
    const errors = [];

    if (!data.customerId) {
      errors.push('Customer ID is required');
    }

    if (!data.serviceType) {
      errors.push('Service type is required');
    }

    if (!data.scheduledDate || !this.isValidDate(data.scheduledDate)) {
      errors.push('Valid scheduled date is required');
    }

    if (!data.scheduledTime) {
      errors.push('Scheduled time is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateCustomerData(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Invalid phone number format');
    }

    if (data.zipCode && !this.isValidZipCode(data.zipCode)) {
      errors.push('Invalid zip code format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = Validator;
