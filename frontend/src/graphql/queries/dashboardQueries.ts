import { gql } from "@apollo/client";

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
