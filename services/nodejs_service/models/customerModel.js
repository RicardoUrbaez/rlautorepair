class CustomerModel {
  constructor() {
    this.customers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0101',
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-0102',
        address: '456 Oak Ave',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702'
      }
    ];
  }

  getAll() {
    return [...this.customers];
  }

  getById(id) {
    return this.customers.find(customer => customer.id === id);
  }

  create(customerData) {
    const newCustomer = {
      id: String(this.customers.length + 1),
      ...customerData,
      createdAt: new Date().toISOString()
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  update(id, updates) {
    const index = this.customers.findIndex(customer => customer.id === id);
    if (index === -1) return null;
    
    this.customers[index] = {
      ...this.customers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.customers[index];
  }

  delete(id) {
    const index = this.customers.findIndex(customer => customer.id === id);
    if (index === -1) return null;
    
    const deleted = this.customers.splice(index, 1)[0];
    return deleted;
  }

  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.customers.filter(customer => 
      customer.name.toLowerCase().includes(lowerQuery) ||
      customer.email.toLowerCase().includes(lowerQuery) ||
      (customer.phone && customer.phone.includes(query))
    );
  }

  getByEmail(email) {
    return this.customers.find(customer => customer.email === email);
  }
}

module.exports = new CustomerModel();
