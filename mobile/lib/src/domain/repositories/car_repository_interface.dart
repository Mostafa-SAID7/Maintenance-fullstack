import '../entities/car_entity.dart';

abstract class CarRepositoryInterface {
  /// Get all cars for the current user
  Future<List<CarEntity>> getCars();

  /// Get a car by ID
  Future<CarEntity?> getCarById(String id);

  /// Create a new car
  Future<CarEntity> createCar(CarEntity car);

  /// Update an existing car
  Future<CarEntity> updateCar(CarEntity car);

  /// Delete a car
  Future<bool> deleteCar(String id);

  /// Get cars by owner ID
  Future<List<CarEntity>> getCarsByOwner(String ownerId);

  /// Search cars by VIN or make/model
  Future<List<CarEntity>> searchCars(String query);

  /// Get upcoming maintenance for a car
  Future<List<CarEntity>> getCarsWithUpcomingMaintenance();

  /// Cache cars locally
  Future<void> cacheCars(List<CarEntity> cars);

  /// Get cached cars
  Future<List<CarEntity>> getCachedCars();
}