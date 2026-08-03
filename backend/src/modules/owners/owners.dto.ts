export interface OwnerOnboardingDTO {
  propertyDetails: {
    propertyName: string;
    address: string;
    totalRooms: number;
    totalBeds: number;
  };
  ownerIdentity: {
    fullName: string;
    email: string;
    phone: string;
    govtIdNumber: string;
  };
  bankingDetails: {
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
  };
}
