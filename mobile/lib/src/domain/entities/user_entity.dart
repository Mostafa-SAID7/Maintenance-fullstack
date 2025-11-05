/// Domain entity for User
class UserEntity {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final bool isActive;
  final DateTime? lastLoginAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? phone;
  final String? avatar;

  const UserEntity({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.isActive = true,
    this.lastLoginAt,
    required this.createdAt,
    required this.updatedAt,
    this.phone,
    this.avatar,
  });

  UserEntity copyWith({
    String? id,
    String? email,
    String? firstName,
    String? lastName,
    String? role,
    bool? isActive,
    DateTime? lastLoginAt,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? phone,
    String? avatar,
  }) {
    return UserEntity(
      id: id ?? this.id,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      role: role ?? this.role,
      isActive: isActive ?? this.isActive,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      phone: phone ?? this.phone,
      avatar: avatar ?? this.avatar,
    );
  }

  String get fullName => '$firstName $lastName';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is UserEntity && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}