import { gql } from "@apollo/client";

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
