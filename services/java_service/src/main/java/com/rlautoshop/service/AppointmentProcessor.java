package com.rlautoshop.service;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * AppointmentProcessor - Core business logic for appointment management
 * Demonstrates Java backend capabilities for the RL Auto Shop system
 */
public class AppointmentProcessor {
    
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    
    /**
     * Validates appointment scheduling constraints
     */
    public static class AppointmentValidator {
        
        public ValidationResult validateAppointment(Appointment appointment) {
            List<String> errors = new ArrayList<>();
            
            if (appointment.getCustomerName() == null || appointment.getCustomerName().trim().isEmpty()) {
                errors.add("Customer name is required");
            }
            
            if (appointment.getServiceType() == null || appointment.getServiceType().trim().isEmpty()) {
                errors.add("Service type is required");
            }
            
            if (appointment.getScheduledDate() == null) {
                errors.add("Scheduled date is required");
            } else if (appointment.getScheduledDate().isBefore(LocalDateTime.now())) {
                errors.add("Scheduled date cannot be in the past");
            }
            
            return new ValidationResult(errors.isEmpty(), errors);
        }
    }
    
    /**
     * Represents an appointment in the system
     */
    public static class Appointment {
        private String customerName;
        private String serviceType;
        private LocalDateTime scheduledDate;
        private String vehicleInfo;
        private String status;
        
        public Appointment(String customerName, String serviceType, LocalDateTime scheduledDate) {
            this.customerName = customerName;
            this.serviceType = serviceType;
            this.scheduledDate = scheduledDate;
            this.status = "pending";
        }
        
        // Getters and setters
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }
        
        public String getServiceType() { return serviceType; }
        public void setServiceType(String serviceType) { this.serviceType = serviceType; }
        
        public LocalDateTime getScheduledDate() { return scheduledDate; }
        public void setScheduledDate(LocalDateTime scheduledDate) { this.scheduledDate = scheduledDate; }
        
        public String getVehicleInfo() { return vehicleInfo; }
        public void setVehicleInfo(String vehicleInfo) { this.vehicleInfo = vehicleInfo; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
    
    /**
     * Validation result container
     */
    public static class ValidationResult {
        private final boolean valid;
        private final List<String> errors;
        
        public ValidationResult(boolean valid, List<String> errors) {
            this.valid = valid;
            this.errors = errors;
        }
        
        public boolean isValid() { return valid; }
        public List<String> getErrors() { return errors; }
    }
    
    /**
     * Demo execution
     */
    public static void main(String[] args) {
        System.out.println("RL Auto Shop - Java Appointment Processor");
        System.out.println("==========================================\n");
        
        AppointmentValidator validator = new AppointmentValidator();
        
        // Valid appointment
        Appointment validAppointment = new Appointment(
            "Jane Smith",
            "Oil Change",
            LocalDateTime.now().plusDays(3)
        );
        validAppointment.setVehicleInfo("2021 Honda Accord");
        
        ValidationResult result1 = validator.validateAppointment(validAppointment);
        System.out.println("Valid Appointment Test:");
        System.out.println("Result: " + (result1.isValid() ? "PASSED" : "FAILED"));
        System.out.println(gson.toJson(validAppointment));
        System.out.println();
        
        // Invalid appointment (past date)
        Appointment invalidAppointment = new Appointment(
            "John Doe",
            "Brake Service",
            LocalDateTime.now().minusDays(1)
        );
        
        ValidationResult result2 = validator.validateAppointment(invalidAppointment);
        System.out.println("Invalid Appointment Test:");
        System.out.println("Result: " + (result2.isValid() ? "PASSED" : "FAILED"));
        System.out.println("Errors: " + result2.getErrors());
        System.out.println();
        
        System.out.println("Java service demonstration complete.");
    }
}
