/// Domain entity for Maintenance
class MaintenanceEntity {
  final String id;
  final String carId;
  final String serviceTypeId;
  final DateTime serviceDate;
  final String description;
  final double cost;
  final int mileage;
  final String? serviceProvider;
  final List<String> partsUsed;
  final String status;
  final DateTime? nextServiceDate;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  const MaintenanceEntity({
    required this.id,
    required this.carId,
    required this.serviceTypeId,
    required this.serviceDate,
    required this.description,
    required this.cost,
    required this.mileage,
    this.serviceProvider,
    this.partsUsed = const [],
    this.status = 'completed',
    this.nextServiceDate,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  MaintenanceEntity copyWith({
    String? id,
    String? carId,
    String? serviceTypeId,
    DateTime? serviceDate,
    String? description,
    double? cost,
    int? mileage,
    String? serviceProvider,
    List<String>? partsUsed,
    String? status,
    DateTime? nextServiceDate,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return MaintenanceEntity(
      id: id ?? this.id,
      carId: carId ?? this.carId,
      serviceTypeId: serviceTypeId ?? this.serviceTypeId,
      serviceDate: serviceDate ?? this.serviceDate,
      description: description ?? this.description,
      cost: cost ?? this.cost,
      mileage: mileage ?? this.mileage,
      serviceProvider: serviceProvider ?? this.serviceProvider,
      partsUsed: partsUsed ?? this.partsUsed,
      status: status ?? this.status,
      nextServiceDate: nextServiceDate ?? this.nextServiceDate,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is MaintenanceEntity && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}