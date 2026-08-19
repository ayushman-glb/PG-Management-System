import * as soap from "soap";
import { Express, Request, Response, NextFunction } from "express";
import { Container } from "../container";
import { logger } from "../utils/logger";
import { env } from "../config/env";

// ─── SOAP Billing API-Key Guard (Section 2 fix) ────────────────────────────
// Reads SOAP_BILLING_API_KEY from process.env at request time (not at module
// load time) so it picks up values set after the module is first imported.
//
// ⚠️  REQUIRED ENV VAR: SOAP_BILLING_API_KEY
//     A strong random secret (e.g. `openssl rand -hex 32`).
//     ERP/internal callers must include the header:  X-API-Key: <value>
//     In dev/test the check is advisory (warn-only). In production it is
//     enforced and requests without a valid key receive HTTP 401.
export function soapBillingAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // WSDL introspection requests (?wsdl) are GET — allow without key so WSDL
  // can be fetched to generate client stubs in trusted internal networks.
  if (req.method === "GET" && typeof req.query.wsdl !== "undefined") {
    return next();
  }

  const configuredKey = process.env.SOAP_BILLING_API_KEY;
  const providedKey   = req.headers["x-api-key"];

  if (!configuredKey) {
    if (env.NODE_ENV === "production") {
      // Fail-closed: misconfigured production — reject rather than expose data.
      logger.error("SOAP /soap/billing: SOAP_BILLING_API_KEY is not set in production. Rejecting request.");
      res.status(401).json({ success: false, message: "SOAP endpoint not configured." });
      return;
    }
    // Dev/test: warn and allow through so local development is not blocked.
    logger.warn("SOAP /soap/billing: SOAP_BILLING_API_KEY not set — skipping auth check in non-production.");
    return next();
  }

  if (!providedKey || providedKey !== configuredKey) {
    logger.warn("SOAP /soap/billing: Invalid or missing X-API-Key.", {
      ip: req.ip,
      hasKey: Boolean(providedKey),
    });
    res.status(401).json({ success: false, message: "Unauthorized: invalid SOAP API key." });
    return;
  }

  next();
}

/**
 * Defense-in-depth XXE & DTD injection filter for SOAP endpoint.
 * Rejects any incoming payload that contains DOCTYPE declarations or ENTITY references
 * before the XML is passed to the underlying XML parser.
 */
export function soapXxePreFilter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.method === "GET") {
    return next();
  }

  const rawBody = typeof req.body === "string"
    ? req.body
    : Buffer.isBuffer(req.body)
    ? req.body.toString("utf8")
    : "";

  // Reject any payload containing DOCTYPE declarations or ENTITY declarations (XXE defense-in-depth)
  const containsDoctype = /<!DOCTYPE/i.test(rawBody);
  const containsEntity = /<!ENTITY/i.test(rawBody);

  if (containsDoctype || containsEntity) {
    logger.warn("SOAP /soap/billing: XXE payload rejected (DOCTYPE/ENTITY declaration detected)", {
      ip: req.ip,
      containsDoctype,
      containsEntity,
    });
    res.status(400).set("Content-Type", "application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>soap:Client</faultcode>
      <faultstring>XML External Entity (XXE) and DTD declarations are strictly prohibited.</faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`
    );
    return;
  }

  next();
}

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
         <soap:address location="${env.API_BASE_URL.replace(/\/$/, "")}/soap/billing"/>
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
        const invNum = (args && typeof args.invoiceNumber === "string") ? args.invoiceNumber.trim() : "";
        Container.billingRepository
          .findPaymentByInvoiceNumber(invNum)
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
    soap.listen(app, {
      path: "/soap/billing",
      services: soapServiceImplementation as any,
      xml: wsdlXml,
      escapeXML: true,
      callback: () => {
        logger.info(
          "✅ SOAP ERP Billing WSDL service initialized at /soap/billing?wsdl",
        );
      },
    });
  } catch (err: any) {
    logger.warn("SOAP server initialization warning:", err.message);
  }
}

