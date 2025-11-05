/// Domain entity for Car
class CarEntity {
  final String id;
  final String vin;
  final String make;
  final String model;
  final int year;
  final String color;
  final int mileage;
  final DateTime purchaseDate;
  final DateTime? lastMaintenanceDate;
  final String? ownerId;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  const CarEntity({
    required this.id,
    required this.vin,
    required this.make,
    required this.model,
    required this.year,
    required this.color,
    required this.mileage,
    required this.purchaseDate,
    this.lastMaintenanceDate,
    this.ownerId,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  CarEntity copyWith({
    String? id,
    String? vin,
    String? make,
    String? model,
    int? year,
    String? color,
    int? mileage,
    DateTime? purchaseDate,
    DateTime? lastMaintenanceDate,
    String? ownerId,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return CarEntity(
      id: id ?? this.id,
      vin: vin ?? this.vin,
      make: make ?? this.make,
      model: model ?? this.model,
      year: year ?? this.year,
      color: color ?? this.color,
      mileage: mileage ?? this.mileage,
      purchaseDate: purchaseDate ?? this.purchaseDate,
      lastMaintenanceDate: lastMaintenanceDate ?? this.lastMaintenanceDate,
      ownerId: ownerId ?? this.ownerId,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is CarEntity && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}