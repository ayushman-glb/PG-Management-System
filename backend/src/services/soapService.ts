import * as soap from "soap";
import { Express } from "express";
import { Container } from "../container";
import { logger } from "../utils/logger";

const wsdlXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions name="BillingService"
   targetNamespace="http://roombae.com/soap/billing"
   xmlns="http://schemas.xmlsoap.org/wsdl/"
   xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
   xmlns:tns="http://roombae.com/soap/billing"
   xmlns:xsd="http://www.w3.org/2001/XMLSchema">

   <message name="GetInvoiceDetailsRequest">
      <part name="invoiceNumber" type="xsd:string"/>
   </message>
   <message name="GetInvoiceDetailsResponse">
      <part name="status" type="xsd:string"/>
      <part name="totalAmount" type="xsd:string"/>
      <part name="paymentMethod" type="xsd:string"/>
   </message>

   <portType name="BillingPortType">
      <operation name="GetInvoiceDetails">
         <input message="tns:GetInvoiceDetailsRequest"/>
         <output message="tns:GetInvoiceDetailsResponse"/>
      </operation>
   </portType>

   <binding name="BillingBinding" type="tns:BillingPortType">
      <soap:binding style="rpc" transport="http://schemas.xmlsoap.org/soap/http"/>
      <operation name="GetInvoiceDetails">
         <soap:operation soapAction="GetInvoiceDetails"/>
         <input><soap:body use="literal" namespace="http://roombae.com/soap/billing"/></input>
         <output><soap:body use="literal" namespace="http://roombae.com/soap/billing"/></output>
      </operation>
   </binding>

   <service name="BillingService">
      <port name="BillingPort" binding="tns:BillingBinding">
         <soap:address location="https://pg-management-system-boxb.onrender.com/soap/billing"/>
      </port>
   </service>
</definitions>`;

const soapServiceImplementation = {
  BillingService: {
    BillingPort: {
      GetInvoiceDetails: (
        args: { invoiceNumber: string },
        callback?: (res: any) => void,
      ) => {
        Container.billingRepository
          .findPaymentByInvoiceNumber(args.invoiceNumber)
          .then((invoice) => {
            if (invoice) {
              const result = {
                status: invoice.status,
                totalAmount: invoice.totalAmount.toString(),
                paymentMethod: invoice.paymentMethod,
              };
              if (callback) callback(result);
              return result;
            }
            const notFound = {
              status: "NOT_FOUND",
              totalAmount: "0",
              paymentMethod: "N/A",
            };
            if (callback) callback(notFound);
            return notFound;
          })
          .catch(() => {
            const errRes = {
              status: "ERROR",
              totalAmount: "0",
              paymentMethod: "N/A",
            };
            if (callback) callback(errRes);
            return errRes;
          });
      },
    },
  },
};

export function setupSoapServer(app: Express) {
  try {
    soap.listen(
      app,
      "/soap/billing",
      soapServiceImplementation as any,
      wsdlXml,
      () => {
        logger.info(
          "✅ SOAP ERP Billing WSDL service initialized at /soap/billing?wsdl",
        );
      },
    );
  } catch (err: any) {
    logger.warn("SOAP server initialization warning:", err.message);
  }
}
