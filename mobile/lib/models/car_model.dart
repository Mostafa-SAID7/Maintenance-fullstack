class Car {
  final int id;
  final String make;
  final String model;
  final int year;
  final String licensePlate;
  final String vin;
  final int mileage;
  final String color;
  final String ownerId;
  final DateTime createdAt;
  final DateTime? lastMaintenanceDate;
  final String ownerName;

  Car({
    required this.id,
    required this.make,
    required this.model,
    required this.year,
    required this.licensePlate,
    required this.vin,
    required this.mileage,
    required this.color,
    required this.ownerId,
    required this.createdAt,
    this.lastMaintenanceDate,
    required this.ownerName,
  });

  factory Car.fromJson(Map<String, dynamic> json) {
    return Car(
      id: json['id'],
      make: json['make'],
      model: json['model'],
      year: json['year'],
      licensePlate: json['licensePlate'],
      vin: json['vin'],
      mileage: json['mileage'],
      color: json['color'],
      ownerId: json['ownerId'],
      createdAt: DateTime.parse(json['createdAt']),
      lastMaintenanceDate: json['lastMaintenanceDate'] != null
          ? DateTime.parse(json['lastMaintenanceDate'])
          : null,
      ownerName: json['ownerName'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'make': make,
      'model': model,
      'year': year,
      'licensePlate': licensePlate,
      'vin': vin,
      'mileage': mileage,
      'color': color,
      'ownerId': ownerId,
      'createdAt': createdAt.toIso8601String(),
      'lastMaintenanceDate': lastMaintenanceDate?.toIso8601String(),
      'ownerName': ownerName,
    };
  }
}