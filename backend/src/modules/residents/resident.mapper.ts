export class ResidentMapper {
  static toDTO(resident: any) {
    return {
      id: resident.id,
      name: resident.name,
      email: resident.email,
      phone: resident.phone,
      gender: resident.gender,
      status: resident.status,
      moveInDate: resident.moveInDate,
      rentDueDate: resident.rentDueDate
    };
  }
}
