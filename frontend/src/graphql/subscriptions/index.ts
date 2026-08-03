import { gql } from "@apollo/client";

export const NOTIFICATION_SUBSCRIPTION = gql`
  subscription OnNotificationCreated {
    notificationCreated {
      id
      title
      message
      type
      createdAt
    }
  }
`;
