"""
Python Microservice
A simple utility service for data validation and processing
"""

from typing import Dict, List, Any
import json
from datetime import datetime


class DataValidator:
    """Validates and processes incoming data"""
    
    @staticmethod
    def validate_appointment(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates appointment data structure
        
        Args:
            data: Dictionary containing appointment information
            
        Returns:
            Dictionary with validation results
        """
        required_fields = ['customer_name', 'appointment_date', 'service_type']
        missing_fields = [field for field in required_fields if field not in data]
        
        return {
            'valid': len(missing_fields) == 0,
            'missing_fields': missing_fields,
            'timestamp': datetime.now().isoformat()
        }
    
    @staticmethod
    def process_vehicle_data(vehicle_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes and enriches vehicle information
        
        Args:
            vehicle_info: Dictionary with vehicle details
            
        Returns:
            Enriched vehicle data
        """
        processed = vehicle_info.copy()
        
        if 'year' in processed and 'make' in processed and 'model' in processed:
            processed['display_name'] = f"{processed['year']} {processed['make']} {processed['model']}"
        
        processed['processed_at'] = datetime.now().isoformat()
        
        return processed


def main():
    """Demo usage of the service"""
    validator = DataValidator()
    
    # Example appointment validation
    sample_appointment = {
        'customer_name': 'John Doe',
        'appointment_date': '2025-12-01',
        'service_type': 'Oil Change'
    }
    
    result = validator.validate_appointment(sample_appointment)
    print("Appointment Validation:")
    print(json.dumps(result, indent=2))
    
    # Example vehicle data processing
    sample_vehicle = {
        'year': 2020,
        'make': 'Toyota',
        'model': 'Camry',
        'vin': '1HGBH41JXMN109186'
    }
    
    processed = validator.process_vehicle_data(sample_vehicle)
    print("\nVehicle Data Processing:")
    print(json.dumps(processed, indent=2))


if __name__ == '__main__':
    main()
