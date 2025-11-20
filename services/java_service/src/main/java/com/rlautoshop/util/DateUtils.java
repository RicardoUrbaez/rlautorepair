package com.rlautoshop.util;

import java.text.SimpleDateFormat;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.Date;

/**
 * DateUtils - Utility class for date and time operations
 * Demonstrates utility design patterns in Java
 */
public class DateUtils {
    
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DISPLAY_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");
    private static final SimpleDateFormat LEGACY_FORMATTER = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    
    /**
     * Convert Date to LocalDateTime
     */
    public static LocalDateTime toLocalDateTime(Date date) {
        return date.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
    }
    
    /**
     * Convert LocalDateTime to Date
     */
    public static Date toDate(LocalDateTime localDateTime) {
        return Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant());
    }
    
    /**
     * Format LocalDateTime for display
     */
    public static String formatForDisplay(LocalDateTime dateTime) {
        return dateTime.format(DISPLAY_FORMATTER);
    }
    
    /**
     * Parse ISO format string to LocalDateTime
     */
    public static LocalDateTime parseISOString(String isoString) {
        return LocalDateTime.parse(isoString, ISO_FORMATTER);
    }
    
    /**
     * Check if a date is in the past
     */
    public static boolean isPast(LocalDateTime dateTime) {
        return dateTime.isBefore(LocalDateTime.now());
    }
    
    /**
     * Check if a date is in the future
     */
    public static boolean isFuture(LocalDateTime dateTime) {
        return dateTime.isAfter(LocalDateTime.now());
    }
    
    /**
     * Get the number of days between two dates
     */
    public static long daysBetween(LocalDateTime start, LocalDateTime end) {
        return Duration.between(start, end).toDays();
    }
    
    /**
     * Add days to a date
     */
    public static LocalDateTime addDays(LocalDateTime dateTime, int days) {
        return dateTime.plusDays(days);
    }
    
    /**
     * Get start of day
     */
    public static LocalDateTime startOfDay(LocalDateTime dateTime) {
        return dateTime.toLocalDate().atStartOfDay();
    }
    
    /**
     * Get end of day
     */
    public static LocalDateTime endOfDay(LocalDateTime dateTime) {
        return dateTime.toLocalDate().atTime(23, 59, 59, 999999999);
    }
    
    /**
     * Check if two dates are on the same day
     */
    public static boolean isSameDay(LocalDateTime date1, LocalDateTime date2) {
        return date1.toLocalDate().equals(date2.toLocalDate());
    }
    
    /**
     * Get current timestamp as formatted string
     */
    public static String getCurrentTimestamp() {
        return LocalDateTime.now().format(ISO_FORMATTER);
    }
    
    /**
     * Calculate business hours between two dates (Mon-Fri, 9am-5pm)
     */
    public static long calculateBusinessHours(LocalDateTime start, LocalDateTime end) {
        long hours = 0;
        LocalDateTime current = start;
        
        while (current.isBefore(end)) {
            DayOfWeek day = current.getDayOfWeek();
            int hour = current.getHour();
            
            // Check if it's a weekday and within business hours
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY && 
                hour >= 9 && hour < 17) {
                hours++;
            }
            
            current = current.plusHours(1);
        }
        
        return hours;
    }
    
    /**
     * Demo execution
     */
    public static void main(String[] args) {
        System.out.println("RL Auto Shop - Date Utilities");
        System.out.println("==============================\n");
        
        LocalDateTime now = LocalDateTime.now();
        System.out.println("Current time: " + formatForDisplay(now));
        System.out.println("ISO format: " + getCurrentTimestamp());
        System.out.println();
        
        LocalDateTime appointmentDate = now.plusDays(3);
        System.out.println("Appointment scheduled for: " + formatForDisplay(appointmentDate));
        System.out.println("Days until appointment: " + daysBetween(now, appointmentDate));
        System.out.println("Is in future: " + isFuture(appointmentDate));
        System.out.println();
        
        LocalDateTime startOfToday = startOfDay(now);
        LocalDateTime endOfToday = endOfDay(now);
        System.out.println("Start of today: " + formatForDisplay(startOfToday));
        System.out.println("End of today: " + formatForDisplay(endOfToday));
        System.out.println();
        
        LocalDateTime businessStart = now.minusDays(2);
        long businessHours = calculateBusinessHours(businessStart, now);
        System.out.println("Business hours in last 2 days: " + businessHours);
        
        System.out.println("\nDate utilities demonstration complete.");
    }
}
