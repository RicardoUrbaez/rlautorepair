package com.rlautoshop.service;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * CustomerManager - Handles customer data operations
 * Demonstrates CRUD operations and data management in Java
 */
public class CustomerManager {
    
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    private List<Customer> customers;
    
    public CustomerManager() {
        this.customers = new ArrayList<>();
    }
    
    /**
     * Customer entity class
     */
    public static class Customer {
        private final String id;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private Address address;
        private List<String> vehicleIds;
        
        public Customer(String firstName, String lastName, String email) {
            this.id = UUID.randomUUID().toString();
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.vehicleIds = new ArrayList<>();
        }
        
        public String getId() { return id; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public Address getAddress() { return address; }
        public void setAddress(Address address) { this.address = address; }
        public List<String> getVehicleIds() { return vehicleIds; }
        public void addVehicle(String vehicleId) { this.vehicleIds.add(vehicleId); }
        
        public String getFullName() {
            return firstName + " " + lastName;
        }
    }
    
    /**
     * Address value object
     */
    public static class Address {
        private String street;
        private String city;
        private String state;
        private String zipCode;
        
        public Address(String street, String city, String state, String zipCode) {
            this.street = street;
            this.city = city;
            this.state = state;
            this.zipCode = zipCode;
        }
        
        // Getters
        public String getStreet() { return street; }
        public String getCity() { return city; }
        public String getState() { return state; }
        public String getZipCode() { return zipCode; }
        
        @Override
        public String toString() {
            return street + ", " + city + ", " + state + " " + zipCode;
        }
    }
    
    /**
     * Add a new customer
     */
    public Customer addCustomer(String firstName, String lastName, String email) {
        Customer customer = new Customer(firstName, lastName, email);
        customers.add(customer);
        return customer;
    }
    
    /**
     * Find customer by ID
     */
    public Optional<Customer> findById(String id) {
        return customers.stream()
                .filter(c -> c.getId().equals(id))
                .findFirst();
    }
    
    /**
     * Find customers by email
     */
    public List<Customer> findByEmail(String email) {
        return customers.stream()
                .filter(c -> c.getEmail().equalsIgnoreCase(email))
                .collect(Collectors.toList());
    }
    
    /**
     * Search customers by name
     */
    public List<Customer> searchByName(String searchTerm) {
        String lower = searchTerm.toLowerCase();
        return customers.stream()
                .filter(c -> c.getFullName().toLowerCase().contains(lower))
                .collect(Collectors.toList());
    }
    
    /**
     * Get all customers
     */
    public List<Customer> getAllCustomers() {
        return new ArrayList<>(customers);
    }
    
    /**
     * Update customer information
     */
    public boolean updateCustomer(String id, String firstName, String lastName, String email) {
        Optional<Customer> customerOpt = findById(id);
        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            customer.setFirstName(firstName);
            customer.setLastName(lastName);
            customer.setEmail(email);
            return true;
        }
        return false;
    }
    
    /**
     * Delete customer
     */
    public boolean deleteCustomer(String id) {
        return customers.removeIf(c -> c.getId().equals(id));
    }
    
    /**
     * Demo execution
     */
    public static void main(String[] args) {
        System.out.println("RL Auto Shop - Customer Manager");
        System.out.println("================================\n");
        
        CustomerManager manager = new CustomerManager();
        
        // Create customers
        Customer customer1 = manager.addCustomer("John", "Smith", "john.smith@email.com");
        customer1.setPhone("555-0101");
        customer1.setAddress(new Address("123 Main St", "Springfield", "IL", "62701"));
        
        Customer customer2 = manager.addCustomer("Sarah", "Johnson", "sarah.j@email.com");
        customer2.setPhone("555-0102");
        customer2.setAddress(new Address("456 Oak Ave", "Springfield", "IL", "62702"));
        
        Customer customer3 = manager.addCustomer("Mike", "Williams", "mike.w@email.com");
        customer3.setPhone("555-0103");
        
        System.out.println("Created " + manager.getAllCustomers().size() + " customers\n");
        
        // Display all customers
        System.out.println("All Customers:");
        for (Customer c : manager.getAllCustomers()) {
            System.out.println(gson.toJson(c));
        }
        System.out.println();
        
        // Search by name
        System.out.println("Search results for 'John':");
        List<Customer> searchResults = manager.searchByName("John");
        searchResults.forEach(c -> System.out.println("  - " + c.getFullName() + " (" + c.getEmail() + ")"));
        System.out.println();
        
        // Find by ID
        Optional<Customer> found = manager.findById(customer1.getId());
        if (found.isPresent()) {
            System.out.println("Found customer by ID:");
            System.out.println(gson.toJson(found.get()));
        }
        
        System.out.println("\nCustomer management demonstration complete.");
    }
}
