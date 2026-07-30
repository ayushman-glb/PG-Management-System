import { gql } from '@apollo/client';

export const GET_OWNER_DASHBOARD = gql`
  query GetOwnerDashboard($ownerId: ID!) {
    ownerMetrics(ownerId: $ownerId) {
      totalProperties
      mrr
      totalBeds
      occupiedBeds
      occupancyRatePercent
      activeComplaints
      pendingDuesAmount
    }
    pgs {
      id
      name
      city
      capacity
      currentOccupancy
      status
    }
    complaints(priority: HIGH) {
      id
      ticketCode
      title
      priority
      status
      createdAt
    }
  }
`;

export const GET_RESIDENT_PORTAL = gql`
  query GetResidentPortal($residentId: ID!) {
    resident(id: $residentId) {
      id
      name
      email
      phone
      gender
      occupation
      status
      moveInDate
      rentDueDate
    }
    agreements(residentId: $residentId) {
      id
      agreementNumber
      status
      rentAmount
      securityDeposit
      signatures {
        id
        signerType
        signerName
        timestamp
      }
    }
  }
`;

export const SIGN_AGREEMENT_MUTATION = gql`
  mutation SignAgreement($agreementId: ID!, $input: SignatureInput!) {
    signAgreement(agreementId: $agreementId, input: $input) {
      id
      agreementNumber
      status
      signatures {
        id
        signerType
        signerName
      }
    }
  }
`;
