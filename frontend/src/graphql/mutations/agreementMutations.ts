import { gql } from "@apollo/client";

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
