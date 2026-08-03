import { gql } from "@apollo/client";

export const RESIDENT_FRAGMENT = gql`
  fragment ResidentFields on Resident {
    id
    name
    email
    phone
    roomNumber
    bedNumber
    status
  }
`;
