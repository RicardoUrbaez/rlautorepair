package com.rlautoshop.service;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.*;
import java.util.stream.Collectors;

/**
 * VehicleService - Manages vehicle inventory and maintenance records
 * Demonstrates object-oriented design and data relationships
 */
public class VehicleService {
    
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    private Map<String, Vehicle> vehicles;
    private Map<String, List<MaintenanceRecord>> maintenanceHistory;
    
    public VehicleService() {
        this.vehicles = new HashMap<>();
        this.maintenanceHistory = new HashMap<>();
    }
    
    /**
     * Vehicle entity
     */
    public static class Vehicle {
        private final String id;
        private String vin;
        private String make;
        private String model;
        private int year;
        private String color;
        private int mileage;
        private String ownerId;
        
        public Vehicle(String vin, String make, String model, int year) {
            this.id = UUID.randomUUID().toString();
            this.vin = vin;
            this.make = make;
            this.model = model;
            this.year = year;
        }
        
        // Getters and setters
        public String getId() { return id; }
        public String getVin() { return vin; }
        public void setVin(String vin) { this.vin = vin; }
        public String getMake() { return make; }
        public void setMake(String make) { this.make = make; }
        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
        public int getYear() { return year; }
        public void setYear(int year) { this.year = year; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
        public int getMileage() { return mileage; }
        public void setMileage(int mileage) { this.mileage = mileage; }
        public String getOwnerId() { return ownerId; }
        public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
        
        public String getDisplayName() {
            return year + " " + make + " " + model;
        }
    }
    
    /**
     * Maintenance record
     */
    public static class MaintenanceRecord {
        private final String id;
        private final String vehicleId;
        private Date serviceDate;
        private String serviceType;
        private String description;
        private double cost;
        private int mileageAtService;
        private String technicianName;
        
        public MaintenanceRecord(String vehicleId, String serviceType) {
            this.id = UUID.randomUUID().toString();
            this.vehicleId = vehicleId;
            this.serviceType = serviceType;
            this.serviceDate = new Date();
        }
        
        // Getters and setters
        public String getId() { return id; }
        public String getVehicleId() { return vehicleId; }
        public Date getServiceDate() { return serviceDate; }
        public void setServiceDate(Date serviceDate) { this.serviceDate = serviceDate; }
        public String getServiceType() { return serviceType; }
        public void setServiceType(String serviceType) { this.serviceType = serviceType; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public double getCost() { return cost; }
        public void setCost(double cost) { this.cost = cost; }
        public int getMileageAtService() { return mileageAtService; }
        public void setMileageAtService(int mileageAtService) { this.mileageAtService = mileageAtService; }
        public String getTechnicianName() { return technicianName; }
        public void setTechnicianName(String technicianName) { this.technicianName = technicianName; }
    }
    
    /**
     * Add a vehicle to the system
     */
    public Vehicle addVehicle(String vin, String make, String model, int year) {
        Vehicle vehicle = new Vehicle(vin, make, model, year);
        vehicles.put(vehicle.getId(), vehicle);
        maintenanceHistory.put(vehicle.getId(), new ArrayList<>());
        return vehicle;
    }
    
    /**
     * Get vehicle by ID
     */
    public Optional<Vehicle> getVehicle(String id) {
        return Optional.ofNullable(vehicles.get(id));
    }
    
    /**
     * Find vehicles by owner
     */
    public List<Vehicle> getVehiclesByOwner(String ownerId) {
        return vehicles.values().stream()
                .filter(v -> ownerId.equals(v.getOwnerId()))
                .collect(Collectors.toList());
    }
    
    /**
     * Add maintenance record
     */
    public MaintenanceRecord addMaintenanceRecord(String vehicleId, String serviceType) {
        if (!vehicles.containsKey(vehicleId)) {
            throw new IllegalArgumentException("Vehicle not found: " + vehicleId);
        }
        
        MaintenanceRecord record = new MaintenanceRecord(vehicleId, serviceType);
        maintenanceHistory.get(vehicleId).add(record);
        return record;
    }
    
    /**
     * Get maintenance history for a vehicle
     */
    public List<MaintenanceRecord> getMaintenanceHistory(String vehicleId) {
        return new ArrayList<>(maintenanceHistory.getOrDefault(vehicleId, new ArrayList<>()));
    }
    
    /**
     * Calculate total maintenance cost for a vehicle
     */
    public double getTotalMaintenanceCost(String vehicleId) {
        return maintenanceHistory.getOrDefault(vehicleId, new ArrayList<>())
                .stream()
                .mapToDouble(MaintenanceRecord::getCost)
                .sum();
    }
    
    /**
     * Find vehicles needing service (high mileage)
     */
    public List<Vehicle> findVehiclesNeedingService(int mileageThreshold) {
        return vehicles.values().stream()
                .filter(v -> v.getMileage() > mileageThreshold)
                .collect(Collectors.toList());
    }
    
    /**
     * Demo execution
     */
    public static void main(String[] args) {
        System.out.println("RL Auto Shop - Vehicle Service");
        System.out.println("===============================\n");
        
        VehicleService service = new VehicleService();
        
        // Add vehicles
        Vehicle vehicle1 = service.addVehicle("1HGCM82633A123456", "Honda", "Accord", 2020);
        vehicle1.setColor("Silver");
        vehicle1.setMileage(45000);
        vehicle1.setOwnerId("customer-001");
        
        Vehicle vehicle2 = service.addVehicle("1FTFW1ET5EFC12345", "Ford", "F-150", 2019);
        vehicle2.setColor("Blue");
        vehicle2.setMileage(62000);
        vehicle2.setOwnerId("customer-002");
        
        Vehicle vehicle3 = service.addVehicle("5TDJKRFH0HS123456", "Toyota", "Highlander", 2021);
        vehicle3.setColor("White");
        vehicle3.setMileage(28000);
        vehicle3.setOwnerId("customer-001");
        
        System.out.println("Added " + service.vehicles.size() + " vehicles\n");
        
        // Add maintenance records
        MaintenanceRecord record1 = service.addMaintenanceRecord(vehicle1.getId(), "Oil Change");
        record1.setCost(45.99);
        record1.setMileageAtService(45000);
        record1.setTechnicianName("Mike Johnson");
        record1.setDescription("Regular oil change with synthetic oil");
        
        MaintenanceRecord record2 = service.addMaintenanceRecord(vehicle1.getId(), "Brake Inspection");
        record2.setCost(89.99);
        record2.setMileageAtService(45000);
        record2.setTechnicianName("Sarah Smith");
        
        MaintenanceRecord record3 = service.addMaintenanceRecord(vehicle2.getId(), "Tire Rotation");
        record3.setCost(35.00);
        record3.setMileageAtService(62000);
        record3.setTechnicianName("Mike Johnson");
        
        // Display vehicle information
        System.out.println("All Vehicles:");
        for (Vehicle v : service.vehicles.values()) {
            System.out.println(gson.toJson(v));
            System.out.println("Total maintenance cost: $" + 
                String.format("%.2f", service.getTotalMaintenanceCost(v.getId())));
            System.out.println();
        }
        
        // Find vehicles needing service
        System.out.println("Vehicles with high mileage (>60,000):");
        List<Vehicle> highMileage = service.findVehiclesNeedingService(60000);
        highMileage.forEach(v -> System.out.println("  - " + v.getDisplayName() + 
            " (" + v.getMileage() + " miles)"));
        System.out.println();
        
        // Show maintenance history
        System.out.println("Maintenance history for " + vehicle1.getDisplayName() + ":");
        List<MaintenanceRecord> history = service.getMaintenanceHistory(vehicle1.getId());
        for (MaintenanceRecord record : history) {
            System.out.println("  - " + record.getServiceType() + 
                " ($" + String.format("%.2f", record.getCost()) + 
                ") by " + record.getTechnicianName());
        }
        
        System.out.println("\nVehicle service demonstration complete.");
    }
}
