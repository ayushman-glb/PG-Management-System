export const typeDefs = `#graphql
  enum ResidentStatus {
    ACTIVE
    INACTIVE
    HOME
    ON_LEAVE
    HOLD
    LEAVING
    CHECKED_OUT
    WAITING
  }

  enum PGStatus {
    ACTIVE
    INACTIVE
    MAINTENANCE
    UPCOMING
  }

  enum AgreementStatus {
    PENDING
    SIGNED_BY_RESIDENT
    SIGNED_BY_OWNER
    COMPLETED
    EXPIRED
    RENEWAL_DUE
  }

  enum TicketStatus {
    OPEN
    IN_PROGRESS
    RESOLVED
    CLOSED
  }

  enum Priority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  enum FoodPreference {
    VEG
    NON_VEG
    JAIN
  }

  type Room {
    id: ID!
    floorId: ID!
    roomNumber: String!
    roomType: String!
    acType: String!
    washroomType: String!
    rentAmount: Float!
    beds: [Bed!]!
  }

  type Bed {
    id: ID!
    roomId: ID!
    bedNumber: String!
    status: BedStatus!
    isOccupied: Boolean!
  }

  type Invoice {
    id: ID!
    paymentId: ID!
    residentId: ID!
    pgId: ID!
    invoiceNumber: String!
    pdfUrl: String!
    generatedAt: String!
  }

  type Owner {
    id: ID!
    name: String!
    email: String!
    phone: String!
    address: String!
    aadhaarNumber: String!
    panNumber: String!
    upiId: String!
    bankName: String!
    accountNumber: String!
    emergencyContact: String!
    bio: String
    pgs: [PG!]!
  }

  type PG {
    id: ID!
    ownerId: ID!
    name: String!
    slug: String!
    logo: String!
    galleryImages: [String!]!
    description: String!
    amenities: [String!]!
    rules: [String!]!
    rentStartingFrom: Float!
    securityDeposit: Float!
    address: String!
    city: String!
    pincode: String!
    capacity: Int!
    currentOccupancy: Int!
    availableBeds: Int!
    status: PGStatus!
    residents: [Resident!]!
    mealSchedules: [MealSchedule!]!
    complaints: [Complaint!]!
  }

  type Resident {
    id: ID!
    name: String!
    email: String!
    phone: String!
    gender: String!
    age: Int!
    occupation: String!
    foodPreference: FoodPreference!
    status: ResidentStatus!
    moveInDate: String!
    rentDueDate: String!
    pgId: ID!
    bedId: ID!
  }

  type Signature {
    id: ID!
    signerType: String!
    signerName: String!
    signatureDataSvg: String!
    ipAddress: String!
    timestamp: String!
    hashHmac: String!
  }

  type Agreement {
    id: ID!
    agreementNumber: String!
    residentId: ID!
    ownerId: ID!
    pgId: ID!
    roomNumber: String!
    bedNumber: String!
    rentAmount: Float!
    securityDeposit: Float!
    maintenanceCharges: Float!
    noticePeriodDays: Int!
    curfewTime: String!
    visitorPolicy: String!
    damagePolicy: String!
    terminationClause: String!
    status: AgreementStatus!
    qrVerificationPayload: String
    signatures: [Signature!]!
  }

  type MealSchedule {
    id: ID!
    dayOfWeek: String!
    breakfastMenu: String!
    lunchMenu: String!
    snacksMenu: String!
    dinnerMenu: String!
    calories: Int!
    ratingAverage: Float!
    isSpecialDay: Boolean!
  }

  type Complaint {
    id: ID!
    ticketCode: String!
    category: String!
    title: String!
    description: String!
    priority: Priority!
    status: TicketStatus!
    assignedStaff: String
    createdAt: String!
  }

  type Payment {
    id: ID!
    invoiceNumber: String!
    baseAmount: Float!
    cgstAmount: Float!
    sgstAmount: Float!
    totalAmount: Float!
    paymentDate: String!
    status: String!
  }

  type OwnerMetrics {
    totalProperties: Int!
    mrr: Float!
    totalBeds: Int!
    occupiedBeds: Int!
    occupancyRatePercent: Float!
    activeComplaints: Int!
    pendingDuesAmount: Float!
  }

  enum BedStatus {
    AVAILABLE
    OCCUPIED
    RESERVED
    HOLD
    MAINTENANCE
    BLOCKED
    LOCKED_FOR_BOOKING
  }

  enum RoomTransferStatus {
    PENDING
    REVIEWING
    APPROVED
    REJECTED
    WAITING_ROOM
    SCHEDULED
    COMPLETED
    CANCELLED
  }

  enum BedHoldReason {
    MAINTENANCE
    RESERVED
    VIP_BOOKING
    CLEANING
    BLOCKED
    FUTURE_BOOKING
  }

  type ResidentStatusHistory {
    id: ID!
    residentId: ID!
    status: ResidentStatus!
    reason: String
    updatedBy: String
    createdAt: String!
  }

  type BedHold {
    id: ID!
    bedId: ID!
    reason: BedHoldReason!
    holdStartDate: String!
    holdEndDate: String
    createdBy: String
    notes: String
    isActive: Boolean!
    createdAt: String!
  }

  type RoomTransferRequest {
    id: ID!
    residentId: ID!
    pgId: ID!
    currentBedId: ID!
    targetBedId: ID
    preferredSharingType: String
    preferredRoomNumber: String
    reason: String!
    budget: Float
    preferredMoveDate: String
    additionalNotes: String
    priority: Priority!
    status: RoomTransferStatus!
    attachments: [String!]!
    rejectionReason: String
    scheduledDate: String
    completedAt: String
    createdAt: String!
  }

  type AuditLog {
    id: ID!
    userId: ID
    action: String!
    ipAddress: String!
    userAgent: String!
    details: String!
    timestamp: String!
  }

  type Notification {
    id: ID!
    userId: ID!
    title: String!
    message: String!
    type: String!
    isRead: Boolean!
    createdAt: String!
  }

  type Subscription {
    id: ID!
    planType: String!
    status: String!
    maxResidents: Int!
    maxProperties: Int!
    hasAnalytics: Boolean!
    hasPrioritySupport: Boolean!
    currentPeriodEnd: String!
  }

  type FineRule {
    id: ID!
    fineType: String!
    calculationType: String!
    amount: Float!
    percentage: Float
    perDayRate: Float
    maxFineAmount: Float
    gracePeriodDays: Int!
    isActive: Boolean!
  }

  type Fine {
    id: ID!
    fineType: String!
    amount: Float!
    reason: String!
    dueDate: String!
    status: String!
    paidAt: String
  }

  type GlobalSearchResult {
    query: String!
    resultsCount: Int!
    residents: [Resident!]!
    rooms: [Room!]!
    beds: [Bed!]!
    complaints: [Complaint!]!
    invoices: [Invoice!]!
    pgs: [PG!]!
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: String!
    phone: String
    phoneVerified: Boolean!
    emailVerified: Boolean!
    twoFactorEnabled: Boolean!
    twoFactorMethod: String
    accountStatus: String!
  }

  type AuthResponse {
    success: Boolean!
    message: String!
    accessToken: String
    refreshToken: String
    user: User
  }

  type Query {
    owners: [Owner!]!
    owner(id: ID!): Owner
    pgs(city: String, status: PGStatus): [PG!]!
    pg(id: ID!): PG
    residents(pgId: ID, status: ResidentStatus, search: String): [Resident!]!
    resident(id: ID!): Resident
    agreements(residentId: ID, ownerId: ID): [Agreement!]!
    agreement(id: ID!): Agreement
    complaints(pgId: ID, status: TicketStatus, priority: Priority): [Complaint!]!
    mealSchedules(pgId: ID!): [MealSchedule!]!
    payments(pgId: ID, status: String): [Payment!]!
    ownerMetrics(ownerId: ID!): OwnerMetrics!
    roomTransferRequests(pgId: ID, residentId: ID): [RoomTransferRequest!]!
    bedHolds(pgId: ID): [BedHold!]!
    residentStatusHistory(residentId: ID!): [ResidentStatusHistory!]!
    auditLogs(limit: Int): [AuditLog!]!
    notifications(userId: ID!): [Notification!]!
    globalSearch(query: String!, pgId: ID): GlobalSearchResult!
    fineRules(pgId: ID!): [FineRule!]!
    residentFines(residentId: ID!): [Fine!]!
    me(userId: ID!): User
    ownerProfile(userId: ID!): Owner
    residentProfile(userId: ID!): Resident
  }

  input SignatureInput {
    signerType: String!
    signerName: String!
    signatureDataSvg: String!
    ipAddress: String
  }

  type Mutation {
    signAgreement(agreementId: ID!, input: SignatureInput!): Agreement!
    changeResidentStatus(residentId: ID!, status: ResidentStatus!, reason: String): Resident!
    updateBedStatus(bedId: ID!, status: BedStatus!, notes: String): Boolean!
    createBedHold(bedId: ID!, reason: BedHoldReason!, holdStartDate: String, holdEndDate: String, notes: String): BedHold!
    releaseBedHold(holdId: ID!): Boolean!
    requestRoomTransfer(
      residentId: ID!
      pgId: ID!
      currentBedId: ID!
      preferredSharingType: String
      preferredRoomNumber: String
      reason: String!
      budget: Float
      preferredMoveDate: String
      additionalNotes: String
      priority: Priority
      attachments: [String!]
    ): RoomTransferRequest!
    approveRoomTransfer(requestId: ID!, targetBedId: ID, scheduledDate: String, notes: String): RoomTransferRequest!
    rejectRoomTransfer(requestId: ID!, rejectionReason: String!): RoomTransferRequest!
    completeRoomTransfer(requestId: ID!): RoomTransferRequest!
    convertRoomType(roomId: ID!, newType: String!): Boolean!
    createFineRule(pgId: ID!, fineType: String!, calculationType: String!, amount: Float!, gracePeriodDays: Int): FineRule!
    issueFine(residentId: ID!, fineType: String!, amount: Float!, reason: String!, dueDate: String!): Fine!
    waiveFine(fineId: ID!, ownerId: ID!): Fine!
    register(name: String!, email: String!, password: String!, role: String, phone: String): AuthResponse!
    login(identifier: String!, password: String!): AuthResponse!
    logout: Boolean!
    sendPhoneOTP(phone: String!): AuthResponse!
    verifyPhoneOTP(phone: String!, otp: String!): AuthResponse!
    sendEmailOTP(email: String!): AuthResponse!
    verifyEmailOTP(email: String!, code: String!): AuthResponse!
    enable2FA(userId: ID!): AuthResponse!
    disable2FA(userId: ID!): AuthResponse!
  }
`;
