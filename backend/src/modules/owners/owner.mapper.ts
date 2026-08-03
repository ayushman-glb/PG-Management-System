import { Owner } from '@prisma/client';

export class OwnerMapper {
  static toDTO(owner: Owner) {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      address: owner.address,
      upiId: owner.upiId,
      bankName: owner.bankName,
      accountNumber: owner.accountNumber,
    };
  }
}
