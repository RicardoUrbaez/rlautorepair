package main

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Appointment represents a service appointment
type Appointment struct {
	ID           string    `json:"id"`
	CustomerName string    `json:"customer_name"`
	ServiceType  string    `json:"service_type"`
	ScheduledAt  time.Time `json:"scheduled_at"`
	Status       string    `json:"status"`
	ProcessedAt  time.Time `json:"processed_at,omitempty"`
}

// AppointmentProcessor handles concurrent appointment processing
type AppointmentProcessor struct {
	mu     sync.Mutex
	stats  ProcessingStats
}

// ProcessingStats tracks processing metrics
type ProcessingStats struct {
	TotalProcessed int           `json:"total_processed"`
	AverageTime    time.Duration `json:"average_time_ms"`
	Errors         int           `json:"errors"`
}

// NewProcessor creates a new appointment processor
func NewProcessor() *AppointmentProcessor {
	return &AppointmentProcessor{
		stats: ProcessingStats{},
	}
}

// ProcessBatch processes multiple appointments concurrently
func (p *AppointmentProcessor) ProcessBatch(appointments []Appointment) []Appointment {
	var wg sync.WaitGroup
	results := make([]Appointment, len(appointments))
	
	for i, apt := range appointments {
		wg.Add(1)
		go func(idx int, a Appointment) {
			defer wg.Done()
			
			start := time.Now()
			
			// Simulate processing
			time.Sleep(time.Millisecond * 100)
			
			// Update appointment
			a.ProcessedAt = time.Now()
			a.Status = "confirmed"
			
			results[idx] = a
			
			// Update stats
			p.mu.Lock()
			p.stats.TotalProcessed++
			p.stats.AverageTime = time.Since(start)
			p.mu.Unlock()
		}(i, apt)
	}
	
	wg.Wait()
	return results
}

// GetStats returns current processing statistics
func (p *AppointmentProcessor) GetStats() ProcessingStats {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.stats
}

func main() {
	fmt.Println("RL Auto Shop - Go Service CLI")
	fmt.Println("==============================\n")
	
	processor := NewProcessor()
	
	// Create sample appointments
	appointments := []Appointment{
		{
			ID:           uuid.New().String(),
			CustomerName: "Alice Johnson",
			ServiceType:  "Oil Change",
			ScheduledAt:  time.Now().Add(24 * time.Hour),
			Status:       "pending",
		},
		{
			ID:           uuid.New().String(),
			CustomerName: "Bob Wilson",
			ServiceType:  "Brake Inspection",
			ScheduledAt:  time.Now().Add(48 * time.Hour),
			Status:       "pending",
		},
		{
			ID:           uuid.New().String(),
			CustomerName: "Carol Davis",
			ServiceType:  "Tire Rotation",
			ScheduledAt:  time.Now().Add(72 * time.Hour),
			Status:       "pending",
		},
	}
	
	fmt.Println("Processing appointments concurrently...")
	start := time.Now()
	
	processed := processor.ProcessBatch(appointments)
	
	elapsed := time.Since(start)
	
	// Display results
	fmt.Printf("\nProcessed %d appointments in %v\n\n", len(processed), elapsed)
	
	for _, apt := range processed {
		data, _ := json.MarshalIndent(apt, "", "  ")
		fmt.Println(string(data))
		fmt.Println()
	}
	
	// Display statistics
	stats := processor.GetStats()
	statsJSON, _ := json.MarshalIndent(stats, "", "  ")
	fmt.Println("Processing Statistics:")
	fmt.Println(string(statsJSON))
	
	fmt.Println("\nGo service demonstration complete.")
}
